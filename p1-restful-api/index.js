var servers = require('./lib/servers');
var workers = require('./lib/workers');

var app = {};

// initialization function
app.init = function () {
    // start the HTTP and HTTPS servers
    servers.init();

    // start the background workers
    workers.init();
};

// start the app
app.init();

// export the module
module.exports = app;