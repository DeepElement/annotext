var YAML = require('yamljs'),
    fs = require('fs'),
    moment = require('moment'),
    diff_match_patch = require('googlediff'),
    _ = require('underscore'),
    yamlFront = require('yaml-front-matter'),
    runtimeHelpers = require('./runtime-helpers'),
    util = require('util');

// Constructor
var annotext = function(doc) {
    if (doc) {
        var _data = yamlFront.loadFront(doc);
        this.header = _data;
        this.content = this.header.__content;
        this.header.__content = null;

        if(this.content.indexOf('\n') == 0)
            this.content = this.content.substr(1);
    } else {
        this.header = {
            created: new moment().toISOString(),
            annotations: []
        };
    }
};

annotext.prototype.getDistinctRevisions = function() {
    var results = [];
    this._expandHeader();
    this.header.annotations.forEach(function(a) {
        if (results.indexOf(a['revision']) == -1)
            results.push(a['revision']);
    });
    results.sort(function(a, b) {
        return new moment(a['created']).diff(new moment(b['created']));
    });
    this._compressHeader();
    return results;
};


annotext.prototype.getDistinctUserKeys = function() {
    var results = [];
    this._expandHeader();
    this.header.annotations.forEach(function(a) {
        if (results.indexOf(a['user']) == -1)
            results.push(a['user']);
    });
    results.sort(function(a, b) {
        return new moment(a['created']).diff(new moment(b['created']));
    });
    this._compressHeader();
    return results;
};

annotext.prototype.getDistinctRevisionKeys = function() {
    var results = [];
    this._expandHeader();
    this.header.annotations.forEach(function(a) {
        if (results.indexOf(a['revision']) == -1)
            results.push(a['revision']);
    });
    results.sort(function(a, b) {
        return new moment(a['created']).diff(new moment(b['created']));
    });
    this._compressHeader();
    return results;
};

annotext.prototype.getDistinctRevisionDates = function() {
    var results = [];
    this._expandHeader();
    this.header.annotations.forEach(function(a) {
        if (results.indexOf(a['created']) == -1)
            results.push(a['created']);
    });
    results.sort(function(a, b) {
        return new moment(a['created']).diff(new moment(b['created']));
    });
    this._compressHeader();
    return results;
};

annotext.prototype.getRevisionsByUser = function(user_key) {
    var results = [];
    this._expandHeader();
    this.header.annotations.forEach(function(a) {
        if (a['user'] == user_key)
            if (results.indexOf(a['revision']) == -1)
                results.push(a['revision']);
    });
    this._compressHeader();
    return results;
};

annotext.prototype.createPatch = function(newContent) {
    var dmp = new diff_match_patch();
    return dmp.patch_make(this.content, newContent);
};

annotext.prototype.serialize = function() {
    return '---\n' + JSON.stringify(this.header) + '---\n' + this.content;
};

annotext.prototype._expandHeader = function() {
    var new_header = _.extend({}, this.header);
    new_header.annotations = [];

    this.header.annotations.forEach(function(annotation) {
        if (annotation.range_start != null) {
            for (var i = annotation.range_start; i <= annotation.range_end; i++) {
                new_annotation = clone(annotation);
                new_annotation.index = i;
                new_header.annotations.push(new_annotation);
            }
        } else {
            new_header.annotations.push(annotation);
        }
    });
    this.header = new_header;
};

annotext.prototype._compressHeader = function() {
    var new_header = _.extend({}, this.header);
    new_header.annotations = [];

    var p = 0;
    while (p <= this.header.annotations.length - 1) {
        var base_range = p;
        var end_range = base_range;
        for (var i = p; i <= this.header.annotations.length - 1; i++) {
            var allEqual = this.header.annotations[i].length == this.header.annotations[base_range].length;

            for (var attrKey in this.header.annotations[i]) {
                if (attrKey != 'index') {
                    if (this.header.annotations[i][attrKey] !=
                        this.header.annotations[base_range][attrKey]) {
                        allEqual = false;
                    }
                }
            }

            if (allEqual)
                end_range = i;
            else
                break;
        }

        var token_native = {};
        for (var key in this.header.annotations[base_range]) {
            if (key != 'index')
                token_native[key] = this.header.annotations[base_range][key];
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
    this.header = new_header;
};

annotext.prototype.parse = function() {
    this._expandHeader();
    this._compressHeader();

    return {
        content: this.content,
        header: this.header
    };
};


annotext.prototype.update = function(options) {
    // required
    var content = options.content || "";
    var user_key = options.user_key;
    var revision_key = options.revision_key;
    var patches = options.patches || [];

    // optional
    var custom_header = options.custom_header || {};
    var custom_inline = options.custom_inline || {};
    var edit_date = options.edit_date || new Date();

    // validation
    util.assertDef(user_key, "User Key must be defined");
    util.assertDef(revision_key, "Revision Key must be defined");
    if (!content && !patches) {
        throw new Error("Either Content or Patches must be provided for an update");
    }

    if (patches.length > 0) {
        var dmp = new diff_match_patch();
        content = dmp.patch_apply(patches, this.content)[0];
    }

    // Expand header for processing
    this._expandHeader();

    var header = "";
    var createdISO = edit_date.toISOString();
    var dmp = new diff_match_patch();
    var diffs = dmp.diff_main(this.content || "", content);



    var current_idx = 0;
    var token_attributions = [];
    for (var i = 0; i <= diffs.length - 1; i++) {
        var diff = diffs[i];
        var contentLength = diff[1].length;

        switch (diff[0]) {
            case -1: // Removing
                current_idx += contentLength;
                break;
            case 0: // Stays the Same
                for (var m = 0; m <= contentLength - 1; m++) {
                    var header_record = this.header.annotations[current_idx];
                    token_attributions.push({
                        header: header_record
                    })
                    current_idx++;
                }
                break;
            case 1: // Adding
                for (var m = 0; m <= contentLength - 1; m++) {
                    var token_native = {
                        created: createdISO,
                        user: user_key,
                        revision: revision_key
                    };

                    if (custom_inline)
                        _.extend(token_native, custom_inline);

                    token_attributions.push({
                        header: token_native
                    })
                };
                break;
        }
    }
    var native_refactored_header = _.extend({}, this.header);
    native_refactored_header.annotations = [];
    native_refactored_header.created = createdISO;

    for (var i = 0; i <= token_attributions.length - 1; i++) {
        var ta = token_attributions[i];
        ta.header.index = i;
        native_refactored_header.annotations.push(ta.header);
    }

    this.header = native_refactored_header;
    this.content = content;

    // merge in the custom header data
    if (custom_header)
        _.extend(this.header, custom_header);

    this._compressHeader();
};

annotext.prototype.exportToHtml = function(options, callback) {
    var marked = require('./custom-marked');
    new marked(this.content,
        this,
        null,
        callback);
};


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



/*********** STABLE ******************/


annotext.prototype.updateByDiffMatchPatches = function(diffMatchPatches, annotextDoc, userKey, revisionKey, customData, editDateTime) {
    var doc = annotext.prototype.parse(annotextDoc, true);
    var dmp = new diff_match_patch();

    var patchedContentContext = dmp.patch_apply(diffMatchPatches, doc.content);
    return annotext.prototype.update(patchedContentContext[0], annotextDoc, userKey, revisionKey, customData, editDateTime);
};






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

function clone(x) {
    if (x === null || x === undefined)
        return x;
    if (x.clone)
        return x.clone();
    if (x.constructor == Array) {
        var r = [];
        for (var i = 0, n = x.length; i < n; i++)
            r.push(clone(x[i]));
        return r;
    }
    return x;
}
