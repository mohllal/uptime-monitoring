var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

var lib = {};

// define base directory of the data folder
lib.baseDir = path.join(__dirname, '../.data/');

// write data to a file
lib.create = function (dir, file, data, callback) {
    var filePath = lib.baseDir + dir + '/' + file + '.json';
    
    // open file for writing
    fs.open(filePath, 'wx', function (err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // convert data to plain string
            var dataString = JSON.stringify(data);

            // write to file
            fs.writeFile(fileDescriptor, dataString, function (err) {
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
                    callback('Error writing to new file');
                }
            });
        }
        else {
            callback('Error creating new file');
        }
    });
};

// read data from a file
lib.read = function (dir, file, callback) {
    var filePath = lib.baseDir + dir + '/' + file + '.json'
    
    // read from file
    fs.readFile(filePath, 'utf8', function (err, data) {
        if (!err && data) {
            // parse data to json before returning it
            var JsonData = helpers.parseJsonToObject(data);
            callback(false, JsonData);
        }
        else {
            callback(err, data); 
        }
    });  
};

// update data in a file
lib.update = function (dir, file, data, callback) {
    var filePath = lib.baseDir + dir + '/' + file + '.json';
    
    // open file for updating
    fs.open(filePath, 'r+', function (err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // convert data to plain string
            var dataString = JSON.stringify(data);

            // truncate file
            fs.ftruncate(fileDescriptor, function (err) {
                if (!err){
                    // write to file
                    fs.writeFile(fileDescriptor, dataString, function (err) {
                        if (!err){
                            // close file
                            fs.close(fileDescriptor, function (err) {
                                if (!err){
                                    callback(false);
                                }
                                else {
                                    callback('Error closing file');
                                }
                            });
                        }
                        else {
                            callback('Error writing to file');
                        }
                    });
                }
                else {
                    callback('Error truncating file');
                }
            });


        }
        else {
            callback('Error updating file');
        }
    });
};

// delete a file
lib.delete = function (dir, file, callback) {
    var filePath = lib.baseDir + dir + '/' + file + '.json';
    
    // unlink file
    fs.unlink(filePath, function (err) {
        if (!err){
            callback(false);
        }
        else {
            callback('Error deleting file');
        }
    });
};

// export the module
module.exports = lib;