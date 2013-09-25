var Lexer = require('../lib/lexer.js');

// Constructor

function annotext(options) {
	this.options = options || {};
}

// class methods
annotext.prototype.annotate = function(clear_text, user_key, revision_key) {
	var lexer = new Lexer(this.options);
	var tokens = lexer.lex(clear_text);

	var result = '';
	var attribution_suffix = "{" + this.options.user_placeholder + ":{" + user_key + "}" + this.options.revision_placeholder + ":{" + revision_key + "}}";
	tokens.forEach(function(token) {
		switch (token.type) {
			case 'attribution':
				result += token.raw;
				break;
			case 'break':
				result += token.raw + attribution_suffix;
				break;
			case 'text':
				result += token.raw +
					attribution_suffix;
				break;
		}
	});
	return result;
};

/*
annotateDiff: function(existing_annotated_text,
	updated_clear_text, user_key, revision_key) {

},


deannotate: function(existing_annotated_text) {

		}
		*/


// export the class
if (typeof exports === 'object') {
	module.exports = annotext;
} else if (typeof define === 'function' && define.amd) {
	define(function() {
		return annotext;
	});
} else {
	this.annotext = annotext;
}