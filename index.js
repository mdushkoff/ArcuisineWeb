var _ = require('underscore');
var express = require('express');
var fs = require('fs');
var spawn = require('child_process').spawn;
var parseCookie = require('connect').parse;
var session = require('express-session');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose'); // MongoDB
var passport = require('passport'); // Passport
var flash = require('connect-flash'); // Connect-Flash
var morgan = require('morgan'); // Morgan
var bodyParser = require('body-parser');
//var MemoryStore = express.session.MemoryStore;

// Database configuration
var configDB = require('./config/database.js');

// Define variables
var app = express(); // This is our app
var port = 3049; // Server port
var jadeDir = '/jade'; // Jade directory
var proclist = []; // List of spawned processes
var clients = []; // List of clients
//var sessionStore = new MemoryStore(); // Saved sessions

// Load JSON files (Requires server reset to detect updates)
console.log('Getting server settings...');
var restDat = JSON.parse(fs.readFileSync('data/restaurants.json')); // Get restaurant data
console.log('Got server settings!');

// Connect to database
console.log('Connecting to database...');
mongoose.connect(configDB.url);

// Create database connection
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
    // Connected to database
    console.log('Connected to database!');
});

// Set up application settings to use Jade
app.set('views', __dirname + jadeDir);
app.set('view engine','jade');
app.engine('jade', require('jade').__express);

// Set up public resource directory
app.use(express.static(__dirname + '/public'));

// Create callback for the GET request
//app.get('/', function(req, res){
//    res.render('project');
//});

// Set up Passport
require('./config/passport')(passport);

// Configure application
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser()); // Get information from HTML forms
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// Set up Passport
app.use(session({
    secret: 'supersecretsecret',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Create routes
require('./app/routes.js')(app,passport);

// Handle optimization
app.post('/optim', function(req,res){
    // TODO: Optimize based on likes

    // Choose 3 random numbers
    console.log(restDat.response.data.length-1)
    var r1 = Math.floor((Math.random() * restDat.response.data.length-1) + 0);
    var r2 = Math.floor((Math.random() * restDat.response.data.length-1) + 0);
    var r3 = Math.floor((Math.random() * restDat.response.data.length-1) + 0);
    console.log('Choosing: ' + r1 + ', ' + r2 + ', ' + r3);

    // Create response
    var resDat = {data:[]};
    resDat.data.push(restDat.response.data[r1].name);
    resDat.data.push(restDat.response.data[r2].name);
    resDat.data.push(restDat.response.data[r3].name);

    console.log(resDat)

    // Send response
    res.end(JSON.stringify(resDat));
});

// Start the app on a specific port
var io = require('socket.io').listen(app.listen(port)); // Use socket.io

// Create authorization
io.set('authorization', function(data,accept){
    // Check if there's a cookie header
    if (data.headers.cookie){
        // Parse the cookie
        data.cookie = parseCookie(data.headers.cookie);
        data.sessionID = data.cookie['express.sid'];

        // Extract session data from the session store
        sessionStore.get(data.sessionID, function(err,session){
            if (err || !session){
                // Reject connection on error
                accept('Error',false);
            }
            else{
                // Save session data and accept connection
                data.session = session;
                accept(null,true);
            }
        });
    }
    else{
        // Deny connection
        return accept('No cookie transmitted.', false);
    }
});

// Create callback for connection
io.sockets.on('connection', function(socket){
    // Add new client to the list of clients
    clients.push(socket);
    console.info('New client connected (id=' + socket.id + 'session=' + socket.handshake.sessionID  + ').');

    // Get handshake information
    var hs = socket.handshake;

    // Set up interval to keep session alive
    var intervalID = setInterval(function(){
        // Reload the session
        hs.session.reload(function(){
            // Save session
            hs.session.touch().save();
        });
    },60*1000);

    // Handle disconnect
    socket.on('disconnect', function(){
        var index = clients.indexOf(socket);
        if (index != -1) {
            clients.splice(index, 1);
            console.info('Client disconnected (id=' + socket.id + 'session=' + socket.handshake.sessionID  + ').');
        }

        // Clear the socket interval
        clearInterval(intervalID);
    });

});

console.log("Server listening on port " + port);
