var fs = require('fs');
var jsonFile = require('jsonfile');
var _ = require('lodash');

var fileName = process.cwd() + '/servers.json';

module.exports.list = function() {
	return new Promise(function(resolve, reject) {
		fs.stat(fileName, function(err, stats) {
			if (err) {
				resolve([]);
			}
			else if (stats.isFile()) {
				jsonFile.readFile(fileName, function(err, obj) {
					if (err) {
						reject(err);
					}
					else {
						resolve(obj.servers || []);
					}
				});
			}
			else {
				resolve([]);
			}
		});
	});
}

module.exports.get = function(name) {
	name = (name || '').trim().toLowerCase();
	
	return new Promise(function(resolve, reject) {
		module.exports.list()
			.then(function(servers) {
				var server = _.find(servers, function(s) {
					return (s.name || '').trim().toLowerCase() == name; 
				});
				
				resolve(server);
			})
			.catch(function(err) {
				reject(err);
			});
	});
}

module.exports.set = function(server) {
	
	
	
}

module.exports.remove = function() {
}