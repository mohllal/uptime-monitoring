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

// bind the logout button
app.bindLogoutButton = function () {
    document.getElementById("logoutButton").addEventListener("click", function (e) {
        // stop it from redirecting anywhere
        e.preventDefault();

        // log the user out
        app.logUserOut();
    });
};

// Log the user out then redirect them
app.logUserOut = function () {
    // get the current token id
    var tokenId = typeof (app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : false;

    // send the current token to the tokens endpoint to delete it
    var queryStringObject = {
        'id': tokenId
    };
    app.client.request(undefined, 'api/auth', 'DELETE', queryStringObject, undefined, function (statusCode, responsePayload) {
        // set the app.config token as false
        app.setSessionToken(false);

        // send the user to the logged out page
        window.location = '/session/delete';
    });
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
        // take the phone and password, and use it to log the user in
        var newPayload = {
            'phone': requestPayload.phone,
            'password': requestPayload.password
        };

        app.client.request(undefined, 'api/auth', 'POST', undefined, newPayload, function (newStatusCode, newResponsePayload) {
            // display an error on the form if needed
            if (newStatusCode !== 201) {

                // set the formError field with the error text
                document.querySelector("#" + formId + " .formError").innerHTML = 'Sorry, an error has occured. Please try again.';

                // show (unhide) the form error field on the form
                document.querySelector("#" + formId + " .formError").style.display = 'block';

            } else {
                // if successful, set the token and redirect the user
                app.setSessionToken(newResponsePayload);
                window.location = '/checks/all';
            }
        });
    }

    // if login was successful, set the token in localstorage and redirect the user
    if (formId == 'sessionCreate') {
        app.setSessionToken(responsePayload);
        window.location = '/checks/all';
    }
};

// get the session token from localstorage and set it in the app.config object
app.getSessionToken = function () {
    var tokenString = localStorage.getItem('token');
    if (typeof (tokenString) == 'string') {
        try {
            var token = JSON.parse(tokenString);
            app.config.sessionToken = token;
            if (typeof (token) == 'object') {
                app.setLoggedInClass(true);
            } else {
                app.setLoggedInClass(false);
            }
        } catch (e) {
            app.config.sessionToken = false;
            app.setLoggedInClass(false);
        }
    }
};

// set (or remove) the loggedIn class from the body
app.setLoggedInClass = function (add) {
    var target = document.querySelector("body");
    if (add) {
        target.classList.add('loggedIn');
    } else {
        target.classList.remove('loggedIn');
    }
};

// set the session token in the app.config object as well as localstorage
app.setSessionToken = function (token) {
    app.config.sessionToken = token;
    var tokenString = JSON.stringify(token);
    localStorage.setItem('token', tokenString);
    if (typeof (token) == 'object') {
        app.setLoggedInClass(true);
    } else {
        app.setLoggedInClass(false);
    }
};

// renew the token
app.renewToken = function (callback) {
    var currentToken = typeof (app.config.sessionToken) == 'object' ? app.config.sessionToken : false;
    if (currentToken) {
        // update the token with a new expiration
        var payload = {
            'id': currentToken.id,
            'extend': true,
        };
        app.client.request(undefined, 'api/tokens', 'PUT', undefined, payload, function (statusCode, responsePayload) {
            // display an error on the form if needed
            if (statusCode == 200) {
                // get the new token details
                var queryStringObject = {
                    'id': currentToken.id
                };
                app.client.request(undefined, 'api/auth', 'GET', queryStringObject, undefined, function (statusCode, responsePayload) {
                    // display an error on the form if needed
                    if (statusCode == 200) {
                        app.setSessionToken(responsePayload);
                        callback(false);
                    } else {
                        app.setSessionToken(false);
                        callback(true);
                    }
                });
            } else {
                app.setSessionToken(false);
                callback(true);
            }
        });
    } else {
        app.setSessionToken(false);
        callback(true);
    }
};

// Loop to renew token often
app.tokenRenewalLoop = function () {
    setInterval(function () {
        app.renewToken(function (err) {
            if (!err) {
                console.log("Token renewed successfully @ " + Date.now());
            }
        });
    }, 1000 * 60);
};

// init (bootstrapping)
app.init = function () {
    // bind all form submissions
    app.bindForms();

    // bind logout logout button
    app.bindLogoutButton();

    // get the token from localstorage
    app.getSessionToken();

    // renew token
    app.tokenRenewalLoop();
};

// call the init processes after the window loads
window.onload = function () {
    app.init();
};