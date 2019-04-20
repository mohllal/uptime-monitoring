var helpers = require('../../lib/helpers');

// container for the index sub-handlers
var indexHandler = {};

indexHandler.index = function(data, callback) {
    // handle GET method and refuse any other method
    if (data.method == 'GET') {
        // prepare data for interpolation
        var templateData = {
            'head.title' : 'Home',
            'head.description' : 'A Node.js web application that allows users to enter URLs they want monitored and receive SMS alerts when those websites go down or come back up.',
            'body.class' : 'index'
        };

        // read in a template as a string
        helpers.getTemplate('index', templateData, function (err, str) {
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
module.exports = indexHandler;