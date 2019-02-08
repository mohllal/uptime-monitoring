var servers = require('./lib/servers');

var app = {};

// initialization function
app.init = function () {
    // start the HTTP and HTTPS servers
    servers.init();
};

// start the app
app.init();

// export the module
module.exports = app;