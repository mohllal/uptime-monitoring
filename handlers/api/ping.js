// container for the ping sub-handlers
var pingHandler = {};

pingHandler.ping = function(data, callback) {
    callback(200);
};

// export the module
module.exports = pingHandler;