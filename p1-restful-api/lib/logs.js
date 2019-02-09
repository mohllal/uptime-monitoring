var fs = require('fs');
var path = require('path');
var zlib = require('zlib');

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

// list all the logs, and optionally include the compressed logs
logs.list = function(includeCompressedLogs, callback){
    fs.readdir(logs.baseDir, function(err,data){
      if(!err && data && data.length > 0){
        var trimmedFileNames = [];
        
        data.forEach(function(fileName){
  
          // add the .log files
          if(fileName.indexOf('.log') > -1 && fileName != '.gitkeep'){
            trimmedFileNames.push(fileName.replace('.log', ''));
          }
  
          // add the .gz files
          if(fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs){
            trimmedFileNames.push(fileName.replace('.gz.b64', ''));
          }
        });
        
        callback(false, trimmedFileNames);
      } 
      else {
        callback(err,data);
      }
    });
};

// compress the contents of one .log file into a .gz.b64 file within the same directory
logs.compress = function (logId, newFileId, callback) {
    var sourceFile = logId + '.log';
    var destinationFile = newFileId + '.gz.b64';

    // read the source file
    fs.readFile(logs.baseDir + sourceFile, 'utf8', function (err, inputString) {
        if (!err && inputString) {
            // compress the data using gzip
            zlib.gzip(inputString, function (err, buffer) {
                if (!err && buffer) {
                    // send the data to the destination file
                    fs.open(logs.baseDir + destinationFile, 'wx', function (err, fileDescriptor) {
                        if (!err && fileDescriptor) {
                            // write to the destination file
                            fs.writeFile(fileDescriptor, buffer.toString('base64'), function (err) {
                                if (!err) {
                                    // close the destination file
                                    fs.close(fileDescriptor, function (err) {
                                        if (!err) {
                                            callback(false);
                                        } else {
                                            callback(err);
                                        }
                                    });
                                } else {
                                    callback(err);
                                }
                            });
                        } else {
                            callback(err);
                        }
                    });
                } else {
                    callback(err);
                }
            });

        } else {
            callback(err);
        }
    });
};

// decompress the contents of a .gz file into a string variable
logs.decompress = function (fileId, callback) {
    var fileName = fileId + '.gz.b64';
    
    fs.readFile(logs.baseDir + fileName, 'utf8', function (err, str) {
        if (!err && str) {
            // inflate the data
            var inputBuffer = Buffer.from(str, 'base64');
            zlib.unzip(inputBuffer, function (err, outputBuffer) {
                if (!err && outputBuffer) {
                    // callback with false and the data
                    var str = outputBuffer.toString();
                    callback(false, str);
                } else {
                    callback(err);
                }
            });
        } else {
            callback(err);
        }
    });
};

// truncate a log file
logs.truncate = function (logId, callback) {
    fs.truncate(logs.baseDir + logId + '.log', 0, function (err) {
        if (!err) {
            callback(false);
        } else {
            callback(err);
        }
    });
};
// export the module
module.exports = logs;