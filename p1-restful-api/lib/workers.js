var config = require('../config');
var _data = require('./data');
var twilio = require('./twilio');
var url = require('url');
var http = require('http');
var https = require('https');
var _logs = require('./logs');

var workers = {};

// phase - 5
// alert the user as to a change in their check status
workers.alertUserToStatusChange = function(newCheckData){
    // craft a message that contains the status of the check
    var msg = 'Alert: Your check for ' + newCheckData.method.toUpperCase() + ' ' + newCheckData.protocol + '://' + newCheckData.url + ' is currently ' + newCheckData.state;
    
    // send sms to the user
    twilio.sendTwilioSms(newCheckData.phone, msg, function(err){
        if(!err){
            console.log("Success: User was alerted to a status change in their check, via sms: ", msg);
        } 
        else {
            console.log("Error: Could not send sms alert to user who had a state change in their check", err);
        }
    });
};

// phase - 4
// process the check output, update the check data as needed, and trigger an alert if needed
// special logic for accommodating a check that has never been tested before (don't alert on that one)
workers.processCheckOutput = function(check, checkOutput) {
    // decide if the check is considered up or down
    var state = !checkOutput.error && checkOutput.responseCode && check.successCodes.indexOf(checkOutput.responseCode) > -1 ? 'up' : 'down';

    // decide if an alert is warranted
    var alertWarranted = check.lastChecked && check.state !== state ? true : false;

    // logging to a file
    var timeOfCheck = Date.now();
    workers.log(check, checkOutput, state, alertWarranted, timeOfCheck);
    
    // update the check data
    var newCheckData = check;
    newCheckData.state = state;
    newCheckData.lastChecked = timeOfCheck;

    // save the updates
    _data.update('checks', newCheckData.id, newCheckData, function(err){
        if(!err){
            // send the new check data to the next phase in the process if needed
            if(alertWarranted){
                workers.alertUserToStatusChange(newCheckData);
            } 
            else {
                console.log("Check output has not changed, no alert needed");
            }
        } 
        else {
            console.log("Error trying to save updates to one of the checks");
        }
    });  
};

// phase - 3
// perform the check, send the check and the output of the check to the next phase in the process
workers.performCheck = function(check) {
    // define the check output
    var checkOutput = {
        'error': false,
        'statusCode': false
    };

    // mark the output to has-not-been sent yet
    outputSent = false;

    // parse the check data
    var parsedUrl = url.parse(check.protocol + '://' + check.url, true);
    var hostname = url.hostname;
    var path = url.path;

    // construct the request
    var requestDetails = {
        'protocol': check.protocol + ':',
        'hostname': hostname,
        'method': check.method,
        'path': path,
        'timeout': 1000 * check.timeoutSeconds
    };

    // instantiate the request based on the check protocol type
    var _protocolUsed = check.protocol == 'http'? http : https;
    var req = _protocolUsed.request(requestDetails, function (res) {
        // update the check output and pass the data along
        checkOutput.statusCode = res.statusCode;
        if (!outputSent) {
            workers.processCheckOutput(check, checkOutput);
            outputSent = true;
        }
    });

    // bind to the error event so it doesn't get thrown
    req.on('error',function(e){
        // update the checkOutcome and pass the data along
        checkOutput.error = {'error' : true, 'value' : e};
        
        if(!outputSent){
            workers.processCheckOutput(check, checkOutput);
            outputSent = true;
        }
    });

    // bind to the timeout event
    req.on('timeout',function(){
        // update the checkOutcome and pass the data along
        checkOutput.error = {'error' : true, 'value' : 'timeout'};
        
        if(!outputSent){
            workers.processCheckOutput(check, checkOutput);
            outputSent = true;
        }
    });

    // end the request
    req.end();
};

// phase - 2
// sanity checking the check data
workers.validateCheckData = function(check) {
    check = typeof(check) == 'object' && check !== null ? check : {};
    check.id = typeof(check.id) == 'string' && check.id.trim().length > 20 ? check.id.trim() : false;
    check.phone = typeof(check.phone) == 'string' && check.phone.trim().length == 10 ? check.phone.trim() : false;
    check.protocol = typeof(check.protocol) == 'string' && ['http','https'].indexOf(check.protocol) > -1 ? check.protocol : false;
    check.url = typeof(check.url) == 'string' && check.url.trim().length > 0 ? check.url.trim() : false;
    check.method = typeof(check.method) == 'string' &&  ['POST','GET','PUT','DELETE'].indexOf(check.method) > -1 ? check.method : false;
    check.successCodes = typeof(check.successCodes) == 'object' && check.successCodes instanceof Array && check.successCodes.length > 0 ? check.successCodes : false;
    check.timeoutSeconds = typeof(check.timeoutSeconds) == 'number' && check.timeoutSeconds % 1 === 0 && check.timeoutSeconds >= 1 && check.timeoutSeconds <= 5 ? check.timeoutSeconds : false;
    
    // set the keys that may not be set (if the workers have never seen this check before)
    check.state = typeof(check.state) == 'string' && ['up','down'].indexOf(check.state) > -1 ? check.state : 'down';
    check.lastChecked = typeof(check.lastChecked) == 'number' && check.lastChecked > 0 ? check.lastChecked : false;
  
    // if all checks pass, pass the data along to the next step in the process
    if (check.id && check.phone && check.protocol &&
    check.url && check.method && check.successCodes && check.timeoutSeconds){
        workers.performCheck(check);
    } 
    else {
        // if checks fail, log the error and fail silently
        console.log("Error: one of the checks is not properly formatted. Skipping.");
    }
};

// phase - 1
// lookup all checks, get their data and send them to a validator
workers.gatherAllChecks = function() {
    // get all the checks
    _data.list('checks', function(err, data) {
        if (!err && data && data.length > 0) {
            data.forEach(function(check){
                // read the check data
                _data.read('checks', check, function (err, data) {
                    if (!err && data) {
                        // validate the check data
                        workers.validateCheckData(data);
                    }
                    else {
                        // log errors to the console
                        console.log('Error: cannot read a check data', err);
                    }
                });
            });
        }
        else {
            // log errors to the console
            console.log('Error: cannot gathering all the checks', err);
        }
    });
};

// timer to execute the worker process once per time interval
workers.loop = function() {
    setInterval(function() {
        workers.gatherAllChecks();
    }, config.workerInterval);
};

// initialization function
workers.init = function() {
    // execute all the checks immediately
    workers.gatherAllChecks();

    // loop the checks so that they will be executed every time interval
    workers.loop();

    // compress log files immediately
    workers.compressLogs();

    // loop the compress process so that it will be executed every time interval
    workers.compressLogsLoop();
};

// log to a file
workers.log = function(check, checkOutput, state, alertWarranted, timeOfCheck) {
    // construct the log data
    var logData = {
        'check': check,
        'output': checkOutput,
        'state': state,
        'alert': alertWarranted,
        'time': timeOfCheck
    };

    // log data to a file with name same as the check id
    _logs.append(check.id, logData, function (err) {
        if (!err) {
            console.log('Logging to file succeeded');
        }
        else {
            console.log('Logging to file failed');
        }
    });

};

// compress the log files
workers.compressLogs = function() {
    // list all log files (non-compressed ones)
    _logs.list(false, function (err, data) {
        if (!err && data && data.length > 0) {
            data.forEach(function(log){
                // compress the data to a different file
                var logId = log.replace('.log','');
                var newFileId = logId + '-' + Date.now();
                
                _logs.compress(logId, newFileId, function(err){
                    if(!err){
                        // truncate the log
                        _logs.truncate(logId, function(err){
                            if(!err){
                                console.log("Success truncating log file");
                            } 
                            else {
                                console.log("Error truncating log file");
                            }
                        });
                    } 
                    else {
                        console.log("Error compressing one of the log files.",err);
                    }
                });
            });
        }
        else {
            console.log('Error: could not find any logs to compress');
        }
    });
};

// timer to execute the compress process once per time interval
workers.compressLogsLoop = function() {
    setInterval(function() {
        workers.compressLogs();
    }, config.compressLogsInterval);
};

// export the module
module.exports = workers;