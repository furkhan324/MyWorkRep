var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');

var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

var auth = jwt({
    secret: 'SECRET',
    userProperty: 'payload'
});


/* GET home page. */
router.get('/', function (req, res) {
    res.render('index');
});

router.get('/posts', function (req, res, next) {
    Post.find(function (err, posts) {
        if (err) {
            return next(err);
        }

        res.json(posts);
    });
});

router.post('/posts', auth, function (req, res, next) {
    var post = new Post(req.body);
    post.author = req.payload.username;

    post.save(function (err, post) {
        if (err) {
            return next(err);
        }

        res.json(post);
    });
});

router.param('post', function (req, res, next, id) {
    var query = Post.findById(id);

    query.exec(function (err, post) {
        if (err) {
            return next(err);
        }
        if (!post) {
            return next(new Error("can't find post"));
        }

        req.post = post;
        return next();
    });
});

router.param('comment', function (req, res, next, id) {
    var query = Comment.findById(id);

    query.exec(function (err, comment) {
        if (err) {
            return next(err);
        }
        if (!comment) {
            return next(new Error("can't find comment"));
        }

        req.comment = comment;
        return next();
    });
});

router.param('username', function (req, res, next, id) {
    //id carries the value sent in as a parameter

    req.username = id;
    return next();

});

router.get('/posts/:post', function (req, res, next) {
    req.post.populate('comments', function (err, post) {
        res.json(post);
    });
});

router.put('/posts/:post/upvote', auth, function (req, res, next) {
    req.post.upvote(function (err, post) {
        if (err) {
            return next(err);
        }

        res.json(post);
    });
});

router.put('/posts/:post/:username/upvote', auth, function (req, res, next) {
    req.post.upvotePersistent(function (err, post) {
        if (err) {
            return next(err);
        }

        res.json(post);
    }, req.username);
});

router.put('/posts/:post/downvote', auth, function (req, res, next) {
    req.post.downvote(function (err, post) {
        if (err) {
            return next(err);
        }

        res.json(post);
    });
});

router.post('/posts/:post/comments', auth, function (req, res, next) {
    var comment = new Comment(req.body);
    comment.post = req.post;
    comment.author = req.payload.username;

    comment.save(function (err, comment) {
        if (err) {
            return next(err);
        }

        req.post.comments.push(comment);
        req.post.save(function (err, post) {
            if (err) {
                return next(err);
            }

            res.json(comment);
        });
    });
});

router.put('/posts/:post/comments/:comment/upvote', auth, function (req, res, next) {
    req.comment.upvote(function (err, comment) {
        if (err) {
            return next(err);
        }

        res.json(comment);
    });
});

router.put('/posts/:post/:username/comments/:comment/upvote', auth, function (req, res, next) {
    req.comment.upvotePersistent(function (err, comment) {
        if (err) {
            return next(err);
        }

        res.json(comment);
    }, req.username);
});

router.put('/posts/:post/comments/:comment/downvote', auth, function (req, res, next) {
    req.comment.downvote(function (err, comment) {
        if (err) {
            return next(err);
        }

        res.json(comment);
    });
});

router.post('/register', function (req, res, next) {
    console.log("got to this point");
    if (!req.body.password) {
        return res.status(400).json({
            message: 'bad password'
        });
    }
    if (!req.body.username) {
        return res.status(400).json({
            message: 'bad username'
        });

    }

    var user = new User();

    user.username = req.body.username;

    user.setPassword(req.body.password)
    console.log("got to this point2");
    user.save(function (err) {
        console.log("got to this point3");
        if (err) {
            console.log("username taken");
            return res.status(400).json({
            message: 'username taken'
        });

        }
        console.log("got to this point4");


        return res.json({
            token: user.generateJWT()
        })
    });
});

router.post('/login', function (req, res, next) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({
            message: 'Please fill out all fields'
        });
    }

    passport.authenticate('local', function (err, user, info) {

        if (err) {
return res.status(400).json({
            message: 'Invalid username or password'
        });        }

        if (user) {
            return res.json({
                token: user.generateJWT()
            });
        } else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

module.exports = router;