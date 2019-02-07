var usersHandler = require('./users');
var authHandler = require('./auth');

//define request handlers
var handlers = {};

// users handler
handlers.users = function (data, callback) {
    var acceptableMethods = ['GET', 'POST', 'PUT', 'DELETE'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        usersHandler[data.method](data, callback);
    }
    else {
        callback(405);
    }
};

// auth handler
handlers.auth = function (data, callback) {
    var acceptableMethods = ['GET', 'POST', 'PUT', 'DELETE'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        authHandler[data.method](data, callback);
    }
    else {
        callback(405);
    }
};

// ping handler
handlers.ping = function (data, callback) {
    callback(200);
};

// 404 handler
handlers.notFound = function (data, callback) {
    callback(404);
};

// export module
module.exports = handlers;
