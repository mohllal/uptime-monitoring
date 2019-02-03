var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');

var server = http.createServer(function (req, res) {
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
});

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

// start the server
server.listen(config.port, config.hostname, function () {
    console.log("Server running at http://" + config.hostname + ":" + config.port + "/ in " + config.name + " mode");
});