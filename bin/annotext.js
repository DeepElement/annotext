var Lexer = require('../lib/lexer'),
YAML = require('yamljs'),
fs = require('fs'),
moment = require('moment'),
diff_match_patch = require('googlediff');

var YAML_SEPERATOR = "---\n";

// Constructor

var annotext = function(options) {
	this.options = options || {};
}

// class methods
// CREATE
annotext.prototype.createTextAnnotateDocument = function(content, key_values) {
	var result = "";

	// tokenize
	var lexer = new Lexer(this.options);
	var tokens = lexer.lex(content);

	// create json header
	var nativeObject = {
		annotations: [],
		created: moment().toISOString()
	};
	var token_native = {
		range_start: tokens[0].index,
		range_end: tokens[tokens.length - 1].index
	};
	for (var key in key_values) {
		token_native[key] = key_values[key];
	}
	nativeObject.annotations.push(token_native);

	// convert json header to YAML
	// No need to compress, it is already one big range
	var yaml_header = YAML.stringify(nativeObject);

	// construct document
	result += YAML_SEPERATOR;
	result += yaml_header;
	result += YAML_SEPERATOR;
	result += content;

	return result;
};

// UPDATE
annotext.prototype.diffAnnotate = function(updated_content, annotated_doc, key_values) {
	var header = "";

	var start_seperator_idx = annotated_doc.indexOf(YAML_SEPERATOR);
	var end_seperator_idx = annotated_doc.indexOf(YAML_SEPERATOR, start_seperator_idx + 1);

	var header = annotated_doc.substr(YAML_SEPERATOR.length,
		end_seperator_idx - YAML_SEPERATOR.length);
	var content = annotated_doc.substr(header.length + 2 * YAML_SEPERATOR.length,
		annotated_doc.length);

	var yaml_header;
	try {
		yaml_header = expand_yaml_header(YAML.parse(header));
	} catch (ex) {
		console.log(ex);
	}

	var lexer = new Lexer(this.options);
	var tokens = lexer.lex(content);

	var dmp = new diff_match_patch();
	var diffs = dmp.diff_main(content, updated_content);
	//dmp.diff_cleanupSemantic(diffs);
	//console.log(diffs);

	var current_idx = 0;
	var token_attributions = [];
	for (var i = 0; i <= diffs.length - 1; i++) {
		var diff = diffs[i];
		var lexer = new Lexer(this.options);
		var diff_tokens = lexer.lex(diff[1]);



		switch (diff[0]) {
			case -1:
				//console.log("TODO: remove");
				case 0:
				//console.log("TODO: existing");
				// TODO: conslidate based on REGEX for sequence
				diff_tokens.forEach(function(token) {
					var header_record = yaml_header.annotations[current_idx];
					token_attributions.push({
						token: token,
						header: header_record
					})
					current_idx++;
				});
				break;
				case 1:
				//console.log("TODO: added");
				diff_tokens.forEach(function(token) {
					var nativeObject = {
						annotations: [],
						created: moment().toISOString()
					};
					var token_native = {};
					for (var key in key_values) {
						token_native[key] = key_values[key];
					}

					token_attributions.push({
						token: token,
						header: nativeObject
					})
				});
				break;
			}
		}

		var native_refactored_header = {
			annotations: [],
			created: moment().toISOString()
		};
		for (var i = 0; i <= token_attributions.length - 1; i++) {
			var ta = token_attributions[i];
			ta.header.index = i;
			native_refactored_header.annotations.push(ta.header);
		}

		var compressed_header = compress_yaml_header(native_refactored_header);
		var refactored_header = YAML.stringify(compressed_header);

	// construct document
	var result = "";
	result += YAML_SEPERATOR;
	result += refactored_header;
	result += YAML_SEPERATOR;
	result += updated_content;

	return result;
};

function compress_yaml_header(header) {
	var start = moment();
	var new_header = {
		annotations: [],
		created: moment().toISOString()
	};

	var p = 0;
	while (p <= header.annotations.length - 1) {
		var last_index = p;
		while (last_index <= header.annotations.length - 1) {
			if (are_keys_equal(header.annotations[p], header.annotations[last_index])) {
				last_index++;
			} else {
				break;
			}
		}
		//console.log('Discovered run:[' + p + "-" + last_index + "]");

		var token_native = {};
		for (var key in header.annotations[p]) {
			if (key != 'index')
				token_native[key] = header.annotations[p][key];
		}
		new_header.annotations.push(token_native);
		if (p != last_index) {
			token_native.range_start = p;
			token_native.range_end = last_index;
		} else {
			token_native.index = p;
		}


		p = last_index + 1;
	}
	return new_header;
}

function are_keys_equal(left, right) {
	for (var key in left.annotations) {
		if (key != 'index') {
			if (left.annotations[key] != right.annotations[key]) {
				return false;
			}
		}
	}
	return true;
}

function expand_yaml_header(header) {
	var new_header = {
		annotations: [],
		created: header.created
	};

	header.annotations.forEach(function(annotation) {
		if (annotation.range_start != null) {
			for (var i = annotation.range_start; i <= annotation.range_end; i++) {
				var new_annotation = {};
				new_annotation.index = i;
				for (var key in annotation) {
					if (key != 'range_start' && key != 'range_end')
						new_annotation[key] = annotation[key];
				}
				new_header.annotations.push(new_annotation);
			}
		} else {
			new_header.annotations.push(annotation);
		}
	});
	return new_header;
}

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