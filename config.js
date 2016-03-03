var fs = require('fs');
var jsonFile = require('jsonfile');
var _ = require('lodash');
var objectUtils = require('./utils/object');
var path = require('path');
var pkg = require('./package.json');
var fileUtils = require('./utils/file');

var appDataPath = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local');

function fileName() {
	return path.join(appDataPath, pkg.name, 'config.json');
}

module.exports.fileName = fileName;

function getFile() {
	return new Promise((resolve, reject) => {
		var defaults = {
			servers: [],
			mail: {}
		};
		
		fs.stat(fileName(), (err, stats) => {
			if (err) {
				resolve(defaults);
			}
			else if (stats.isFile()) {
				jsonFile.readFile(fileName(), (err, obj) => {
					if (err) {
						reject(err);
					}
					else {
						obj = obj || {};
						obj.servers = obj.servers || [];
						obj.servers.forEach(server => {
							server.credentials = server.credentials || {};
							server.paths = server.paths || {};
							server.filters = server.filters || {};
							if (server.lastFileDate) {
								server.lastFileDate = new Date(server.lastFileDate);
							}
						});
						resolve(obj);
					}
				});
			}
			else {
				resolve(defaults);
			}
		});
	});
}

function setFile(obj) {
	return new Promise((resolve, reject) => {
		fileUtils.makeDirectory(path.dirname(fileName())).then(() => {
			
			jsonFile.writeFile(fileName(), obj, { spaces: 4 }, err => {
				if (err) {
					reject(err);
				}
				else {
					resolve(obj);
				}
			});
			
		},
		reject);
	});
}

module.exports.servers = {};

module.exports.servers.list = () => {
	return new Promise((resolve, reject) => {
		getFile().then(file => {
			resolve((file && file.servers) || []);
		},
		reject);
	});
}

module.exports.servers.get = name => {
	name = (name || '').trim().toLowerCase();
	
	return new Promise((resolve, reject) => {
		module.exports.list()
			.then(servers => {
				var server = _.find(servers, s => (s.name || '').trim().toLowerCase() == name);
				
				resolve(server);
			},
			reject);
	});
}

module.exports.servers.set = server => {
	server.name = (server.name || '').trim();
	server.credentials = server.credentials || {};
	server.paths = server.paths || {};
	server.filters = server.filters || {};
	objectUtils.removeUndefinedProperties(server);
	
	return new Promise((resolve, reject) => {
		getFile().then(file => {
			var existing = _.find(file.servers, s => (s.name || '').toLowerCase() == server.name.toLowerCase());
			
			if (existing) {
				objectUtils.applyDefinedPropertyValues(server, existing);
			}
			else {
				var newServer = {};
				objectUtils.applyDefinedPropertyValues(server, newServer);
				file.servers.push(newServer);
			}
			
			setFile(file).then(resolve, reject);
		});
	});
}

module.exports.servers.remove = name => {
	name = name.trim().toLowerCase();
	
	return new Promise((resolve, reject) => {
		getFile().then(file => {
			_.remove(file.servers, s => s.name.toLowerCase() == name);
			
			setFile(file)
				.then(resolve)
				.catch(reject);
		});
	});
}

module.exports.mail = {};

module.exports.mail.get = () => {
	return new Promise((resolve, reject) => {
		getFile().then(file => {
			resolve(file.mail || {});
		},
		reject);
	});
}

module.exports.mail.set = mailSettings => {
	return new Promise((resolve, reject) => {
		mailSettings = mailSettings || {};
		objectUtils.removeUndefinedProperties(mailSettings);
		
		getFile().then(file => {
			file.mail = file.mail || {};
			file.mail.userName = mailSettings.userName;
			file.mail.password = mailSettings.password;
			file.mail.from = mailSettings.from;
			file.mail.to = mailSettings.to;
			file.mail.subject = mailSettings.subject;
			
			setFile(file).then(file => resolve(file), reject);
		},
		reject);
	});
}
