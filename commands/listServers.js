var consoleUtils = require('../utils/console');
var cli = require('commander');
var config = require('../config');

cli
	.command('servers')
	.description('Lists registered servers')
	.option('-d, --details')
	.action(options => {
		console.log('');
		config.servers.list().then(servers => {
			if (servers.length == 0) {
				console.log('No servers defined');
			}
			else {
				console.log('Servers:\n');
				servers.forEach(function(server) {
					
					if (!options.details) {
						console.log('  ' + server.name + ' : ' + server.url);
					}
					else {
						var showField = (display, value) => {
							if (value != undefined) {
								console.log('    ' + display + ' : ' + value);
							}
						};
						
						console.log('  ' + server.name);
						
						showField('Url', server.url);
						showField('Username', server.credentials.userName);
						showField('Password', server.credentials.password);
						showField('Secure', server.secure);
						showField('Timeout', server.timeout);
						showField('Remote Path', server.paths.remote);
						showField('Local Path', server.paths.local);
						showField('Temp Path', server.paths.temp);
						showField('Include', server.filters.include);
						showField('Exclude', server.filters.exclude);
						
						console.log('');
					} 
				});
			}
			process.exit(0);
		}).catch(consoleUtils.showErrorAndExit);
	});
