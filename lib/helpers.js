var crypto = require('crypto');
var config = require('../config');
var path = require('path');
var fs = require('fs');

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

// convert html template file into a plain string
helpers.getTemplate = function (templateName, callback) {
    // validate the template name
    templateName = typeof(templateName) == 'string' && templateName.length > 0? templateName : false;

    if (templateName) {
        var templatesBaseDir = path.join(__dirname, '/../templates/');
        var filePath = templatesBaseDir + templateName + '.html';

        // read the template file
        fs.readFile(filePath, 'utf8', function (err, str) {
            if (!err && str && str.length > 0) {
                callback(false, str);
            } 
            else {
                callback('Error: no template could be found');
            }
        });
    }
    else {
        callback('Error: invalid template name');
    }
};

// export the module
module.exports = helpers;