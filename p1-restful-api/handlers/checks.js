var _data = require('../lib/data');
var helpers = require('../lib/helpers');
var config = require('../config');

// container for the checks sub-handlers
var checksHandler = {};

// TODO:
// checks - GET
checksHandler.GET = function (data, callback) {
    
};

// checks - POST
// required data: protocol, url, method, successCodes, timeoutSeconds
// optional data: none
checksHandler.POST = function (data, callback) {
    // validate the payload data
    var protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof(data.payload.method) == 'string' && ['GET','POST','PUT','DELETE'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        // get the token id from the headers
        var token = typeof(data.headersObject.token) == 'string'? data.headersObject.token : false;
        
        if (token) {
            // verify that the given token is valid
            _data.read('tokens', token, function (err, tokenData) {
                if (!err && tokenData) {
                    // get the user phone from the token object
                    var phone = tokenData.phone;
                    
                    // lookup the user
                    _data.read('users', phone, function (err, userData) {
                        if (!err && userData) {
                            var checks = typeof(userData.checks) == 'object' && userData.checks instanceof Array? userData.checks : [];

                            if (checks.length <= config.maxChecks) {
                                // create random id for the check
                                var id = helpers.createRandomString(20);

                                // create a new check object
                                var checkObj = {
                                    'phone': phone,
                                    'id': id,
                                    'protocol': protocol,
                                    'url': url,
                                    'method': method,
                                    'successCodes': successCodes,
                                    'timeoutSeconds': timeoutSeconds
                                };
                                
                                // create a new check file
                                _data.create('checks', id, checkObj, function (err) {
                                    if (!err) {
                                        // add the created check to its user object
                                        userData.checks = checks;
                                        userData.checks.push(id);

                                        // save the updated user object to fs
                                        _data.update('users', phone, userData, function (err) {
                                            if (!err) {
                                                callback(201, checkObj);
                                            }
                                            else {
                                                console.log(err);
                                                callback(500, {'Error': 'Could not update the user with the new check'});
                                            }
                                        });
                                    }
                                    else {
                                        console.log(err);
                                        callback(500, {'Error': 'Could not create the new check'});
                                    }
                                });
                            }
                            else {
                                callback(400, {'Error': 'Maximum number of checks has already reached'});
                            }
                        }
                        else {
                            callback(403);
                        }
                    });
                }
                else {
                    callback(403, {'Error': 'Invalid token'});
                }
            });
        }
        else {
            callback(400, {'Error': 'Missing required headers'});
        }
    }
    else {
        callback(400, {'Error': 'Missing required fields'});
    }
};

// TODO:
// checks - PUT
checksHandler.PUT = function (data, callback) {
    
};

// TODO:
// checks - DELETE
checksHandler.DELETE = function (data, callback) {
    
};

// export the module
module.exports = checksHandler;