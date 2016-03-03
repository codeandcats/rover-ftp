var consoleUtils = require('../utils/console');
var cli = require('commander');
var nodemailer = require('nodemailer');
var config = require('../config');

cli
	.command('set-mail')
	.description('Configures email notifications')
	.option('-u, --username <username>', 'Username to authenticate with')
	.option('-p, --password <password>', 'Password to authenticate with')
	.option('-f, --from <from>', 'From Name and Address')
	.option('-t, --to <to>', 'Comma Separated List of Receipients')
	.option('-s, --subject <subject>')
	.action(options => {
		config.mail.get().then(settings => {
			settings = settings || {};
			
			function addSetting(name, value) {
				if (value !== undefined) {
					settings[name] = value;	
				}
			}
			
			addSetting('userName', options.username);
			addSetting('password', options.password);
			addSetting('from', options.from);
			addSetting('to', options.to);
			addSetting('subject', options.subject);
			
			config.mail.set(settings).then(() => {
				console.log('');
				console.log('Mail settings updated');
				process.exit(0);
			},
			consoleUtils.showErrorAndExit);
		});
	});

