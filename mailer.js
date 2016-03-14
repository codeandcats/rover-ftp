var fs = require('fs');
var ejs = require('ejs');
var nodemailer = require('nodemailer');
var config = require('./config');

require.extensions['.txt'] = readModuleFileSync;
require.extensions['.html'] = readModuleFileSync;

var templates = {
	downloaded: {
		html: require('./templates/downloaded.html'),
		text: require('./templates/downloaded.txt')
	}
};

exports.sendDownloadedNotification = function(files) {
	return new Promise((resolve, reject) => {
		config.mail.get()
			.then(mailSettings => {
				var connectionString = buildConnectionString(mailSettings);
				
				// Create reusable transporter object using the default SMTP transport
				// `smtps://${mailSettings.userName}%40gmail.com:${password}@smtp.gmail.com`
				var transporter = nodemailer.createTransport(connectionString);
				
				// Setup e-mail data with unicode symbols
				var mailOptions = {
					from: mailSettings.from,
					to: mailSettings.to,
					subject: mailSettings.subject || 'New Files Downloaded',
					text: ejs.render(templates.downloaded.text, { files: files }),
					html: ejs.render(templates.downloaded.html, { files: files })
				};
				
				// Send mail with defined transport object
				transporter.sendMail(mailOptions, function(err, info) {
					if (err) {
						reject(err);
					}
					else {
						resolve();
					}
				});
			})
			.catch(reject);
	});
};
	
function buildConnectionString(mailSettings) {
	return `smtps://${mailSettings.userName}%40gmail.com:${mailSettings.password}@smtp.gmail.com`;
}

function readModuleFileSync(module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};
