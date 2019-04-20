var helpers = require('../../lib/helpers');

// container for the account sub-handlers
var sessionHandler = {};

// session create handler
sessionHandler.sessionCreate = function(data, callback) {
    // handle GET method and refuse any other method
    if (data.method == 'GET') {
        // prepare data for interpolation
        var templateData = {
            'head.title' : 'Login',
            'head.description' : 'Login to your account.',
            'body.class' : 'sessionCreate'
        };

        // read in a template as a string
        helpers.getTemplate('sessionCreate', templateData, function (err, str) {
            if (!err && str) {
                // add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function(err, str){
                    if(!err && str){
                        // return that page as HTML
                        callback(200, str, 'html');
                    } else {
                        callback(500, undefined, 'html');
                    }
                });
            }
            else {
                callback(500, undefined, 'html');
            }
        });
    }
    else {
        callback(405, undefined, 'html');
    }
};

// session delete handler
sessionHandler.sessionDelete = function(data, callback) {
    // handle GET method and refuse any other method
    if (data.method == 'GET') {
        // prepare data for interpolation
        var templateData = {
            'head.title' : 'Logout',
            'head.description' : 'Logout from your account.',
            'body.class' : 'sessionDelete'
        };

        // read in a template as a string
        helpers.getTemplate('sessionDelete', templateData, function (err, str) {
            if (!err && str) {
                // add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function(err, str){
                    if(!err && str){
                        // return that page as HTML
                        callback(200, str, 'html');
                    } else {
                        callback(500, undefined, 'html');
                    }
                });
            }
            else {
                callback(500, undefined, 'html');
            }
        });
    }
    else {
        callback(405, undefined, 'html');
    }
};

// export the module
module.exports = sessionHandler;