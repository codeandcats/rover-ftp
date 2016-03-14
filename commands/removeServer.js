var consoleUtils = require('../utils/console');
var cli = require('commander');
var config = require('../config');

cli
	.command('remove-server <name>')
	.description('Unregisters a server')
	.action(function(serverName) {
		config.servers.get(serverName).then(server => {
			if (!server) {
				consoleUtils.showErrorAndExit(new Error('Server not found'));
			}
			else {
				config.servers
					.remove(serverName)
					.then(() => {
						console.log('Removed server: ' + serverName);
						process.exit(0);
					})
					.catch(consoleUtils.showErrorAndExit);
			}
		}).catch(consoleUtils.showErrorAndExit);
	});
