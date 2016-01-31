// Routing for page connections
module.exports = function(app, passport){
    // Splash Page With Login
    app.get('/', function(req,res){
        res.render('index.jade'); // Index file
    });

    // Login Page
    app.get('/login', function(req,res){
        // Render the page and pass flash data
        res.render('login.jade', {message: req.flash('loginMessage')}); // Login file
    });

    // Process login form
    app.post('/login', passport.authenticate('local-login',{
        successRedirect : '/profile',
        failureRedirect : '/login',
        failureFlash : true
    }));

    // Signup Page
    app.get('/signup', function(req,res){
        // Render the page and pass in any flash data if it exists
        res.render('signup.jade',{message: req.flash('signupMessage')});
    });

    // Process the signup form
    app.post('/signup', passport.authenticate('local-signup',{
        successRedirect : '/profile', // Redirect to secure profile page
        failureRedirect : '/signup', // Redirect back to signup page
        failureFlash : true
    }));

    // Profile Page
    app.get('/profile', isLoggedIn, function(req,res){
        res.render('profile.jade', {
            user: req.user // Get the user out of session and pass it into the template
        });
    });

    // Logout Page
    app.get('/logout', function(req,res){
        req.logout();
        req.redirect('/');
    });
}

// Route middleware to make sure the user is logged in
function isLoggedIn(req, res, next){
    // If the user is authenticated, continue
    if (req.isAuthenticated()){
        return next();
    }

    // Redirect to the home page
    res.redirect('/');
}
