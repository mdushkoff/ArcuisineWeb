// Passport configuration
var LocalStrategy = require('passport-local').Strategy;
var User = require('../app/models/user');

// Export this function
module.exports = function(passport){
    // Session setup for persistent login
    
    // Serialize the user
    passport.serializeUser(function(user,done){
        done(null, user.id);
    });

    // Deserialize the user
    passport.deserializeUser(function(id,done){
        User.findById(id, function(err,user){
            done(err,user);
        });
    });

    // Local login
    passport.use('local-login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req,email,password,done){
        // Find the user in the database
        User.findOne({'local.email' : email}, function(err, user){
            if (err){
                return done(err);
            }

            // If no user is found
            if (!user){
                return done(null, false, req.flash('loginMessage', 'No user found.'));
            }

            // Check password
            if (!user.validPassword(password)){
                return done(null, false, req.flash('loginMessage', 'Invalid password.'));
            }

            // Success
            return done(null, user);
        });
    }));

    // Local Signup
    passport.use('local-signup', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // Pass entire request to callback
    },
    function(req,email,password,done){
        // Asynchronous firing
        process.nextTick(function(){
            // Find user to check for pre-existence
            User.findOne({'local.email' : email}, function(err,user){
                // Check for errors
                if (err){
                    return done(err);
                }

                // Check if user exists
                if (user){
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                }
                else{
                    // Create user
                    var newUser = new User();

                    // Create credentials
                    newUser.local.email = email;
                    //newUser.local.password = password;
                    newUser.local.password = newUser.generateHash(password);

                    // Save the user
                    newUser.save(function(err){
                        if (err){
                            throw err;
                        }
                        return done(null, newUser);
                    });
                }
            });
        });
    }));
}
