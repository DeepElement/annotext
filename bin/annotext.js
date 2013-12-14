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
annotext.prototype.getRevisionsByUser = function(annotextDoc, userKey) {
	var doc = annotext.prototype.parse(annotextDoc);
	var results = [];
	doc.header.annotations.forEach(function(a) {
		if (a['user'] == userKey)
			results.push(a);
	});
	results.sort(function(a, b) {
		return moment(a['created']).diff(moment(b['created']));
	});
	return results;
}

annotext.prototype.getDistinctRevisions = function(annotextDoc, expanded) {
	var doc = annotext.prototype.parse(annotextDoc, expanded);
	doc.header.annotations.sort(function(a, b) {
		return moment(a['created']).diff(moment(b['created']));
	});
	return doc.header.annotations;
}

annotext.prototype.getDistinctUserKeys = function(annotextDoc) {
	var doc = annotext.prototype.parse(annotextDoc);
	var results = [];
	doc.header.annotations.forEach(function(a) {
		if (results.indexOf(a['user']) == -1)
			results.push(a['user']);
	});
	results.sort(function(a, b) {
		return moment(a['created']).diff(moment(b['created']));
	});
	return results;
}

annotext.prototype.getDistinctRevisionKeys = function(annotextDoc) {
	var doc = annotext.prototype.parse(annotextDoc);
	var results = [];
	doc.header.annotations.forEach(function(a) {
		if (results.indexOf(a['revision']) == -1)
			results.push(a['revision']);
	});
	results.sort(function(a, b) {
		return moment(a['created']).diff(moment(b['created']));
	});
	return results;
}

annotext.prototype.getDistinctRevisionDates = function(annotextDoc) {
	var doc = annotext.prototype.parse(annotextDoc);
	var results = [];
	doc.header.annotations.forEach(function(a) {
		if (results.indexOf(a['created']) == -1)
			results.push(a['created']);
	});
	results.sort(function(a, b) {
		return moment(a['created']).diff(moment(b['created']));
	});
	return results;
}

annotext.prototype.parse = function(annotextDoc, expandHeader) {
	var header = "";

	var start_seperator_idx = annotextDoc.indexOf(YAML_SEPERATOR);
	var end_seperator_idx = annotextDoc.indexOf(YAML_SEPERATOR, start_seperator_idx + 1);

	var header = annotextDoc.substr(YAML_SEPERATOR.length,
		end_seperator_idx - YAML_SEPERATOR.length);
	var content = annotextDoc.substr(header.length + 2 * YAML_SEPERATOR.length,
		annotextDoc.length);

	var yaml_header;
	try {
		yaml_header = YAML.parse(header);
		if (expandHeader) {
			yaml_header = expand_yaml_header(yaml_header);
		}
	} catch (ex) {
		console.log(ex);
	}

	return {
		content: content,
		header: yaml_header
	};
}

// CREATE
annotext.prototype.create = function(content, userKey, revisionKey) {
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
		range_end: tokens[tokens.length - 1].index,
		created: moment().toISOString(),
		user: userKey,
		revision: revisionKey
	};
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
annotext.prototype.update = function(newContent, annotextDoc, userKey, revisionKey) {
	var header = "";
	var doc = annotext.prototype.parse(annotextDoc, true);

	var lexer = new Lexer(this.options);
	var tokens = lexer.lex(doc.content);

	var dmp = new diff_match_patch();
	var diffs = dmp.diff_main(doc.content, newContent);

	var current_idx = 0;
	var token_attributions = [];
	for (var i = 0; i <= diffs.length - 1; i++) {
		var diff = diffs[i];

		var lexer = new Lexer(this.options);
		var diff_tokens = lexer.lex(diff[1]);

		switch (diff[0]) {
			case -1: // Removing
				current_idx += diff_tokens.length;
				break;
			case 0: // Stays the Same
				// TODO: conslidate based on REGEX for sequence
				diff_tokens.forEach(function(token) {
					var header_record = doc.header.annotations[current_idx];
					token_attributions.push({
						token: token,
						header: header_record
					})
					current_idx++;
				});
				break;
			case 1: // Adding

				diff_tokens.forEach(function(token) {
					var token_native = {
						index: tokens[0].index,
						created: moment().toISOString(),
						user: userKey,
						revision: revisionKey
					};

					token_attributions.push({
						token: token,
						header: token_native
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
	result += newContent;

	return result;
};

annotext.prototype.updateByDiffMatchPatches = function(diffMatchPatches, annotextDoc, userKey, revisionKey) {
	var doc = annotext.prototype.parse(annotextDoc, true);
	var dmp = new diff_match_patch();

	var patchedContentContext = dmp.patch_apply(diffMatchPatches, doc.content);
	return annotext.prototype.update(patchedContentContext[0],
		annotextDoc,
		userKey,
		revisionKey);
};

function compress_yaml_header(header) {
	var start = moment();
	var new_header = {
		annotations: [],
		created: moment().toISOString()
	};

	var p = 0;
	while (p <= header.annotations.length - 1) {
		var base_range = p;
		var end_range = base_range;
		for (var i = p; i <= header.annotations.length - 1; i++) {
			if (header.annotations[i]['user'] ==
				header.annotations[base_range]['user'] &&
				header.annotations[i]['created'] ==
				header.annotations[base_range]['created'] &&
				header.annotations[i]['revision'] ==
				header.annotations[base_range]['revision']) {
				end_range = i;
			} else {
				break;
			}
		}

		var token_native = {};
		for (var key in header.annotations[base_range]) {
			if (key != 'index')
				token_native[key] = header.annotations[base_range][key];
		}
		if (base_range == end_range) {
			// single record
			token_native.index = base_range;
		} else {
			// range record
			token_native.range_start = base_range;
			token_native.range_end = end_range;
		}
		new_header.annotations.push(token_native);

		p = end_range + 1;
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