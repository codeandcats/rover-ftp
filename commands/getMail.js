var consoleUtils = require('../utils/console');
var cli = require('commander');
var nodemailer = require('nodemailer');
var config = require('../config');

function showSetting(name, value) {
	if (value !== undefined) {
		console.log('  ' + name + ': ' + value);
	}
}

cli
	.command('mail')
	.action(() => {
		config.mail.get().then(mailSettings => {
			console.log('');
			
			var hasSettings = mailSettings && Object
				.getOwnPropertyNames(mailSettings)
				.map(name => mailSettings[name])
				.filter(value => value)
				.length;
				
			if (!hasSettings) {
				console.log('No mail settings defined');
			}
			else {
				console.log('Mail settings:');
				showSetting('UserName', mailSettings.userName);
				showSetting('Password', mailSettings.password);
				showSetting('From', mailSettings.from);
				showSetting('To', mailSettings.to);
				showSetting('Subject', mailSettings.subject);
			}
			
			process.exit(0);
		},
		consoleUtils.showErrorAndExit);
	});

