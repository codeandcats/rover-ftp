var common = require('./common');
var cli = require('commander');
var serverList = require('../servers');
var PromiseFtp = require('promise-ftp');

cli
	.command('fetch <name>')
	.action(function(serverName) {
		
		serverList.get(serverName).then(server =>
		{
			if (!server) {
				common.showErrorAndExit('Server not found');
			}
			else {
				
				var ftp = new PromiseFtp();
				
				var options = {
					host: server.url,
					user: server.userName,
					password: server.password
				};
				
				var path = server.paths.remote || '';
				
				console.log('Connecting to ' + server.name + '...');
				
				ftp
					.connect(options)
					.catch(err => console.error(err))
					.then(function (serverMessage) {
						console.log('Connected');
						console.log('Server message: ' + serverMessage);
						
						return listNewFiles(ftp, path);
					}).then(function (list) {
						console.log('Directory listing:');
						console.dir(list);
						return ftp.end();
					});
				
			}
		}).catch(err => {
			console.err("Error: ", err);
			process.exit(1);
		});
		
	});

function listNewFiles(path) {
	
	return new Promise((resolve, reject) => {
		
		ftp.list('/' + path).then(listing => {
			
			
			
		});
		
	});
	
}