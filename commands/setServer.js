var consoleUtils = require('../utils/console');
var cli = require('commander');
var config = require('../config');

cli
	.command('set-server <name>')
	.description('Registers a server to download from')
	.option('-U, --url <url>', 'Url to FTP server')
	.option('-u, --username <username>', 'Username to authenticate with')
	.option('-p, --password <password>', 'Password to authenticate with')
	.option('-r, --remote <path>', 'Remote path on server')
	.option('-l, --local <path>', 'Local path to download to')
	.option('-t, --temp <path>', 'Local temporary folder')
	.option('--secure <value>',
		'"true" for control and data connection encryption, ' +
		'"control" for control connection encryption only, ' +
		'"implicit" for implicitly encrypted control connection (this mode is deprecated in modern times, but usually uses port 990), ' +
		'or "false" for no encryption.',
		/^(true|control|implicit|false)$/i)
	.option('--timeout <seconds>', 'Connection timeout')
	//.option('-i, --include <filters>', 'Only download files matching filter')
	//.option('-e, --exclude <filters>', 'Dont download files matching filter')
	.action(function(name, options) {
		
		var server = {
			name: name,
			url: options.url,
			secure: options.secure,
			timeout: options.timeout,
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
		
		config.servers.set(server)
			.then(() => {
				console.log('Updated Server "' + server.name + '"');
				process.exit(0);
			})
			.catch(consoleUtils.showErrorAndExit);
	});
