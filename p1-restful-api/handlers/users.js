var _data = require('../lib/data');
var helpers = require('../lib/helpers');

// container for the users sub-handlers
var usersHandler = {};

// TODO: only let an authenticated user access his/her own object
// users - GET
// required data: phone
// optional data: none
usersHandler.GET = function (data, callback) {
    // check the request query object for the phone number
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10? data.queryStringObject.phone : false;
    if (phone){
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

// TODO: only let an authenticated user update his/her own object
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
        callback(400, {'Error': 'Missing required fields'});
    }
};

// TODO: only let an authenticated user delete his/her own object
// TODO: clean up (delete) any other data files associated with this user
// users - DELETE
// required data: phone
// optional data: none
usersHandler.DELETE = function (data, callback) {
    // check the request query object for the phone number
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

    if (phone) {
        _data.delete('users', phone, function (err) {
            if (!err) {
                callback(200);
            }
            else {
                callback(500, {'Error': 'Could not delete the user'});
            }
        });
    }
    else {
        callback(400, {'Error': 'Missing required fields'});
    }
};

// export the module
module.exports = usersHandler;