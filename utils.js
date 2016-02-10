module.exports.removeUndefinedProperties = function(obj) {
	for (var name in obj) {
		var value = obj[name];
		
		if (typeof value == 'object') {
			module.exports.removeUndefinedProperties(value);
		}
		else if (value === undefined) {
			delete obj[name];
		}
	}
}
