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

module.exports.applyDefinedPropertyValues = function(from, to) {
	for (var name in from) {
		var value = from[name];
		
		if (value === undefined) {
			continue;
		}
		
		if (typeof value == 'object') {
			if (value instanceof Date) {
				to[name] = new Date();
				to[name].setTime(value.getTime());
				continue;
			}
			
			if (typeof to[name] != 'object') {
				to[name] = {};
			}
			
			module.exports.applyDefinedPropertyValues(value, to[name]);
		}
		else if (value != undefined) {
			to[name] = value;
		}
	}
};
