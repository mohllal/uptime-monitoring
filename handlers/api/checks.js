var _data = require('../../lib/data');
var helpers = require('../../lib/helpers');
var config = require('../../config');
var authHandler = require('./auth');

// container for the checks sub-handlers
var checksHandler = {};

// checks - GET
// required data: check id
//optional data: none
checksHandler.GET = function (data, callback) {
    // check the request query object for the check id
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 20? data.queryStringObject.id : false;
    if (id) {
        // get the token id from the headers
        var token = typeof(data.headersObject.token) == 'string'? data.headersObject.token : false;
        
        if (token) {
            // verify that the given token is valid
            _data.read('tokens', token, function (err, tokenData) {
                if (!err && tokenData) {
                    // get the user phone from the token object
                    var phone = tokenData.phone;

                    // check if the check belong to the provided user
                    _data.read('users', phone, function (err, userData) {
                        if (!err && userData) {
                            if (userData.checks.indexOf(id) > -1) {
                                // lookup the check
                                _data.read('checks', id, function (err, checkData){
                                    if (!err && checkData) {
                                        callback(200, checkData);
                                    }
                                    else {
                                        console.log(err);
                                        callback(500, {'Error': 'Could not read the check data'});
                                    }
                                });
                            }
                            else {
                                callback(404);
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

// checks - PUT
// required data: check id
// optional data: protocol, url, method, successCodes, or timeoutSeconds (one must be provided)
checksHandler.PUT = function (data, callback) {
    // check for required field
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length > 20 ? data.payload.id.trim() : false;

    // check for optional fields
    var protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    // error if id is invalid
    if(id){
        // error if nothing is sent to update
        if(protocol || url || method || successCodes || timeoutSeconds){
            // lookup the check
            _data.read('checks', id, function (err, checkData) {
                if (!err && checkData){
                    var phone = checkData.phone;

                    // get the token id from the headers
                    var token = typeof(data.headersObject.token) == 'string'? data.headersObject.token : false;
                    
                    // verify that the given token is valid and belongs to the user who created the check
                    authHandler.verifyToken(token, phone, function (isValid) {
                        if(isValid){
                            // update check data where necessary
                            if (protocol) {
                                checkData.protocol = protocol;
                            }
                            if (url) {
                                checkData.url = url;
                            }
                            if (method) {
                                checkData.method = method;
                            }
                            if (successCodes) {
                                checkData.successCodes = successCodes;
                            }
                            if (timeoutSeconds) {
                                checkData.timeoutSeconds = timeoutSeconds;
                            }
                            
                            // Store the new updates
                            _data.update('checks', id, checkData, function (err) {
                                if(!err){
                                    callback(200);
                                } else {
                                    callback(500, {'Error': 'Could not update the check'});
                                }
                            });
                        } 
                        else {
                            callback(403);
                        }
                    });
                } 
                else {
                    callback(404);
                }
            });
            }
            else {
                callback(400, {'Error': 'Missing required fields'});
            }
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};

// checks - DELETE
// required data: check id
// optional data: none
checksHandler.DELETE = function (data, callback) {
     // check the request query object for the check id
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 20 ? data.queryStringObject.id.trim() : false;

    if (id) {
        // lookup the check
        _data.read('checks', id, function (err, checkData) {
            if (!err && checkData) {
                var phone = checkData.phone;

                // get the token id from the headers
                var token = typeof(data.headersObject.token) == 'string'? data.headersObject.token : false;
                if (token) {
                    // verify that the given token is valid for a given phone
                    authHandler.verifyToken(token, phone, function (isValid) {
                        if (isValid) {
                            _data.delete('checks', id, function (err) {
                                if (!err) {
                                    // lookup the user who owns the check
                                    _data.read('users', phone, function (err, userData) {
                                        if (!err && userData) {
                                            var indexOfCheck = userData.checks.indexOf(checkData.id);

                                            // check if the check is found in the user check array
                                            if (indexOfCheck > -1) {
                                                userData.checks.splice(indexOfCheck, 1);

                                                // update the user object
                                                _data.update('users', phone, userData, function (err) {
                                                    if (!err) {
                                                        callback(200);
                                                    }
                                                    else {
                                                        callback(500, {'Error': 'Could not update the user'});
                                                    }
                                                });
                                            }
                                            else {
                                                callback(400, {'Error': 'Could not find the check in the user object'})
                                            }
                                        }
                                        else {
                                            callback(500, {'Error': 'Could not find the user who creates the check'});
                                        }
                                    });
                                }
                                else {
                                    callback(500, {'Error': 'Could not delete the check'});
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
                callback(404);
            }
        });
    }
    else {
        callback(400, {'Error': 'Missing required fields'});
    }
};

// export the module
module.exports = checksHandler;