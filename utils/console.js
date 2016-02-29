var chalk = require('chalk');

module.exports.showErrorAndExit = function(err) {
	console.error(chalk.red(err));
	process.exit(1);
};

module.exports.write = function(text) {
	process.stdout.write(text + '\r');
}