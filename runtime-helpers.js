var util = require('util');
util.assertDef = function(argument, message){
	if(!argument)
		throw new Error(message);
};