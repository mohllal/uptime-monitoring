var helpers = require('../../lib/helpers');

// container for the index sub-handlers
var indexHandler = {};

indexHandler.index = function(data, callback) {
    // handle GET method and refuse any other method
    if (data.method == 'GET') {
        // read in a template as a string
        helpers.getTemplate('index', function (err, str) {
            if (!err && str) {
                callback(200, str, 'html');
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