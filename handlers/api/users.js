var _data = require('../../lib/data');
var helpers = require('../../lib/helpers');
var authHandler = require('./auth');

// container for the users sub-handlers
var usersHandler = {};

// users - GET
// required data: phone
// optional data: none
usersHandler.GET = function (data, callback) {
    // check the request query object for the phone number
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10? data.queryStringObject.phone : false;
    if (phone) {
        // get the token id from the headers
        var token = typeof(data.headersObject.token) == 'string'? data.headersObject.token : false;
        
        if (token) {
            // verify that the given token is valid for a given phone
            authHandler.verifyToken(token, phone, function (isValid) {
                if (isValid) {
                    // read the user data
                    _data.read('users', phone, function (err, data) {
                        if (!err && data) {
                            // remove the hashed password
                            delete data.hashedPassword;
                            callback(200, data);
                        }
                        else {
                            callback(404);
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

// users - POST
// required data: firstName, lastName, phone, password, toAgreement
// optional data: none
usersHandler.POST = function (data, callback) {
    // validate payload data
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // make sure that user does not exist
        _data.read('users', phone, function (err, data) {
            if (err) {
                // hash the password before storing it
                var hashedPassword = helpers.hash(password);
                if (hashedPassword) {
                    // create the new user object
                    var userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    };

                    _data.create('users', phone, userObject, function (err) {
                        if (!err) {
                            callback(201);
                        }
                        else {
                            callback(500, {'Error': 'Could not create the user'});
                        }
                    });
                }
                else {
                    callback(500, {'Error': 'Could not hash the password'});
                }
            }
            else {
                callback(400, {'Error': 'A user with that phone number already exists'});
            }
        });
    }
    else {
        callback(400, {'Error': 'Missing required fields'});
    }
};

// users - PUT
// required data: phone
// optional data: firstName, lastName, password (at least one must be specified)
usersHandler.PUT = function (data, callback) {
    // validate payload data
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    // check if the phone is valid number
    if (phone) {
        // get the token id from the headers
        var token = typeof(data.headersObject.token) == 'string'? data.headersObject.token : false;

        if (token) {
            // verify that the given token is valid for a given phone
            authHandler.verifyToken(token, phone, function (isValid) {
                if (isValid) {
                    // check the optional fields
                    if (firstName || lastName || password) {
                        // check if the user already exists
                        _data.read('users', phone, function (err, userData) {
                        if (!err && userData) {
                            // update the user object
                            if (firstName) userData.firstName = firstName;
                            if (lastName) userData.lastName = lastName;
                            if (password) userData.hashedPassword = helpers.hash(password);

                            _data.update('users', phone, userData, function (err) {
                                if (!err) {
                                    callback(200);
                                }
                                else {
                                    console.log(err);
                                    callback(500, {'Error': 'Could not update the user'});
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

// users - DELETE
// required data: phone
// optional data: none
usersHandler.DELETE = function (data, callback) {
    // check the request query object for the phone number
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

    if (phone) {
        // get the token id from the headers
        var token = typeof(data.headersObject.token) == 'string'? data.headersObject.token : false;

        if (token) {
            // verify that the given token is valid for a given phone
            authHandler.verifyToken(token, phone, function (isValid) {
                if (isValid) {
                    // lookup the user
                    _data.read('users', phone, function (err, userData) {
                        if (!err && userData) {
                            // delete the user's data
                            _data.delete('users', phone, function (err) {
                                if (!err) {
                                    // delete each of the checks associated with the user
                                    var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                    var checksToDelete = userChecks.length;
                                    
                                    if (checksToDelete > 0) {
                                        var checksDeleted = 0;
                                        var deletionErrors = false;
                                        
                                        // loop through the checks
                                        userChecks.forEach(function (checkId) {
                                            // delete the check
                                            _data.delete('checks', checkId, function (err) {
                                                if (err) {
                                                    deletionErrors = true;
                                                }
                                                checksDeleted++;
                                                if (checksDeleted == checksToDelete) {
                                                    if (!deletionErrors) {
                                                        callback(200);
                                                    } 
                                                    else {
                                                        callback(500, {'Error': "Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully"});
                                                    }
                                                }
                                            });
                                        });
                                    } 
                                    else {
                                        callback(200);
                                    }
                                } 
                                else {
                                    callback(500, {'Error': 'Could not delete the specified user'});
                                }
                            });
                        } 
                        else {
                            callback(400, {'Error': 'Could not find the specified user'});
                        }
                    });
                } 
                else {
                    callback(403, {"Error": "Missing required token in header, or token is invalid"});
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

// export the module
module.exports = usersHandler;