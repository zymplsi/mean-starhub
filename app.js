//var app = require('./app');

var express = require('express');
var app = express();
app.directory = __dirname;

require('./config/environments')(app);
require('./routes')(app);
// require('./.env');


// module.exports = require('http').createServer(app);
server = require('http').createServer(app);


require('./config/tractorpush-server')(server);


exports = module.exports = server;
// delegates user() function
exports.use = function() {
    app.use.apply(app, arguments);
};




// var express = require('express'),
//     routes = require('./routes'),
//     path = require('path');

// var app = express();
// app.directory = __dirname;

// require('./config/environments')(app);
// require('./routes')(app);

// module.exports = app;
