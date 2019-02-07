var _data = require('../lib/data');
var helpers = require('../lib/helpers');

// container for the auth sub-handlers
var authHandler = {};

// TODO:
// auth - GET
authHandler.GET = function (data, callback) {
    
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

// TODO:
// auth - PUT
authHandler.PUT = function (data, callback) {
    
};

// TODO:
// auth - DELETE
authHandler.DELETE = function (data, callback) {
    
};

// export the module
module.exports = authHandler;