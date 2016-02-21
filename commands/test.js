var consoleUtils = require('./consoleUtils');
var cli = require('commander');
var serverList = require('../servers');
var chalk = require('chalk');
var fs = require('fs');

cli
	.command('test')
	.action(function(command) {
		var fileName = 'C:\\Temp/hello.txt';
		fs.readFile(fileName, 'utf8', (err, data) => {
			if (err) {
				consoleUtils.showErrorAndExit(err);
			}
			else {
				console.log(data);
				process.exit(0);
			}
		});
	});
