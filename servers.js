var fs = require('fs');
var jsonFile = require('jsonfile');
var _ = require('lodash');
var utils = require('./utils.js');

var fileName = process.cwd() + '/servers.json';

function getFile() {
	return new Promise(function(resolve, reject) {
		fs.stat(fileName, function(err, stats) {
			if (err) {
				resolve(undefined);
			}
			else if (stats.isFile()) {
				jsonFile.readFile(fileName, function(err, obj) {
					if (err) {
						reject(err);
					}
					else {
						resolve(obj);
					}
				});
			}
			else {
				resolve(undefined);
			}
		});
	});
}

function setFile(obj) {	
	return new Promise(function(resolve, reject) {
		jsonFile.writeFile(fileName, obj, { spaces: 4 }, function(err) {
			if (err) {
				reject(err);
			}
			else {
				resolve(obj);
			}
		});
	});
}

module.exports.list = function() {
	return new Promise(function(resolve, reject) {
		getFile().then(function(file) {
			resolve((file && file.servers) || []);
		}).catch(function(err) {
			reject(err);
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
	
	server.name = (server.name || '').trim();
	server.paths = server.paths || {};
	server.filters = server.filters || {};
	utils.removeUndefinedProperties(server);
	
	return new Promise(function(resolve, reject) {
		getFile().then(function(file) {
			file = file || {};
			file.servers = file.servers || [];
			
			var existing = _.find(file.servers, s => (s.name || '').toLowerCase() == server.name.toLowerCase());
			
			if (existing) {
				utils.applyDefinedPropertyValues(server, existing);
			}
			else {
				var newServer = {};
				utils.applyDefinedPropertyValues(server, newServer);
				file.servers.push(newServer);
			}
			
			setFile(file).then(function(file) {
				resolve(file);
			}).catch(function(err) {
				reject(err);
			});
		});
	});
	
}

module.exports.remove = function(name) {
	name = name.trim().toLowerCase();
	
	return new Promise((resolve, reject) => {
		getFile().then(function(file) {
			file = file || {};
			file.servers = file.servers || {};
			
			_.remove(file.servers, s => s.name.toLowerCase() == name);
			
			setFile(file)
				.then(resolve)
				.catch(reject);
		});
	});
}

