// Routing for page connections
module.exports = function(app, passport){
    var gid = 0
    var glist = [] // Group list

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

    // Places Page
    app.get('/places', isLoggedIn, function(req,res){
        res.render('places.jade', {
            user: req.user // Get the user out of session and pass it into the template
        });
    });

    // Group Page
    app.get('/group', isLoggedIn, function(req,res){
        res.render('group.jade', {
            user: req.user // Get the user out of session and pass it into the template
        });
    });

    // Optimization
    //app.post('/optim', function(req,res){
        
    //});

    // Group Post
    app.post('/group', function(req,res){
        //if (!req.body){
        //    return;
        //}

        console.log(req.body)

        // Get JSON data
        console.log(req.body.email)
        var jvar = req.body
        //var jvar = JSON.parse(req.body)

        // Handle various requests

        // Create new group
        if (jvar.action == 'make'){
            console.log('Creating new group with:')
            console.log(jvar.email);

            // Add group to list of active groups and increment the counter
            var grpO = {gid: gid.toString(), users: [jvar.email]}
            glist.push(grpO)
            gid = gid + 1

            console.log(grpO)
            console.log(glist)

            // Send group data
            res.end('{"gid": "' + gid  + '"}')
        }
        
        // Join existing group
        if (jvar.action == 'join'){
            console.log(jvar.email + ' is joining ' + jvar.gid)

            // Check if group exists
            var eflag = false;
            console.log(glist.length)
            for (var i=0; i<glist.length; i++){
                //console.log(glist[i].gid)
                //console.log(jvar.gid)
                if (glist[i].gid == jvar.gid){
                    // Send group data
                    console.log(glist[i]);

                    // Add current gid to group list
                    glist[i].users.push(jvar.email);

                    // Send back the JSON string
                    res.end(JSON.stringify(glist[i]));
                    eflag = true;
                }
            }

            // Send blank group data
            if (!eflag){
                res.end('{}');
            }
        }

        //res.end('{"testData": "blah"}')
        //res.body = '{"testData": "blah"}'
        //return res;
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
