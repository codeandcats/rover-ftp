var cli = require('kitten-cli');
var serverList = require('./servers.js');

console.log('');

cli.commandsFromFile('commands.txt').then(function() {
	
	cli
		.command('server')
		.action(function(command) {
			serverList.list().then(function(servers) {
				if (servers.length == 0) {
					console.log('No servers defined');
				}
				else {
					console.log('Servers:\n');
					servers.forEach(function(server) {
						console.log('  ' + server.name + ' : ' + server.url);
					});
				}
			}).catch(function(err) {
				console.error(err);
			});
		})

		.command('server set')
		.action(function(command) {
			var server = {
				name: command.value('host-name'),
				url: command.value('host-url'),
				paths: {
					remote: optionValue(command, 'r', 'path'),
					local: optionValue(command, 'l', 'path'),
					temp: optionValue(command, 'l', 'path')
				},
				filters: {
					include: optionValue(command, 'i', 'filter'),
					exclude: optionValue(command, 'e', 'filter')
				}
			};
			
			serverList.set(server).then(() => console.log('Updated Server "' + server.name + '"'));
		})
		
		.command('server remove')
		.action(function(command) {
			var serverName = command.value('host-name');
			
			serverList.get(serverName).then(server =>
			{
				if (!server) {
					console.log('Server not found');
				}
				else {
					serverList
						.remove(command.value('host-name'))
						.then(() => console.log('Removed Server "' + serverName + '"'));
				}
			});
		})
		
		.command('fetch')
		.action(function(command) {
			
		})
		
		.command('test')
		.action(function(command) {
			
		})
		
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
				});
		});
		
	cli.run();

	function optionValue(command, optionName, valueName) {
		var option = command && command.option(optionName);
		var value = (option && option.value(valueName));
		return (value == null) ? undefined : value;
	}
	
});
