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
helpers.getTemplate = function (templateName, data, callback) {
    // validate the template name
    templateName = typeof(templateName) == 'string' && templateName.length > 0? templateName : false;
    data = typeof(data) == 'object' && data !== null? data : {};

    if (templateName) {
        var templatesBaseDir = path.join(__dirname, '/../templates/');
        var filePath = templatesBaseDir + templateName + '.html';

        // read the template file
        fs.readFile(filePath, 'utf8', function (err, str) {
            if (!err && str && str.length > 0) {
                var finalString = helpers.interpolate(str, data);
                callback(false, finalString);
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

// add the universal header and footer to a string, and pass provided data object to header and footer for interpolation
helpers.addUniversalTemplates = function (str, data, callback) {
    str = typeof (str) == 'string' && str.length > 0 ? str : '';
    data = typeof (data) == 'object' && data !== null ? data : {};

    // get the header
    helpers.getTemplate('_header', data, function (err, headerString) {
        if (!err && headerString) {

            // get the footer
            helpers.getTemplate('_footer', data, function (err, footerString) {
                if (!err && headerString) {
                    // add them all together
                    var fullString = headerString + str + footerString;
                    callback(false, fullString);
                } else {
                    callback('Could not find the footer template');
                }
            });
        } else {
            callback('Could not find the header template');
        }
    });
};

// take a string and a data object and find/replace all the keys within it 
helpers.interpolate = function (str, data) {
    // validate the parameters
    str = typeof(str) == 'string' && str.length > 0? str : '';
    data = typeof(data) == 'object' && data !== null? data : {};

    // insert templateGlobals to the data object
    for (var key in config.templateGlobals) {
        if (config.templateGlobals.hasOwnProperty(key)) {
            data['global.' + key] = config.templateGlobals[key];
        }
    }

    // find and replace all data object keys
    for (var key in data) {
        if (data.hasOwnProperty(key) && typeof(data[key]) == 'string') {
            var find = '{' + key + '}';
            var replace = data[key];

            str = str.replace(find, replace);
        }
    }
    return str;
};

// export the module
module.exports = helpers;