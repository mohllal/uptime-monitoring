var _data = require('../../lib/data');
var helpers = require('../../lib/helpers');

// container for the auth sub-handlers
var authHandler = {};

// auth - GET
// required data: token id
// optional data: none
authHandler.GET = function (data, callback) {
    // check the request query object for the token id
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 20? data.queryStringObject.id : false;
    if (id){
        // read the token data
        _data.read('tokens', id, function (err, data) {
            if (!err && data) {
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

// auth - POST
// required data: phone, and password
// optional data: none
authHandler.POST = function (data, callback) {
    // validate payload data
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone && password) {
        // lookup the user with provided phone
        _data.read('users', phone, function (err, userData) {
           if (!err && userData) {
               // verify the provided password
               var hashedPassword = helpers.hash(password);

               if (userData.hashedPassword == hashedPassword) {
                   // create a token with random string of length 20
                   var tokenId = helpers.createRandomString(20);

                   // set expiration date to 1 hour later
                   var expirationDate = Date.now() + 1000 * 60 * 60;

                   // create token object to be stored in the fs
                   var tokenObject = {
                       'phone': phone,
                       'id': tokenId,
                       'expires': expirationDate
                   };

                   // create a token file
                   _data.create('tokens', tokenId, tokenObject, function (err) {
                       if (!err) {
                           // return the token object
                           callback(201, tokenObject);
                       }
                       else {
                           console.log(err);
                           callback(500, {'Error': 'Could not create the new token'});
                       }
                   });
               }
               else {
                   callback(401, {'Error': 'Invalid password'});
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

// auth - PUT
// required data: token id, and extend
// optional data: none
authHandler.PUT = function (data, callback) {
    // check the request query object for the token id
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length > 20? data.payload.id : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true? true : false;
    if (id && extend){
        // read the token data
        _data.read('tokens', id, function (err, data) {
            if (!err && data) {
                if (data.expires > Date.now()) {
                    // extend the token expiration date to +1 hour
                    data.expires = Date.now() + 1000 * 60 * 60;

                    // update the token in the fs
                    _data.update('tokens', id, data, function (err) {
                        if (!err) {
                            callback(200);
                        }
                        else {
                            console.log(err);
                            callback(500, {'Error': 'Could not extend the token'});
                        }
                    });
                }
                else {
                    callback(400, {'Error': 'The token has already expired, and cannot be extended'});
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

// auth - DELETE
// required data: token id
// optional data: none
authHandler.DELETE = function (data, callback) {
    // validate provided data
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.length > 20? data.queryStringObject.id : false;

    if (id) {
        // lookup the token file
        _data.delete('tokens', id, function (err) {
            if (!err) {
                callback(200);
            }
            else {
                console.log(err);
                callback(500, {'Error': 'Could not delete the token'});
            }
        });
    }
    else {
        callback(400, {'Error': 'Missing required fields'});
    }
};

// verify if a given token id is valid for a given user
authHandler.verifyToken = function (id, phone, callback) {
    // lookup the token
    _data.read('tokens', id, function (err, data) {
        if (!err && data) {
            // check that the token is for a given user and has not expired
            if (data.phone == phone && data.expires > Date.now()) {
                callback(true);
            }
            else {
                callback(false);
            }
        }
        else {
            callback(false);
        }
    });
};

// export the module
module.exports = authHandler;