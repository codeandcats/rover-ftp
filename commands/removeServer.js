var common = require('./common');
var cli = require('commander');
var serverList = require('../servers');

cli
	.command('remove <name>')
	.action(function(serverName) {
		serverList.get(serverName).then(server =>
		{
			if (!server) {
				common.showErrorAndExit('Server not found');
			}
			else {
				serverList
					.remove(serverName)
					.then(() => {
						console.log('Removed server: ' + serverName);
						process.exit(0);
					});
			}
		}).catch(err => {
			common.showErrorAndExit('Error removing server: ' + err);
		});
	});
