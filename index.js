var _ = require('underscore');
var express = require('express');
var fs = require('fs');
var spawn = require('child_process').spawn;
var parseCookie = require('connect').parse;
var session = require('express-session');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose'); // MongoDB
//var MemoryStore = express.session.MemoryStore;

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
mongoose.connect('mongodb://localhost/arcuisine');

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
app.get('/', function(req, res){
    res.render('project');
});

// Configure application
app.use(cookieParser());
app.use(session({
    secret: 'test',
    resave: false,
    saveUninitialized: true
}));

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
