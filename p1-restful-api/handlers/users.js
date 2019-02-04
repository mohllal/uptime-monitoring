var _data = require('../lib/data');
var helpers = require('../lib/helpers');

// container for the users sub-handlers
var usersHandler = {};

// TODO:
// users - GET
usersHandler.GET = function (data, callback) {
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

// TODO:
// users - PUT
usersHandler.PUT = function (data, callback) {   
};

// TODO:
// users - DELETE
usersHandler.DELETE = function (data, callback) {
};

// export the module
module.exports = usersHandler;