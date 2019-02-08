var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var fs = require('fs');
var config = require('../config');
var handlers = require('../handlers/main');
var helpers = require('./helpers');
var path = require('path');

var servers = {};

servers.httpServer = http.createServer(function (req, res) {
    servers.unifiedServer(req, res);
});

// https options
servers.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '../https/cert.pem'))
};

servers.httpsServer = https.createServer(servers.httpsServerOptions, function (req, res) {
    servers.unifiedServer(req, res);
});

// all the server logic goes here
servers.unifiedServer = function (req, res) {
    // get the request url path
    var parsedUrl = url.parse(req.url, true);
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // get the request http method
    var method = req.method.toUpperCase();

    // get the request query string as an object
    var queryStringObject = parsedUrl.query;

    // get the request headers as an object
    var headersObject = req.headers;

    // get the request payload
    var decoder = new StringDecoder('utf-8');
    var payload = '';

    req.on("data", function (data) {
        payload += decoder.write(data);
    });
    
    req.on("end", function () {
        payload += decoder.end();

        // choose the request handler based on path
        var chosenHandler = typeof(servers.routes[trimmedPath]) !== 'undefined' ? servers.routes[trimmedPath] : handlers.notFound;
        
        // parse payload to object
        var parsedPayload = helpers.parseJsonToObject(payload);

        // construct the data object
        var data = {
            'trimmedPath': trimmedPath,
            'method': method,
            'queryStringObject': queryStringObject,
            'headersObject': headersObject,
            'payload': parsedPayload
        };
        
        // route the request to the handler
        chosenHandler(data,function(statusCode,payload){
            // use the status code returned from the handler, or set the default status code to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // Use the payload returned from the handler, or set the default payload to an empty object
            payload = typeof(payload) == 'object'? payload : {};

            // convert the payload to a string
            var payloadString = JSON.stringify(payload);

            // return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            
            // console.log("Returning this response: ", statusCode, payloadString);
        });

        // console.log('Request url: '+ req.url);
        // console.log('Request received on path: '+ trimmedPath);
        // console.log("Request received with method: " + method);
        // console.log("Request received with these query string params: ", queryStringObject);
        // console.log("Request received with these headers: ", headersObject);
        // console.log("Request received with this payload: ", payload);
    });
};

// define request routes
servers.routes = {
    'ping': handlers.ping,
    'users': handlers.users,
    'auth': handlers.auth,
    'checks': handlers.checks
};

// initialization function
servers.init = function () {
    // start the http server
    servers.httpServer.listen(config.httpPort, config.hostname, function () {
        console.log("HTTP server running at http://" + config.hostname + ":" + config.httpPort + "/ in " + config.name + " mode");
    });

    // start the https server
    servers.httpsServer.listen(config.httpsPort, config.hostname, function () {
        console.log("HTTPS server running at https://" + config.hostname + ":" + config.httpsPort + "/ in " + config.name + " mode");
    });
};

// export the module
module.exports = servers;