'use strict';

var should = require('should'),
uuid = require('uuid'),
async = require('async'),
samplesProvider = require('./samples/samples-provider'),
Lexer = require('../lib/lexer');

describe('AnnoText Lexer Unit tests', function() {
	describe('lex', function() {
		it('Standard space detection', function(done) {
			var content = 's c';
			var lexer = new Lexer({
				user_placeholder : uuid.v4(),
				revision_placeholder : uuid.v4()
			});

			var results = lexer.lex(content);

			var expected_token_sequence = ['text', 'break', 'text'];

			results.length.should.equal(3);
			for (var i = 0; i <= results.length - 1; i++)
				results[i].type.should.equal(expected_token_sequence[i]);
			done();
		});

		it('Leading/Trailing space detection', function(done) {
			var content = ' s c ';
			var lexer = new Lexer({
				user_placeholder : uuid.v4(),
				revision_placeholder : uuid.v4()
			});

			var results = lexer.lex(content);

			var expected_token_sequence = ['break', 'text', 'break', 'text', 'break'];

			results.length.should.equal(5);
			for (var i = 0; i <= results.length - 1; i++)
				results[i].type.should.equal(expected_token_sequence[i]);
			done();
		});

		it('Leading/Trailing tab detection', function(done) {
			var content = '\ts\tc\t';
			var lexer = new Lexer({
				user_placeholder : uuid.v4(),
				revision_placeholder : uuid.v4()
			});

			var results = lexer.lex(content);

			var expected_token_sequence = ['break', 'text', 'break', 'text', 'break'];

			results.length.should.equal(5);
			for (var i = 0; i <= results.length - 1; i++)
				results[i].type.should.equal(expected_token_sequence[i]);
			done();
		});

		it('Leading/Trailing new line detection', function(done) {
			var content = '\ns\nc\n';
			var lexer = new Lexer({
				user_placeholder : uuid.v4(),
				revision_placeholder : uuid.v4()
			});

			var results = lexer.lex(content);

			var expected_token_sequence = ['break', 'text', 'break', 'text', 'break'];

			results.length.should.equal(5);
			for (var i = 0; i <= results.length - 1; i++)
				results[i].type.should.equal(expected_token_sequence[i]);
			done();
		});

		it('Leading/Trailing LF detection', function(done) {
			var content = '\rs\rc\r';
			var lexer = new Lexer({
				user_placeholder : uuid.v4(),
				revision_placeholder : uuid.v4()
			});

			var results = lexer.lex(content);

			var expected_token_sequence = ['break', 'text', 'break', 'text', 'break'];

			results.length.should.equal(5);
			for (var i = 0; i <= results.length - 1; i++)
				results[i].type.should.equal(expected_token_sequence[i]);
			done();
		});
	});
});