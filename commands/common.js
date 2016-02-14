module.exports.showErrorAndExit = function(err) {
	console.error("Error: ", err);
	process.exit(1);
};
