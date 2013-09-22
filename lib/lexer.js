var block = {
  word_break : /^[^\w]/,
  text : /^[\w]+/
};

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
  this.options.loggingEnabled = false;
  this.rules = block.normal;
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
  var cap
  this.log(src);
  while (src) {
    // break token
    if (cap = this.rules.word_break.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 0) {
        this.log({
          type : 'break',
          match : cap[0]
        });
        this.tokens.push({
          type: 'break',
          text: cap[0]
        });
      }
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.log({
        type : 'text',
        match : cap[0]
      });
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new
      Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

Lexer.prototype.log = function(msg) {
  if(this.options.loggingEnabled)
  {
    //console.log(msg);
  }
};




// Helpers
function merge(obj) {
  var i = 1
  , target
  , key;

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
