var consoleUtils = require('../utils/console');
var cli = require('commander');
var config = require('../config');

cli
	.command('set-server <name>')
	.option('-U, --url <url>', 'Url to FTP server')
	.option('-u, --username <username>', 'Username to authenticate with')
	.option('-p, --password <password>', 'Password to authenticate with')
	.option('-r, --remote <path>', 'Remote path on server')
	.option('-l, --local <path>', 'Local path to download to')
	.option('-t, --temp <path>', 'Local temporary folder')
	//.option('-i, --include <filters>', 'Only download files matching filter')
	//.option('-e, --exclude <filters>', 'Dont download files matching filter')
	.action(function(name, options) {
		
		var server = {
			name: name,
			url: options.url,
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
		
		config.servers
			.set(server)
			.then(() => {
				console.log('Updated Server "' + server.name + '"');
				process.exit(0);
			})
			.catch(consoleUtils.showErrorAndExit);
	});
