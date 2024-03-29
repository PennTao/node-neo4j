// user.js
// User model logic.

var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(
    process.env['NEO4J_URL'] ||
    process.env['GRAPHENEDB_URL'] ||
    'http://localhost:7474'
);
var createtime = 0;
var followtime = 0;
var unfollowtime = 0;
// private constructor:

var User = module.exports = function User(_node) {
    // all we'll really store is the node; the rest of our properties will be
    // derivable or just pass-through properties (see below).
    this._node = _node;
    
}

// public instance properties:

Object.defineProperty(User.prototype, 'id', {
    get: function () { return this._node.id; }
});

Object.defineProperty(User.prototype, 'name', {
    get: function () {
        return this._node.data['name'];
    },
    set: function (name) {
        this._node.data['name'] = name;
    }
});

// public instance methods:

User.prototype.save = function (callback) {
    this._node.save(function (err) {
        callback(err);
    });
};

User.prototype.del = function (callback) {
    // use a Cypher query to delete both this user and his/her following
    // relationships in one transaction and one network request:
    // (note that this'll still fail if there are any relationships attached
    // of any other types, which is good because we don't expect any.)
    var query = [
        'MATCH (user:User)',
        'WHERE ID(user) = {userId}',
        'DELETE user',
        'WITH user',
        'MATCH (user) -[rel:follows]- (other)',
        'DELETE rel',
    ].join('\n')

    var params = {
        userId: this.id
    };

    db.query(query, params, function (err) {
        callback(err);
    });
};

User.prototype.follow = function (other, callback) {
    var start = new Date().getTime();
    this._node.createRelationshipTo(other._node, 'follows', {}, function (err, rel) {
        callback(err);
        var end = new Date().getTime();
        followtime = followtime + end - start;
        console.log(followtime + ', ' + (end -start));
    });
};

User.prototype.unfollow = function (other, callback) {
    var query = [
        'MATCH (user:User) -[rel:follows]-> (other:User)',
        'WHERE ID(user) = {userId} AND ID(other) = {otherId}',
        'DELETE rel',
    ].join('\n')

    var params = {
        userId: this.id,
        otherId: other.id,
    };

    db.query(query, params, function (err) {
        callback(err);
    });
};

// calls callback w/ (err, following, others) where following is an array of
// users this user follows, and others is all other users minus him/herself.
User.prototype.getFollowingAndOthers = function (callback) {
    // query all users and whether we follow each one or not:
    var query = [
        'MATCH (user:User) -[rel:follows]-> (other:User)',
        //'OPTIONAL MATCH (user) -[rel:follows]-> (other)',
        'WHERE ID(user) = {userId}',
        'RETURN other, COUNT(rel)', // COUNT(rel) is a hack for 1 or 0
    ].join('\n')

    var params = {
        userId: this.id,
    };

    var user = this;
    db.query(query, params, function (err, results) {
        if (err) return callback(err);

        var following = [];
        var others = [];

        for (var i = 0; i < results.length; i++) {
            var other = new User(results[i]['other']);
            var follows = results[i]['COUNT(rel)'];

            if (user.id === other.id) {
                continue;
            } else if (follows) {
                following.push(other);
            } else {
                others.push(other);
            }
        }

        callback(null, following, others);
    });
};

User.prototype.getPath = function(other,callback){
    var query =[
        'MATCH m,n, p = allShortestPaths((m)-[*]->(n))',
        'WHERE id(m) = {userId} and id(n) = {otherId}',
        'RETURN nodes(p) LIMIT 1'
    ].join('\n');
    var params = {
        userId: this.id,
        otherId: other.id, 
    }
    db.query(query,params,function(err,results){
        if(err) return callback(err,null);
        var path = [];
        if(results.length == 0){ 
            User.get(params.userId,function(err,node){
                if(err) return callback(err,null);
                path.push(node['_node']['_data']['data']);
                //console.log(node['_node']['_data']['data']);
                callback(null, path);
            })
            
        }else{
            results.map(function(result){
                //console.log(result['rels(p)'][0]['_start']['_data'])
                for(var i = 0;i < result['nodes(p)'].length;i++){
                    //console.log(result['nodes(p)'][i]['_data']['data'])
                    path.push(result['nodes(p)'][i]['_data']['data'])
                }
                console.log(path)
              //  console.log(result);
              //  console.log(results);
                callback(null, path);
            })
        }
    });
};

// static methods:

User.get = function (id, callback) {
    var start = new Date().getTime();
    db.getNodeById(id, function (err, node) {

        if (err) return callback(err);
        callback(null, new User(node));
        var end = new Date().getTime();
        console.log("User.get time:" +(end -start));
        
    });
};

User.getAll = function (callback) {
    var query = [
        'MATCH (user:User)',
        'RETURN user',
    ].join('\n');

    db.query(query, null, function (err, results) {
        if (err) return callback(err);
        var users = results.map(function (result) {
            return new User(result['user']);
        });
        callback(null, users);
    });
};

// creates the user and persists (saves) it to the db, incl. indexing it:
User.create = function (data, callback) {
    // construct a new instance of our class with the data, so it can
    // validate and extend it, etc., if we choose to do that in the future:
    var start = new Date().getTime();
    var node = db.createNode(data);
    var user = new User(node);
    
    // but we do the actual persisting with a Cypher query, so we can also
    // apply a label at the same time. (the save() method doesn't support
    // that, since it uses Neo4j's REST API, which doesn't support that.)
    var query = [
        'CREATE (user:User {data})',
        'RETURN user',
    ].join('\n');

    var params = {
        data: data
    };

    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        var user = new User(results[0]['user']);
        callback(null, user);
        var end = new Date().getTime();
        createtime = createtime + end - start;
        console.log(createtime + ', ' + (end -start));
    });
};
