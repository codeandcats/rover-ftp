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
	
	server.paths = server.paths || {};
	server.filters = server.filters || {};
	utils.removeUndefinedProperties(server);
	
	return new Promise(function(resolve, reject) {
		getFile().then(function(file) {
			file = file || {};
			file.servers = file.servers || [];
			
			var existing = _.find(file.servers, function(s) {
				return (s.name || '').trim().toLowerCase() == server.name; 
			});
			
			if (existing) {
				existing.url = server.url;
				existing.paths = existing.paths || {};
				existing.filters = existing.filters || {};
				
				existing.paths.remote = server.paths.remote;
				existing.paths.local = server.paths.local;
				existing.paths.temp = server.paths.temp;
				existing.filters.include = server.filters.include;
				existing.filters.exclude = server.filters.exclude;
				
				utils.removeUndefinedProperties(existing);
			}
			else {
				var newServer = {
					name: server.name,
					url: server.url,
					paths: {
						remote: server.paths.remote,
						local: server.paths.local,
						temp: server.paths.temp
					},
					filters: {
						include: server.filters.include,
						exclude: server.filters.exclude
					}
				};
				
				utils.removeUndefinedProperties(newServer);
				
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

module.exports.remove = function() {
}