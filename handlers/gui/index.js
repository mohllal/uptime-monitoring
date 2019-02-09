// container for the index sub-handlers
var indexHandler = {};

indexHandler.index = function(data, callback) {
    callback(undefined, undefined, 'html');
};

// export the module
module.exports = indexHandler;