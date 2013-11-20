'use strict';

//var app = require('./app');

var express = require('express');
var app = express();
app.directory = __dirname;

require('./config/environments')(app);
require('./routes')(app);
// require('./.env');
var server = require('http').createServer(app);


// db setup
var url = require('url'),
    mongo = require('mongodb'),
    mongoClient = mongo.MongoClient,
    config = require('./config/transports.js').config,

    // QueryCommand = mongo.QueryCommand,
    Cursor = mongo.Cursor;
    // Collection = mongo.Collection;

//var uristring = "mongodb://tropo_user:a12345@ds053828.mongolab.com:53828/heroku_app19463122"; 
//var uristring = 'mongodb://heroku:c0735fa832f1a3024607effa9fdacb26@dharma.mongohq.com:10079/app19347354';
var uristring = 'mongodb://localhost/testdatabase';
var mongoUrl = url.parse(uristring);


mongoClient.connect(uristring, function(err, db) {
    console.log('Attempting connection to ' + mongoUrl.protocol + '//' + mongoUrl.hostname + ' (complete URL supressed).');
    db.collection('messages', function(err, collection) {
        collection.isCapped(function(err, capped) {
            if (err) {
                console.log('Error when detecting capped collection.  Aborting.  Capped collections are necessary for tailed cursors.');
                process.exit(1);
            }
            if (!capped) {
                console.log(collection.collectionName + ' is not a capped collection. Aborting.  Please use a capped collection for tailable cursors.');
                process.exit(2);
            }
            console.log('Success connecting to ' + mongoUrl.protocol + '//' + mongoUrl.hostname + '.');
            startIOServer(collection);
        });
    });
});


exports = module.exports = server;
// delegates user() function
exports.use = function() {
    app.use.apply(app, arguments);
};




function startIOServer(collection) {
    console.log('Starting ...');

    var ioSocket = require('socket.io').listen(server);

    // Many hosted environments do not support all transport forms currently, (specifically WebSockets).
    // So we force a relatively safe xhr-polling transport.
    // Modify io.configure call to allow other transports.

    ioSocket.configure(function() {
        ioSocket.set('transports', config[platform].transports); // Set config in ./config.js
        ioSocket.set('polling duration', 10);
        ioSocket.set('log level', 2);
    });
    ioSocket.sockets.on('connection', function(socket) {
        readAndSend(socket, collection);
    });
}

function readAndSend(socket, collection) {
    collection.find({}, {
        'tailable': 1,
        'sort': [
            ['$natural', 1]
        ]
    }, function(err, cursor) {
        cursor.intervalEach(300, function(err, item) { // intervalEach() is a duck-punched version of each() that waits N milliseconds between each iteration.
            if (item !== null) {
                socket.emit('all', item); // sends to clients subscribed to type 'all'
            }
        });
    });
    collection.find({
        'messagetype': 'complex'
    }, {
        'tailable': 1,
        'sort': [
            ['$natural', 1]
        ]
    }, function(err, cursor) {
        cursor.intervalEach(900, function(err, item) {
            if (item !== null) {
                socket.emit('complex', item); // sends to clients subscribe to type 'complex'
            }
        });
    });
}


// Duck-punching mongodb driver Cursor.each.  This now takes an interval that waits 
// 'interval' milliseconds before it makes the next object request... 
Cursor.prototype.intervalEach = function(interval, callback) {
    var self = this;
    if (!callback) {
        throw new Error('callback is mandatory');
    }

    if (this.state !== Cursor.CLOSED) {
        //FIX: stack overflow (on deep callback) (cred: https://github.com/limp/node-mongodb-native/commit/27da7e4b2af02035847f262b29837a94bbbf6ce2)
        setTimeout(function() {
            // Fetch the next object until there is no more objects
            self.nextObject(function(err, item) {
                if (err !== null) {
                    return callback(err, null);
                }

                if (item !== null) {
                    callback(null, item);
                    self.intervalEach(interval, callback);
                } else {
                    // Close the cursor if done
                    self.state = Cursor.CLOSED;
                    callback(err, null);
                }

                item = null;
            });
        }, interval);
    } else {
        callback(new Error('Cursor is closed'), null);
    }
};
