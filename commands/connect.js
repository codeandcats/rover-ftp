var consoleUtils = require('./consoleUtils');
var cli = require('commander');
var serverList = require('../servers');

cli
	.command('connect')
	.value('url')
	.value('user-name')
	.value('password')
	.value('path')
	.action(function(command) {
		var PromiseFtp = require('promise-ftp');
		
		var ftp = new PromiseFtp();
		
		var options = {
			host: command.value('url'),
			user: command.value('user-name'),
			password: command.value('password')
		};
		
		var path = command.value('path') || '';
		
		ftp
			.connect(options)
			.catch(err => console.error(err))
			.then(function (serverMessage) {
				console.log('Server message: ' + serverMessage);
				return ftp.list('/' + path);
			}).then(function (list) {
				console.log('Directory listing:');
				console.dir(list);
				return ftp.end();
			}).then(() => {
				process.exit(0);
			})
	});