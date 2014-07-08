// users.js
// Routes to CRUD users.

var User = require('../models/user');
var request = require('request');
var Chance = require('chance');
var chance = new Chance();
/**
 * GET /users
 */
exports.list = function (req, res, next) {
    User.getAll(function (err, users) {
        if (err) return next(err);
        res.render('users', {
            users: users
        });
    });
};

/**
 * POST /users
 */
exports.create = function (req, res, next) {
    User.create({
        name: req.body['name'],
        email: req.body['email'],
        address: req.body['address']
    }, function (err, user) {
        if (err) return next(err);
        res.send();
    });
};

/**
 * GET /users/:id
 */
exports.show = function (req, res, next) {
    User.get(req.params.id, function (err, user) {
        if (err) return next(err);
        // TODO also fetch and show followers? (not just follow*ing*)
        user.getFollowingAndOthers(function (err, following, others) {
            if (err) return next(err);
            res.render('user', {
                user: user,
                following: following,
                others: others
            });
        });
    });
};

exports.path = function(req,res,next){
    User.get(req.params.src,function(err,user){
        if(err) return next(err);
        User.get(req.params.dst,function(err,other){
            if(err) return next(err);
            user.getPath(other,function(err,results){
                if(err) return next(err,null);
                //res.render('graph',{
                  //  path:results
                    //})
                res.send(results);
            });
        });
    });
}

exports.showPath = function(req,res,next){
    request.get('http://localhost:3000/users/'+req.params.src+'/path/'+req.params.dst, function (err, response, body){
        if(err) return next(err);
        res.render('graph',{
            path:response.body
        })
      //  res.send(body);
    });
}
exports.randomPath = function(req,res,next){
    request.get('http://localhost:3000/users/'+chance.integer({min: 18923, max: 555295}) +'/path/'+ chance.integer({min: 18923, max: 555295}) , function (err, response, body){
        if(err) return next(err);
        res.render('visgraph',{
            path:response.body
        })
      //  res.send(body);
    });
}
/**
 * POST /users/:id
 */
exports.edit = function (req, res, next) {
    User.get(req.params.id, function (err, user) {
        if (err) return next(err);
        user.name = req.body['name'];
        user.save(function (err) {
            if (err) return next(err);
            res.redirect('/users/' + user.id);
        });
    });
};

/**
 * DELETE /users/:id
 */
exports.del = function (req, res, next) {
    User.get(req.params.id, function (err, user) {
        if (err) return next(err);
        user.del(function (err) {
            if (err) return next(err);
            res.redirect('/users');
        });
    });
};

/**
 * POST /users/:id/follow
 */
exports.follow = function (req, res, next) {
    User.get(req.params.id, function (err, user) {
        if (err) return next(err);
        User.get(req.body.user.id, function (err, other) {
           // console.log(req.body);
            if (err) return next(err);
            user.follow(other, function (err) {
                if (err) return next(err);
                //res.redirect('/users/' + user.id);
                res.end();
            });
        });
    });
};

/**
 * POST /users/:id/unfollow
 */
exports.unfollow = function (req, res, next) {
    User.get(req.params.id, function (err, user) {
        if (err) return next(err);
        User.get(req.body.user.id, function (err, other) {
            if (err) return next(err);
            user.unfollow(other, function (err) {
                if (err) return next(err);
                res.redirect('/users/' + user.id);
            });
        });
    });
};
