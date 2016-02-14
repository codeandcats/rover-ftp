var common = require('./common');
var cli = require('commander');
var serverList = require('../servers');

cli
	.command('set <name> <url>')
	.option('-u, --username <username>', 'Username to authenticate with')
	.option('-p, --password <password>', 'Password to authenticate with')
	.option('-r, --remote <path>', 'Remove path on server')
	.option('-l, --local <path>', 'Local path to download to')
	.option('-t, --temp <path>', 'Local temporary folder')
	.option('-i, --include <filters>', 'Only download files matching filter')
	.option('-e, --exclude <filters>', 'Dont download files matching filter')
	.action(function(name, url, options) {
		
		var server = {
			name: name,
			url: url,
			credentials: {
				userName: options.username,
				password: options.password
			},
			paths: {
				remote: options.remote,
				local: options.local,
				temp: options.temp
			},
			filters: {
				include: options.include,
				exclude: options.exclude
			}
		};
		
		serverList
			.set(server)
			.then(() => {
				console.log('Updated Server "' + server.name + '"');
				process.exit(0);
			})
			.catch(common.showErrorAndExit);
	});
