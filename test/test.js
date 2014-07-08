var User = require('../models/user');
var request = require('request');

User.get('123456', function (err, user) {
        if (err) return next(err);
        // TODO also fetch and show followers? (not just follow*ing*)
        user.getFollowingAndOthers(function (err, following, others) {
            if (err) return next(err);
            //console.log(following);
           // console.log(user['_node']['_data']);
        });
    });