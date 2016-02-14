var common = require('./common');
var cli = require('commander');
var serverList = require('../servers');

cli
	.command('list')
	.option('-d, --details')
	.action(options => {
		serverList.list().then(servers => {
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
		}).catch(common.showErrorAndExit);
	});
