var cli = require('commander');
var ps = require('ps-nodejs');
var consoleUtils = require('../utils/console');

cli
	.command('wait <seconds>')
	.action(seconds => {
		console.log(`Waiting ${seconds} seconds...`);
		setTimeout(() => {
			console.log('Done');
			console.log('');
			process.exit(0);
		},
		seconds * 1000);
	});

cli
	.command('check')
	.action(() => {
		ps.lookup({ command: 'node' }, (err, results) => {
			if (err) {
				consoleUtils.showErrorAndExit(err);
			}
			else {
				var isRunning = false;
				
				console.log('');
				console.log('List of matching processes:');
				console.log('');
				
				results.forEach(proc => {
					if (proc) {
						console.log(`Id = ${proc.pid}, Command = "${proc.command}", Args = "${proc.arguments}"`);
						console.log('');
						
						if (proc.command == 'node') {
							if (!isRunning) {
								isRunning = proc.arguments.indexOf('rover-ftp') > -1;
							}
						}
					}
				});
				
				console.log('');
				console.log(`Rover-Ftp is ${isRunning ? 'already' : 'not already'} running`);
				
				process.exit(0);
			}
		});
	});
	