var block = {
  word_break: "[^\\w]",
  text: "[\\w]+"
};

var v4_regex_str = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/**
 * Normal Block Grammar
 */

 block.normal = merge({}, block);

/**
 * Block Lexer
 */
 function Lexer(options) {
  options = options || {};
  this.tokens = [];
  this.tokens.links = {};
  this.options = options;

  if (!this.options.user_placeholder || this.options.user_placeholder.length == 0) {
    throw new
    Error('A user placeholder V4 UUID is required');
  }

  if (!this.options.revision_placeholder || this.options.revision_placeholder.length == 0) {
    throw new
    Error('A revision placeholder V4 UUID is required');
  }

  this.options.loggingEnabled = false;
  this.rules = block.normal;

  // build dynamic attribution rule
  this.rules.attribution = "([\\w]+)\\{" + this.options.user_placeholder + "\\:\\{([^\\}]+)\\}" + this.options.revision_placeholder + "\\:\\{([^\\}]+)\\}\\}";
}

/**
 * Expose Block Rules
 */
 Lexer.rules = block;

/**
 * Static Lex Method
 */
 Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */
 Lexer.prototype.lex = function(src) {
  return this.token(src, true);
};

/**
 * Lexing
 */
 Lexer.prototype.token = function(src, top) {
  var tokens_match_str = "(" + this.rules.word_break + ")|(" + this.rules.text + ")|(" +
    this.rules.attribution + ")";
var regex = new RegExp(tokens_match_str, "ig");
var result, tokens = [];
while ((result = regex.exec(src)) !== null) {
  if (result[1]) {
    this.log({
      type: 'break',
      match: result[0]
    });
    this.tokens.push({
      type: 'break',
      raw: result[0]
    });
    continue;
  }
  if (result[2]) {
    this.log({
      type: 'text',
      match: result[0]
    });
    this.tokens.push({
      type: 'text',
      raw: result[0]
    });
    continue;
  }
  if (result[3]) {
    this.log({
      type: 'attribution',
      match: result[0]
    });
    this.tokens.push({
      type: 'attribution',
      raw: result[0]
    });
    continue;
  }
}
return this.tokens;
};

Lexer.prototype.log = function(msg) {
  if (this.options.loggingEnabled) {
    console.log(msg);
  }
};



// Helpers

function merge(obj) {
  var i = 1,
  target, key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}

// export the class
if (typeof exports === 'object') {
  module.exports = Lexer;
} else if (typeof define === 'function' && define.amd) {
  define(function() {
    return Lexer;
  });
} else {
  this.Lexer = Lexer;
}