var crypto = require('crypto');
var config = require('../config');

var helpers = {};

// create a SHA256 hash
helpers.hash = function (password) {
    if (typeof(password) == 'string' && password.length > 0) {
        var hash = crypto.createHmac('sha256', config.secretKey).update(password).digest('hex');
        return hash;
    }
    else {
        return false;
    }
};

// parse JSON string to an object in all cases
helpers.parseJsonToObject = function (str) {
    try {
        object = JSON.parse(str);
        return object;
    } catch (e) {
        return {};
    }
};

// create a string of random alphanumeric characters with a given length
helpers.createRandomString = function (length) {
    length = typeof(length) == 'number' && length > 0? length : false;

    if (length) {
        var buf = crypto.randomBytes(length);
        return buf.toString('hex');
    }
    else {
        return false;
    }
};

// export the module
module.exports = helpers;