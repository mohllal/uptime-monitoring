var helpers = require('../../lib/helpers');

// container for the static sub-handlers
var staticHandler = {};

staticHandler.favicon = function (data, callback) {
    // handle GET method and refuse any other method
    if (data.method == 'GET') {
        // read in the favicon data
        helpers.getStaticAsset('favicon.ico', function (err, data) {
            if (!err && data) {
                // callback the data
                callback(200, data, 'favicon');
            }
            else {
                console.log(err);
                callback(500, undefined, 'html');
            }
        });
    }
    else {
        callback(405, undefined, 'html');
    }
};

staticHandler.public = function (data, callback) {
    // handle GET method and refuse any other method
    if (data.method == 'GET') {
        // get the trimmed file path
        var trimmedAssetName = data.trimmedPath.replace('public/', '').trim();

        if (trimmedAssetName.length > 0) {
            // read in the asset data
            helpers.getStaticAsset(trimmedAssetName, function (err, data) {
                if (!err && data) {
                    // get the content type of the asset
                    var contentType = 'plain';
                    if (trimmedAssetName.indexOf('.css') > -1) {
                        contentType = 'css';
                    }
                    else if (trimmedAssetName.indexOf('.js') > -1) {
                        contentType = 'js';
                    }
                    else if (trimmedAssetName.indexOf('.png') > -1) {
                        contentType = 'png';
                    }
                    else if (trimmedAssetName.indexOf('.jpg') > -1) {
                        contentType = 'jpg';
                    }
                    else if (trimmedAssetName.indexOf('.ico') > -1) {
                        contentType = 'favicon';
                    }
                    
                    // callback the data
                    callback(200, data, contentType);
                }
                else {
                    console.log(err);
                    callback(500, undefined, 'html');
                }
            });
        }
        else {
            callback(404, undefined, 'html');
        }
    }
    else {
        callback(405, undefined, 'html');
    }
};

// export the module
module.exports = staticHandler;