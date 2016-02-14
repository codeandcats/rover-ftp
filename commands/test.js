var common = require('./common');
var cli = require('commander');
var serverList = require('../servers');

cli
	.command('test')
	.action(function(command) {
		console.log('Hello Universe')
		process.exit(0);
	});
