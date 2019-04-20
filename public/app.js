/*
* frontend logic for the application
*/

var app = {};

console.log('Heey');

// configurations for the client-side
app.config = {
    sessionToken: false
};

// AJAX client (for the restful api)
app.client = {};

app.client.request = function (headers, path, method, queryString, payload, callback) {

    // set default values
    headers = typeof(headers) == 'object' && headers != null? headers: {};
    path = typeof(path) == 'string' && path != null? path: '/';
    method = typeof(method) == 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(method.toUpperCase()) > -1 != null? method.toUpperCase(): 'GET';
    queryString = typeof(queryString) == 'object' && queryString != null? queryString: {};
    payload = typeof(payload) == 'object' && payload != null? payload: {};
    callback = typeof(callback) == 'function' && callback != null? callback: false;

    // add the query string sent, to the path
    var requestUrl = path + '?';
    var numberOfQueryStringKeys = 0;
    for (var queryKey in queryString) {
        if (queryString.hasOwnProperty(queryKey)) {
            var element = queryString[queryKey];

            numberOfQueryStringKeys++;
            if(numberOfQueryStringKeys > 1) {
                requestUrl += '&';
            }

            // add the key and the values
            requestUrl += queryKey + '=' + element;
        }
    }

    // form the http request as a JSON object
    xhr = new XMLHttpRequest();
    xhr.open(method, requestUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');


    // for each header sent, add it to the request
    for(var headerKey in headers){
        if(headers.hasOwnProperty(headerKey)){
            xhr.setRequestHeader(headerKey, headers[headerKey]);
        }
    }
    
    // add the current session token to the request headers
    if(app.config.sessionToken) {
        xhr.setRequestHeader('token', app.config.sessionToken.id);
    }

    // handle the response
    xhr.onreadystatechange = function () {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            var statusCode = xhr.status;
            var response = xhr.responseText;

            if (callback) {
                try {
                    var parsedResponse = JSON.parse(response);
                    callback(statusCode, parsedResponse);
                } catch(error) {
                    callback(statusCode, false);
                }
            }
        }
    };

    // send the payload JSON
    var payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
};