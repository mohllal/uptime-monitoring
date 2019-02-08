var fs = require('fs');
var path = require('path');

var logs = {};

logs.baseDir = path.join(__dirname, '../.logs/');


// append data to a file (create the file if it doesn't exist)
logs.append = function(fileName, data, callback) {
    var filePath = logs.baseDir + fileName + '.log';
    
    // open file for appending
    fs.open(filePath, 'a', function (err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // convert data to plain string
            var dataString = JSON.stringify(data) + '\n';

            // append to file
            fs.appendFile(fileDescriptor, dataString, function (err) {
                if (!err){
                    // close file
                    fs.close(fileDescriptor, function (err) {
                        if (!err){
                            callback(false);
                        }
                        else {
                            callback('Error closing new file');
                        }
                    });
                }
                else {
                    callback('Error appending to file');
                }
            });
        }
        else {
            callback('Error creating new file');
        }
    }); 
};

// export the module
module.exports = logs;