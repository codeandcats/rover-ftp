var consoleUtils = require('../utils/console');
var cli = require('commander');
var mailer = require('../mailer');
var config = require('../config');

cli
	.command('test-mail')
	.action(function() {
		config.mail.get().then(mailSettings => {
			console.log('');
				
			if (!mailSettings.userName && !mailSettings.password) {
				console.log('Mail has not been configured. See the set-mail command.');
				return;
			}
			
			var files = [
				{ fileName: 'totally-legal-file.mkv' },
				{ fileName: 'linux-distro.iso' }
			];
			
			mailer.sendDownloadedNotification(files).then(() => {
				console.log('Email sent');
				process.exit(0);
			},
			consoleUtils.showErrorAndExit);
		});
	});
