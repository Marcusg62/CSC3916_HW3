var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
require('dotenv').config({ path: './.env' });
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function (req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({ success: false, msg: 'Please include both username and password to signup.' })
    } else {

        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function (err) {
            if (err) {
                if (err.code === 11000) {
                    return res.json({success: false, message: 'A user with that username already exists'});
                } else {
                    return res.json(err);
                }
            }
            res.json({ success: true, msg: 'Successfully created new user.' });
        });
    }
});

router.post('/signin', function (req, res) {

    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function (err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function (isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({ success: true, token: 'JWT ' + token });
            }
            else {
                res.status(401).send({ success: false, msg: 'Authentication failed.' });
            }
        })
    })
});

router.route('/movies')
    .post(authJwtController.isAuthenticated, function (req, res) {
        if (!req.body.title || !req.body.year_released || !req.body.genre || !req.body.actors[0] || !req.body.actors[1] || !req.body.actors[2]) {
            return res.json({ success: false, message: 'Please include all information for title, year released, genre, and 3 actors.'});
        } else {
            var movie = new Movie();

            movie.title = req.body.title;
            movie.year_released = req.body.year_released;
            movie.genre = req.body.genre;
            movie.actors = req.body.actors;

            movie.save(function (err) {
                if (err) {
                    if (err.code === 11000) {
                        return res.json({ success: false, message: "That movie already exists."});
                    } else {
                        return res.send(err);
                    }
                } else {
                    return res.status(200).send({success: true, message: "Successfully created movie."});
                }
            });
        }
    })
    .put(authJwtController.isAuthenticated, function (req, res) {
        if (!req.body.find_title || !req.body.update_title) {
            return res.json({ success: false, message: "Please provide a title to be updated as well as the new updated title."});
        } else {
            Movie.findOneAndUpdate( req.body.find_title, req.body.update_title, function (err, movie) {
                if (err) {
                    return res.status(403).json({success: false, message: "Unable to update title passed in."});
                } else if (!movie) {
                    return res.status(403).json({success: false, message: "Unable to find title to update."});
                } else {
                    return res.status(200).json({success: true, message: "Successfully updated title."});
                }
            });
        }
    })
    .delete(authJwtController.isAuthenticated, function (req, res) {
        if (!req.body.find_title) {
            return res.json({ success: false, message: "Please provide a title to delete." });
        } else {
            Movie.findOneAndDelete( req.body.find_title, function (err, movie) {
                if (err) {
                    return res.status(403).json({success: false, message: "Unable to delete title passed in."});
                } else if (!movie) {
                    return res.status(403).json({success: false, message: "Unable to find title to delete."});
                } else {
                    return res.status(200).json({success: true, message: "Successfully deleted title."});
                }
            });
        }
    })
    .get(authJwtController.isAuthenticated, function (req, res) {
        if (!req.body.find_title) {
            return res.json({ success: false, message: "Please provide a title to be retrieved." });
        } else {
            Movie.find( req.body.find_title).select("title year_released genre actors").exec(function (err, movie) {
                if (err) {
                    return res.status(403).json({success: false, message: "Unable to retrieve title passed in."});
                }
                if (movie && movie.length > 0) {
                    return res.status(200).json({success: true, message: "Successfully retrieved movie.", movie: movie});
                } else {
                    return res.status(404).json({success: false, message: "Unable to retrieve a match for title passed in."});
                }
            })
        }
    })
    .all(function(req, res) {
        return res.status(403).json({success: false, message: "This HTTP method is not supported. Only GET, POST, PUT, and DELETE are supported."});
    });

router.all('/', function (req, res) {
    return res.status(403).json({ success: false, msg: 'This route is not supported.' });
});

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only