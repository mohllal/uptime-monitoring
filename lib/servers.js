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
        
        // if the request is within the public directory use to the public handler instead
        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;
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
        chosenHandler(data,function(statusCode, payload, contentType){
            // determine the content type of the response (default to json)
            contentType = typeof(contentType) == 'string'? contentType : 'json';

            // use the status code returned from the handler, or set the default status code to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            var payloadString = '';
            // return content-specific response parts
            if (contentType == 'json') {
                // use the payload returned from the handler, or set the default payload to an empty object
                payload = typeof(payload) == 'object'? payload : {};
                // convert the payload to a string
                payloadString = JSON.stringify(payload);
                res.setHeader('Content-Type', 'application/json');
            }
            else if (contentType == 'html') {
                // use the payload returned from the handler, or set the default payload to an empty string
                payloadString = typeof(payload) == 'string'? payload : '';
                res.setHeader('Content-Type', 'text/html');
            }
            else if (contentType == 'css') {
                // use the payload returned from the handler, or set the default payload to an empty string
                payloadString = typeof(payload) !== 'undefined'? payload : '';
                res.setHeader('Content-Type', 'text/css');
            }
            else if (contentType == 'js') {
                // use the payload returned from the handler, or set the default payload to an empty string
                payloadString = typeof(payload) !== 'undefined'? payload : '';
                res.setHeader('Content-Type', 'text/javascript');
            }
            else if (contentType == 'png'){
                // use the payload returned from the handler, or set the default payload to an empty string
                payloadString = typeof(payload) !== 'undefined'? payload : '';
                res.setHeader('Content-Type', 'image/png');
            }
            else if (contentType == 'jpg'){
                // use the payload returned from the handler, or set the default payload to an empty string
                payloadString = typeof(payload) !== 'undefined'? payload : '';
                res.setHeader('Content-Type', 'image/jpg');
            }
            else if (contentType == 'favicon'){
                // use the payload returned from the handler, or set the default payload to an empty string
                payloadString = typeof(payload) !== 'undefined'? payload : '';
                res.setHeader('Content-Type', 'image/x-icon');
            }
            else {
                 // use the payload returned from the handler, or set the default payload to an empty string
                 payloadString = typeof(payload) !== 'undefined'? payload : '';
                 res.setHeader('Content-Type', 'text/plain');
            }
            
            // return common response parts
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
    '': handlers.index,
    'account/create': handlers.accountCreate,
    'account/edit': handlers.accountEdit,
    'session/create': handlers.sessionCreate,
    'session/delete': handlers.sessionDelete,
    'favicon.ico': handlers.favicon,
    'public': handlers.public,
    'api/ping': handlers.ping,
    'api/users': handlers.users,
    'api/auth': handlers.auth,
    'api/checks': handlers.checks
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