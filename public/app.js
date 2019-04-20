/*
 * frontend logic for the application
 */

var app = {};

// configurations for the client-side
app.config = {
    sessionToken: false
};

// AJAX client (for the restful api)
app.client = {};

app.client.request = function (headers, path, method, queryString, payload, callback) {

    // set default values
    headers = typeof (headers) == 'object' && headers != null ? headers : {};
    path = typeof (path) == 'string' && path != null ? path : '/';
    method = typeof (method) == 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(method.toUpperCase()) > -1 != null ? method.toUpperCase() : 'GET';
    queryString = typeof (queryString) == 'object' && queryString != null ? queryString : {};
    payload = typeof (payload) == 'object' && payload != null ? payload : {};
    callback = typeof (callback) == 'function' && callback != null ? callback : false;

    // add the query string sent, to the path
    var requestUrl = path + '?';
    var numberOfQueryStringKeys = 0;
    for (var queryKey in queryString) {
        if (queryString.hasOwnProperty(queryKey)) {
            var element = queryString[queryKey];

            numberOfQueryStringKeys++;
            if (numberOfQueryStringKeys > 1) {
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
    for (var headerKey in headers) {
        if (headers.hasOwnProperty(headerKey)) {
            xhr.setRequestHeader(headerKey, headers[headerKey]);
        }
    }

    // add the current session token to the request headers
    if (app.config.sessionToken) {
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
                } catch (error) {
                    callback(statusCode, false);
                }
            }
        }
    };

    // send the payload JSON
    var payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
};


// bind the forms
app.bindForms = function () {
    document.querySelector("form").addEventListener("submit", function (e) {

        // Stop it from submitting
        e.preventDefault();
        var formId = this.id;
        var path = this.action;
        var method = this.method.toUpperCase();

        // Hide the error message (if it's currently shown due to a previous error)
        document.querySelector("#" + formId + " .formError").style.display = 'hidden';

        // Turn the inputs into a payload
        var payload = {};
        var elements = this.elements;
        for (var i = 0; i < elements.length; i++) {
            if (elements[i].type !== 'submit') {
                var valueOfElement = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
                payload[elements[i].name] = valueOfElement;
            }
        }

        // call the API
        app.client.request(undefined, path, method, undefined, payload, function (statusCode, responsePayload) {

            // display an error on the form if needed
            if (statusCode !== 201) {
                console.log(statusCode);
                // try to get the error from the api, or set a default error message
                var error = typeof (responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';

                // set the formError field with the error text
                document.querySelector("#" + formId + " .formError").innerHTML = error;

                // show (unhide) the form error field on the form
                document.querySelector("#" + formId + " .formError").style.display = 'block';

            } else {
                // if successful, send to form response processor
                app.formResponseProcessor(formId, payload, responsePayload);
            }

        });
    });
};

// form response processor
app.formResponseProcessor = function (formId, requestPayload, responsePayload) {
    var functionToCall = false;
    if (formId == 'accountCreate') {
        console.log('The accountCreate form is successfully submitted!');
        // the account has been created successfully
    }
};

// init (bootstrapping)
app.init = function () {
    // bind all form submissions
    app.bindForms();
};

// call the init processes after the window loads
window.onload = function () {
    app.init();
};