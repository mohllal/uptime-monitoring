var usersHandler = require('./api/users');
var authHandler = require('./api/auth');
var checksHandler = require('./api/checks');
var pingHandler = require('./api/ping');

var indexHandler = require('./gui/index');

//define request handlers
var handlers = {};

/*
* JSON API handlers
*/

// users API handler
handlers.users = function (data, callback) {
    var acceptableMethods = ['GET', 'POST', 'PUT', 'DELETE'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        usersHandler[data.method](data, callback);
    }
    else {
        callback(405);
    }
};

// auth API handler
handlers.auth = function (data, callback) {
    var acceptableMethods = ['GET', 'POST', 'PUT', 'DELETE'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        authHandler[data.method](data, callback);
    }
    else {
        callback(405);
    }
};

// checks API handler
handlers.checks = function (data, callback) {
    var acceptableMethods = ['GET', 'POST', 'PUT', 'DELETE'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        checksHandler[data.method](data, callback);
    }
    else {
        callback(405);
    }
};

// ping API handler
handlers.ping = pingHandler.ping;


/*
* HTML GUI handlers
*/

// index GUI handler
handlers.index = indexHandler.index;


// 404 handler
handlers.notFound = function (data, callback) {
    callback(404);
};

// export module
module.exports = handlers;
