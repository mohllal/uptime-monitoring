var https = require('https');
var querystring = require('querystring');
var config = require('../config');

var twilio = {};

// define base url for the api
twilio.baseUrl = '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json';

// send SMS using twilio API
twilio.sendTwilioSms = function (phone, msg, callback) {
    // validate parameters
    phone = typeof (phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    msg = typeof (msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
    
    if (phone && msg) {

        // configure the request payload
        var payload = {
            'From': config.twilio.fromPhone,
            'To': '+20' + phone,
            'Body': msg
        };
        var stringPayload = querystring.stringify(payload);


        // configure the request details
        var requestDetails = {
            'protocol': 'https:',
            'hostname': 'api.twilio.com',
            'method': 'POST',
            'path': twilio.baseUrl,
            'auth': config.twilio.accountSid + ':' + config.twilio.authToken,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        };

        // instantiate the request object
        var req = https.request(requestDetails, function (res) {
            // grab the status of the sent request
            var status = res.statusCode;
            //console.log(res.error_code);
            
            // callback successfully if the request went through
            if (status == 200 || status == 201) {
                callback(false);
            } 
            else {
                callback('Status code returned was ' + status);
            }
        });

        // bind to the error event so it doesn't get thrown
        req.on('error', function (e) {
            callback(e);
        });

        // add the payload
        req.write(stringPayload);

        // end the request
        req.end();
    } 
    else {
        callback('Given parameters were missing or invalid');
    }
};

// export the module
module.exports = twilio;