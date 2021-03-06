/**
 * Extended from the 'marked' markdown parser, by Christopher Jeffrey.
 * Please don't bug Chris with issues, since he was not involved in this adaptation (unless you want to give him karma)!
 *
 * Citations & Mad Props:
 * - https://github.com/chjj/marked
 */

var annotext = require('./annotext');
/**
 * Block-Level Grammar
 */

var block = {
    newline: /^\n+/,
    code: /^( {4}[^\n]+\n*)+/,
    fences: noop,
    hr: /^( *[-*_]){3,} *(?:\n+|$)/,
    heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
    nptable: noop,
    lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
    blockquote: /^( *>[^\n]+(\n[^\n]+)*\n*)+/,
    list: /^( *)(bull) [\s\S]+?(?:hr|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
    html: /^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/,
    def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
    table: noop,
    paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
    text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
(/bull/g, block.bullet)
();

block.list = replace(block.list)
(/bull/g, block.bullet)
('hr', /\n+(?=(?: *[-*_]){3,} *(?:\n+|$))/)
();

block._tag = '(?!(?:' + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code' + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo' + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|@)\\b';

block.html = replace(block.html)
('comment', /<!--[\s\S]*?-->/)
('closed', /<(tag)[\s\S]+?<\/\1>/)
('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
(/tag/g, block._tag)
();

block.paragraph = replace(block.paragraph)
('hr', block.hr)
('heading', block.heading)
('lheading', block.lheading)
('blockquote', block.blockquote)
('tag', '<' + block._tag)
('def', block.def)
();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
    fences: /^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,
    paragraph: /^/
});

block.gfm.paragraph = replace(block.paragraph)
('(?!', '(?!' + block.gfm.fences.source.replace('\\1', '\\2') + '|' + block.list.source.replace('\\1', '\\3') + '|')
();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
    nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
    table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
});

/**
 * Block Lexer
 */

function Lexer(options, annotextDoc) {
    this.tokens = [];
    this.tokens.links = {};
    this.options = options || marked.defaults;
    this.rules = block.normal;

    this.isAnnotated = annotextDoc != null;
    if (this.isAnnotated) {
        this.annotextDoc = annotextDoc;
        this.annotextDocParsed = annotextDoc.parse();
    }

    if (this.options.gfm) {
        if (this.options.tables) {
            this.rules = block.tables;
        } else {
            this.rules = block.gfm;
        }
    }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, annotextDoc, options) {
    var lexer = new Lexer(options, annotextDoc);
    return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
    src = src
        .replace(/\r\n|\r/g, '\n')
        .replace(/\t/g, '    ')
        .replace(/\u00a0/g, ' ')
        .replace(/\u2424/g, '\n');

    return this.token(src, true);
};

/**
 * Lexing
 */
Lexer.prototype.token = function(src, top) {
    var src = src.replace(/^ +$/gm, ''),
        next, loose, cap, bull, b, item, space, i, l;

    while (src) {
        // newline
        if (cap = this.rules.newline.exec(src)) {
            src = src.substring(cap[0].length);
            if (cap[0].length > 1) {
                var tok = {
                    type: 'space'
                };
                if (this.isAnnotated) {
                    tok.offset = cap.index;
                    tok.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
                }
                this.tokens.push(tok);
            }
        }

        // code
        if (cap = this.rules.code.exec(src)) {
            src = src.substring(cap[0].length);
            cap = cap[0].replace(/^ {4}/gm, '');
            var tok = {
                type: 'code',
                text: !this.options.pedantic ? cap.replace(/\n+$/, '') : cap
            };
            if (this.isAnnotated) {
                tok.offset = cap.index;
                tok.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
            }
            this.tokens.push(tok);
            continue;
        }

        // fences (gfm)
        if (cap = this.rules.fences.exec(src)) {
            src = src.substring(cap[0].length);
            var tok = {
                type: 'code',
                lang: cap[2],
                text: cap[3]
            };
            if (this.isAnnotated) {
                tok.offset = cap.index;
                tok.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
            }
            this.tokens.push(tok);
            continue;
        }

        // heading
        if (cap = this.rules.heading.exec(src)) {
            src = src.substring(cap[0].length);
            var tok = {
                type: 'heading',
                depth: cap[1].length,
                text: cap[2]
            };
            if (this.isAnnotated) {
                tok.offset = cap.index;
                tok.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
            }
            this.tokens.push(tok);
            continue;
        }

        // table no leading pipe (gfm)
        if (top && (cap = this.rules.nptable.exec(src))) {
            src = src.substring(cap[0].length);

            item = {
                type: 'table',
                header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
                align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
                cells: cap[3].replace(/\n$/, '').split('\n')
            };

            if (this.isAnnotated) {
                item.offset = cap.index;
                item.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
            }

            for (i = 0; i < item.align.length; i++) {
                if (/^ *-+: *$/.test(item.align[i])) {
                    item.align[i] = 'right';
                } else if (/^ *:-+: *$/.test(item.align[i])) {
                    item.align[i] = 'center';
                } else if (/^ *:-+ *$/.test(item.align[i])) {
                    item.align[i] = 'left';
                } else {
                    item.align[i] = null;
                }
            }

            for (i = 0; i < item.cells.length; i++) {
                item.cells[i] = item.cells[i].split(/ *\| */);
            }

            this.tokens.push(item);

            continue;
        }

        // lheading
        if (cap = this.rules.lheading.exec(src)) {
            src = src.substring(cap[0].length);
            var tok = {
                type: 'heading',
                depth: cap[2] === '=' ? 1 : 2,
                text: cap[1]
            };
            if (this.isAnnotated) {
                tok.offset = cap.index;
                tok.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
            }
            this.tokens.push(tok);
            continue;
        }

        // hr
        if (cap = this.rules.hr.exec(src)) {
            src = src.substring(cap[0].length);
            var tok = {
                type: 'hr'
            };
            if (this.isAnnotated) {
                tok.offset = cap.index;
                tok.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
            }
            this.tokens.push(tok);
            continue;
        }

        // blockquote
        if (cap = this.rules.blockquote.exec(src)) {
            src = src.substring(cap[0].length);

            var tok = {
                type: 'blockquote_start'
            };
            if (this.isAnnotated) {
                tok.offset = cap.index;
                tok.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
            }
            this.tokens.push(tok);

            cap = cap[0].replace(/^ *> ?/gm, '');

            // Pass `top` to keep the current
            // "toplevel" state. This is exactly
            // how markdown.pl works.
            this.token(cap, top);

            var tok = {
                type: 'blockquote_end'
            };
            if (this.isAnnotated) {
                tok.offset = cap.index;
                tok.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
            }
            this.tokens.push(tok);

            continue;
        }

        // list
        if (cap = this.rules.list.exec(src)) {
            src = src.substring(cap[0].length);
            bull = cap[2];

            var tok = {
                type: 'list_start',
                ordered: bull.length > 1
            };
            if (this.isAnnotated) {
                tok.offset = cap.index;
                tok.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
            }
            this.tokens.push(tok);

            // Get each top-level item.
            cap = cap[0].match(this.rules.item);

            next = false;
            l = cap.length;
            i = 0;

            for (; i < l; i++) {
                item = cap[i];

                // Remove the list item's bullet
                // so it is seen as the next token.
                space = item.length;
                item = item.replace(/^ *([*+-]|\d+\.) +/, '');

                // Outdent whatever the
                // list item contains. Hacky.
                if (~item.indexOf('\n ')) {
                    space -= item.length;
                    item = !this.options.pedantic ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '') : item.replace(/^ {1,4}/gm, '');
                }

                // Determine whether the next list item belongs here.
                // Backpedal if it does not belong in this list.
                if (this.options.smartLists && i !== l - 1) {
                    b = block.bullet.exec(cap[i + 1])[0];
                    if (bull !== b && !(bull.length > 1 && b.length > 1)) {
                        src = cap.slice(i + 1).join('\n') + src;
                        i = l - 1;
                    }
                }

                // Determine whether item is loose or not.
                // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
                // for discount behavior.
                loose = next || /\n\n(?!\s*$)/.test(item);
                if (i !== l - 1) {
                    next = item.charAt(item.length - 1) === '\n';
                    if (!loose) loose = next;
                }

                var tok = {
                    type: loose ? 'loose_item_start' : 'list_item_start'
                };
                if (this.isAnnotated) {
                    tok.offset = cap.index;
                    tok.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
                }
                this.tokens.push(tok);

                // Recurse.
                this.token(item, false);

                var tok = {
                    type: 'list_item_end'
                };
                if (this.isAnnotated) {
                    tok.offset = cap.index;
                    tok.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
                }
                this.tokens.push(tok);
            }

            var tok = {
                type: 'list_end'
            };
            if (this.isAnnotated) {
                tok.offset = cap.index;
                tok.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
            }
            this.tokens.push(tok);

            continue;
        }

        // html
        if (cap = this.rules.html.exec(src)) {
            src = src.substring(cap[0].length);
            var tok = {
                type: this.options.sanitize ? 'paragraph' : 'html',
                pre: cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style',
                text: cap[0],
            };
            if (this.isAnnotated) {
                tok.offset = cap.index;
                tok.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
            }
            this.tokens.push(tok);
            continue;
        }

        // def
        if (top && (cap = this.rules.def.exec(src))) {
            src = src.substring(cap[0].length);
            var tok = {
                href: cap[2],
                title: cap[3]
            };
            if (this.isAnnotated) {
                tok.offset = cap.index;
                tok.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
            }
            this.tokens.links[cap[1].toLowerCase()] = tok;
            continue;
        }

        // table (gfm)
        if (top && (cap = this.rules.table.exec(src))) {
            src = src.substring(cap[0].length);

            item = {
                type: 'table',
                header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
                align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
                cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
            };
            if (this.isAnnotated) {
                item.offset = cap.index;
                item.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
            }

            for (i = 0; i < item.align.length; i++) {
                if (/^ *-+: *$/.test(item.align[i])) {
                    item.align[i] = 'right';
                } else if (/^ *:-+: *$/.test(item.align[i])) {
                    item.align[i] = 'center';
                } else if (/^ *:-+ *$/.test(item.align[i])) {
                    item.align[i] = 'left';
                } else {
                    item.align[i] = null;
                }
            }

            for (i = 0; i < item.cells.length; i++) {
                item.cells[i] = item.cells[i]
                    .replace(/^ *\| *| *\| *$/g, '')
                    .split(/ *\| */);
            }

            this.tokens.push(item);

            continue;
        }

        // top-level paragraph
        if (top && (cap = this.rules.paragraph.exec(src))) {
            src = src.substring(cap[0].length);
            var tok = {
                type: 'paragraph',
                text: cap[1].charAt(cap[1].length - 1) === '\n' ? cap[1].slice(0, -1) : cap[1]
            };
            if (this.isAnnotated) {
                tok.offset = cap.index;
                tok.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
            }
            this.tokens.push(tok);
            continue;
        }

        // text
        if (cap = this.rules.text.exec(src)) {
            // Top-level should never reach here.
            src = src.substring(cap[0].length);
            var tok = {
                type: 'text',
                text: cap[0]
            };
            if (this.isAnnotated) {
                tok.offset = cap.index;
                tok.revisions = this.annotextDocParsed.header.annotations.slice(cap.index, cap[0].length);
            }
            this.tokens.push(tok);
            continue;
        }

        if (src) {
            throw new
            Error('Infinite loop on byte: ' + src.charCodeAt(0));
        }
    }

    if (this.isAnnotated) {
        var _self = this;
        this.tokens.forEach(function(token) {
            if (token.revisions != undefined && token.revisions != null) {
                token.revisions.forEach(function(rev) {
                    rev.index += token.offset;
                    rev.content = _self.annotextDocParsed.content[rev.index];
                });
            }
        });
    }

    return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
    escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
    autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
    url: noop,
    tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
    link: /^!?\[(inside)\]\(href\)/,
    reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
    nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
    strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
    em: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
    code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
    br: /^ {2,}\n(?!\s*$)/,
    del: noop,
    text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
};

inline._inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
('inside', inline._inside)
('href', inline._href)
();

inline.reflink = replace(inline.reflink)
('inside', inline._inside)
();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
    strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
    em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
    escape: replace(inline.escape)('])', '~|])')(),
    url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
    del: /^~~(?=\S)([\s\S]*?\S)~~/,
    text: replace(inline.text)
    (']|', '~]|')
    ('|', '|https?://|')
    ()
});

/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
    br: replace(inline.br)('{2,}', '*')(),
    text: replace(inline.gfm.text)('{2,}', '*')()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, annotextDoc, options) {
    this.options = options || marked.defaults;
    this.links = links;
    this.rules = inline.normal;

    this.isAnnotated = annotextDoc != null;
    if (this.isAnnotated) {
        this.annotextDoc = annotextDoc;
        this.annotextDocParsed = new annotext().parse(annotextDoc, true);
    }

    if (!this.links) {
        throw new
        Error('Tokens array requires a `links` property.');
    }

    if (this.options.gfm) {
        if (this.options.breaks) {
            this.rules = inline.breaks;
        } else {
            this.rules = inline.gfm;
        }
    } else if (this.options.pedantic) {
        this.rules = inline.pedantic;
    }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
    var inline = new InlineLexer(links, this.annotextDoc, options);
    return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src, revisions) {
    var out = '',
        link, text, href, cap;

    var att = function(cap) {
        if (this.annotextDoc != null && cap.length > 0) {
            return " " + createAttributionFromRevisions(revisions, 'inline');
        } else
            return "";
    }

    while (src) {
        // escape
        if (cap = this.rules.escape.exec(src)) {
            src = src.substring(cap[0].length);
            out += cap[1];
            continue;
        }

        // autolink
        if (cap = this.rules.autolink.exec(src)) {
            src = src.substring(cap[0].length);
            if (cap[2] === '@') {
                text = cap[1].charAt(6) === ':' ? this.mangle(cap[1].substring(7)) : this.mangle(cap[1]);
                href = this.mangle('mailto:') + text;
            } else {
                text = escape(cap[1]);
                href = text;
            }
            var result = '<a href="' + href + '">' + text + '</a>';
            if (this.options.escapeUrls) {
                result = escape(result);
            }
            out += result;
            continue;
        }

        // url (gfm)
        if (cap = this.rules.url.exec(src)) {
            src = src.substring(cap[0].length);
            text = escape(cap[1]);
            href = text;
            var result = '<a href="' + href + '">' + text + '</a>';

            if (this.options.escapeUrls) {
                result = escape(result);
            }
            out += result;
            continue;
        }

        // tag
        if (cap = this.rules.tag.exec(src)) {
            src = src.substring(cap[0].length);
            out += this.options.sanitize ? escape(cap[0]) : cap[0];
            continue;
        }

        // link
        if (cap = this.rules.link.exec(src)) {
            src = src.substring(cap[0].length);
            out += this.outputLink(cap, {
                href: cap[2],
                title: cap[3]
            });
            continue;
        }

        // reflink, nolink
        if ((cap = this.rules.reflink.exec(src)) || (cap = this.rules.nolink.exec(src))) {
            src = src.substring(cap[0].length);
            link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
            link = this.links[link.toLowerCase()];
            if (!link || !link.href) {
                out += cap[0].charAt(0);
                src = cap[0].substring(1) + src;
                continue;
            }
            out += this.outputLink(cap, link);
            continue;
        }

        // strong
        if (cap = this.rules.strong.exec(src)) {
            src = src.substring(cap[0].length);
            out += '<strong>' + this.output(cap[2] || cap[1]) + '</strong>';
            continue;
        }

        // em
        if (cap = this.rules.em.exec(src)) {
            src = src.substring(cap[0].length);
            out += '<em>' + this.output(cap[2] || cap[1]) + '</em>';
            continue;
        }

        // code
        if (cap = this.rules.code.exec(src)) {
            src = src.substring(cap[0].length);
            out += '<code>' + escape(cap[2], true) + '</code>';
            continue;
        }

        // br
        if (cap = this.rules.br.exec(src)) {
            src = src.substring(cap[0].length);
            out += '<br>';
            continue;
        }

        // del (gfm)
        if (cap = this.rules.del.exec(src)) {
            src = src.substring(cap[0].length);
            out += '<del>' + this.output(cap[1]) + '</del>';
            continue;
        }

        // text
        if (cap = this.rules.text.exec(src)) {
            src = src.substring(cap[0].length);
            out += escape(this.smartypants(cap[0]));
            continue;
        }

        if (src) {
            throw new
            Error('Infinite loop on byte: ' + src.charCodeAt(0));
        }
    }

    return out;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
    var result = "";
    if (cap[0].charAt(0) !== '!') {
        result = '<a href="' + escape(link.href) + '"' + (link.title ? ' title="' + escape(link.title) + '"' : '') + '>' + this.output(cap[1]) + '</a>';
    } else {
        result = '<img src="' + escape(link.href) + '" alt="' + escape(cap[1]) + '"' + (link.title ? ' title="' + escape(link.title) + '"' : '') + '>';
    }
    if (this.options.escapeUrls) {
        result = escape(result);
    }
    return result;
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
    if (!this.options.smartypants) return text;
    return text
        // em-dashes
        .replace(/--/g, '\u2014')
        // opening singles
        .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
        // closing singles & apostrophes
        .replace(/'/g, '\u2019')
        // opening doubles
        .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
        // closing doubles
        .replace(/"/g, '\u201d')
        // ellipses
        .replace(/\.{3}/g, '\u2026');
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
    var out = '',
        l = text.length,
        i = 0,
        ch;

    for (; i < l; i++) {
        ch = text.charCodeAt(i);
        if (Math.random() > 0.5) {
            ch = 'x' + ch.toString(16);
        }
        out += '&#' + ch + ';';
    }

    return out;
};

/**
 * Parsing & Compiling
 */

function Parser(options, annotextDoc) {
    this.tokens = [];
    this.token = null;
    this.options = options || marked.defaults;

    this.isAnnotated = annotextDoc != null;
    if (this.isAnnotated) {
        this.annotextDoc = annotextDoc;
        this.annotextDocParsed = new annotext().parse(annotextDoc, true);
    }
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, annotextDoc, options) {
    var parser = new Parser(options, annotextDoc);
    return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
    this.inline = new InlineLexer(src.links, this.annotextDoc, this.options);
    this.tokens = src.reverse();

    var out = '';
    while (this.next()) {
        out += this.tok();
    }

    return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
    return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
    return this.tokens[this.tokens.length - 1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
    var body = this.token.text;

    while (this.peek().type === 'text') {
        body += '\n' + this.next().text;
    }

    return this.inline.output(body);
};

var arrayToCommaDelimited = function(list) {
    var result = "";
    for (var i = 0; i <= list.length - 1; i++) {
        result += list[i];
        if (i != list.length - 1)
            result += ",";
    }
    return result;
}


var createAttributionFromRevisions = function(revisions, type) {
    var attributeGroups = {};
    revisions.forEach(function(revision) {
        for (var attrKey in revision) {
            if (attributeGroups[attrKey] == null)
                attributeGroups[attrKey] = [];

            if (attributeGroups[attrKey].indexOf(revision[attrKey]) == -1)
                attributeGroups[attrKey].push(revision[attrKey]);
        }
    });

    var attributions = [];
    var excludeKeys = ['content', 'range_start', 'range_end', 'index'];

    for (var attrKey in attributeGroups) {
        if (excludeKeys.indexOf(attrKey) == -1) {
            var attrTemp = 'data-annotext-' + attrKey +
                '=\"' + arrayToCommaDelimited(attributeGroups[attrKey]) + "\"";
            attributions.push(attrTemp);
        }
    }
    attributions.sort();
    attributions.reverse();
    attributions.push('data-annotext-type=\"' + type + '\"');

    var attribution = "";
    for (var i = 0; i <= attributions.length - 1; i++) {
        attribution += attributions[i];
        if (i < attributions.length - 1)
            attribution += " ";
    }
    return attribution;
}

/**
 * Parse Current Token
 */
Parser.prototype.tok = function() {
    var hasAttribution = this.token.revisions != undefined && this.token.revisions.length > 0;
    var attribution = "";
    if (hasAttribution) {
        attribution = createAttributionFromRevisions(this.token.revisions, 'block');
    }
    var att = function() {
        if (hasAttribution) {
            return " " + attribution;
        }
        return "";
    };


    switch (this.token.type) {
        case 'space':
            {
                return '';
            }
        case 'hr':
            {
                return '<hr' + att() + '>\n';
            }
        case 'heading':
            {
                return '<h' + this.token.depth + att() + ' class="' + this.token.text.toLowerCase().replace(/[^\w]+/g, '-') + '">' + this.inline.output(this.token.text) + '</h' + this.token.depth + '>\n';
            }
        case 'code':
            {
                if (this.options.highlight) {
                    var code = this.options.highlight(this.token.text, this.token.lang);
                    if (code != null && code !== this.token.text) {
                        this.token.escaped = true;
                        this.token.text = code;
                    }
                }

                if (!this.token.escaped) {
                    this.token.text = escape(this.token.text, true);
                }

                return '<pre' + att() + '><code' + att() + (this.token.lang ? ' class="' + this.options.langPrefix + this.token.lang + '"' : '') + '>' + this.token.text + '</code></pre>\n';
            }
        case 'table':
            {
                var body = '',
                    heading, i, row, cell, j;

                // header
                body += '<thead' + att() + '>\n<tr' + att() + '>\n';
                for (i = 0; i < this.token.header.length; i++) {
                    heading = this.inline.output(this.token.header[i]);
                    body += '<th' + att();
                    if (this.token.align[i]) {
                        body += ' style="text-align:' + this.token.align[i] + '"';
                    }
                    body += '>' + heading + '</th>\n';
                }
                body += '</tr>\n</thead>\n';

                // body
                body += '<tbody' + att() + '>\n'
                for (i = 0; i < this.token.cells.length; i++) {
                    row = this.token.cells[i];
                    body += '<tr' + att() + '>\n';
                    for (j = 0; j < row.length; j++) {
                        cell = this.inline.output(row[j]);
                        body += '<td' + att();
                        if (this.token.align[j]) {
                            body += ' style="text-align:' + this.token.align[j] + '"';
                        }
                        body += '>' + cell + '</td>\n';
                    }
                    body += '</tr>\n';
                }
                body += '</tbody>\n';

                return '<table' + att() + '>\n' + body + '</table>\n';
            }
        case 'blockquote_start':
            {
                var body = '';

                while (this.next().type !== 'blockquote_end') {
                    body += this.tok();
                }

                return '<blockquote' + att() + '>\n' + body + '</blockquote>\n';
            }
        case 'list_start':
            {
                var type = this.token.ordered ? 'ol' : 'ul',
                    body = '';

                while (this.next().type !== 'list_end') {
                    body += this.tok();
                }

                return '<' + type + '' + att() + '>\n' + body + '</' + type + '>\n';
            }
        case 'list_item_start':
            {
                var body = '';

                while (this.next().type !== 'list_item_end') {
                    body += this.token.type === 'text' ? this.parseText() : this.tok();
                }

                return '<li' + att() + '>' + body + '</li>\n';
            }
        case 'loose_item_start':
            {
                var body = '';

                while (this.next().type !== 'list_item_end') {
                    body += this.tok();
                }

                return '<li' + att() + '>' + body + '</li>\n';
            }
        case 'html':
            {
                return !this.token.pre && !this.options.pedantic ? this.inline.output(this.token.text) : this.token.text;
            }
        case 'paragraph':
            {
                return '<p' + att() + '>' + this.inline.output(this.token.text) + '</p>\n';
            }
        case 'text':
            {
                return '<p' + att() + '>' + this.parseText() + '</p>\n';
            }
    }
};

/**
 * Helpers
 */

function escape(html, encode) {
    return html
        .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function replace(regex, opt) {
    regex = regex.source;
    opt = opt || '';
    return function self(name, val) {
        if (!name) return new RegExp(regex, opt);
        val = val.source || val;
        val = val.replace(/(^|[^\[])\^/g, '$1');
        regex = regex.replace(name, val);
        return self;
    };
}

function noop() {}
noop.exec = noop;

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

/**
 * Marked
 */

function marked(src, annotextDoc, opt, callback) {
    if (callback || typeof opt === 'function') {
        if (!callback) {
            callback = opt;
            opt = null;
        }

        opt = merge({}, marked.defaults, opt || {});

        var highlight = opt.highlight,
            tokens, pending, i = 0;

        try {
            tokens = Lexer.lex(src, annotextDoc, opt)
        } catch (e) {
            return callback(e);
        }

        pending = tokens.length;

        var done = function() {
            var out, err;

            try {
                out = Parser.parse(tokens, annotextDoc, opt);
            } catch (e) {
                err = e;
            }

            opt.highlight = highlight;

            return err ? callback(err) : callback(null, out);
        };

        if (!highlight || highlight.length < 3) {
            return done();
        }

        delete opt.highlight;

        if (!pending) return done();

        for (; i < tokens.length; i++) {
            (function(token) {
                if (token.type !== 'code') {
                    return --pending || done();
                }
                return highlight(token.text, token.lang, function(err, code) {
                    if (code == null || code === token.text) {
                        return --pending || done();
                    }
                    token.text = code;
                    token.escaped = true;
                    --pending || done();
                });
            })(tokens[i]);
        }

        return;
    }
    try {
        if (opt) opt = merge({}, marked.defaults, opt);
        return Parser.parse(Lexer.lex(src, annotextDoc, opt), annotextDoc, opt);
    } catch (e) {
        e.message += '\nPlease report this to https://github.com/chjj/marked.';
        if ((opt || marked.defaults).silent) {
            return '<p>An error occured:</p><pre>' + escape(e.message + '', true) + '</pre>';
        }
        throw e;
    }
}

/**
 * Options
 */

marked.options =
    marked.setOptions = function(opt) {
        merge(marked.defaults, opt);
        return marked;
};

marked.defaults = {
    gfm: false,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: true,
    smartLists: false,
    silent: false,
    highlight: null,
    langPrefix: 'lang-',
    smartypants: false,
    escapeUrls: true
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

module.exports = marked;
