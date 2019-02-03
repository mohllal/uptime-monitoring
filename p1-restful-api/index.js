var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var fs = require('fs');
var config = require('./config');

var httpServer = http.createServer(function (req, res) {
    unifiedServer(req, res);
});

// https options
var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};

var httpsServer = https.createServer(httpsServerOptions, function (req, res) {
    unifiedServer(req, res);
});

// all the server logic goes here
var unifiedServer = function (req, res) {
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
        var chosenHandler = typeof(routes[trimmedPath]) !== 'undefined' ? routes[trimmedPath] : handlers.notFound;

        // construct the data object
        var data = {
            'trimmedPath': trimmedPath,
            'method': method,
            'queryStringObject': queryStringObject,
            'headersObject': headersObject,
            'payload': payload
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
            
            console.log("Returning this response: ", statusCode, payloadString);
        });

        console.log('Request url: '+ req.url);
        console.log('Request received on path: '+ trimmedPath);
        console.log("Request received with method: " + method);
        console.log("Request received with these query string params: ", queryStringObject);
        console.log("Request received with these headers: ", headersObject);
        console.log("Request received with this payload: ", payload);
    });
};

//define request handlers
var handlers = {};
handlers.sampleUrl = function (data, callback) {
    callback(200, {'name': 'sampleUrl handler'});
};
handlers.notFound = function (data, callback) {
    callback(404);
};

// define request routes
var routes = {
    'sampleUrl': handlers.sampleUrl
};

// start the http server
httpServer.listen(config.httpPort, config.hostname, function () {
    console.log("HTTP server running at http://" + config.hostname + ":" + config.httpPort + "/ in " + config.name + " mode");
});

// start the https server
httpsServer.listen(config.httpsPort, config.hostname, function () {
    console.log("HTTPS server running at https://" + config.hostname + ":" + config.httpsPort + "/ in " + config.name + " mode");
});