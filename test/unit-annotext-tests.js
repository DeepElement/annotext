'use strict';


var should = require('should'),
uuid = require('uuid'),
async = require('async'),
samplesProvider = require('./samples/samples-provider'),
annotext = require('../bin/annotext');

describe('AnnoText Unit tests', function() {
	describe('parse', function() {
		it('Standard Success', function(done) {
			var annotextDocumentProcessor = new annotext();
			var doc = "---\nannotations:\n  - { range_start: 0, range_end: 18, created: \'2013-11-24T17:06:01.153Z\', user: yxuesbv7, revision: 21bf0c14-fe9e-428c-94c5-f1db5e3f2cc8 }\ncreated: \'2013-11-24T17:06:01.153Z\'\n---\nThis is my story...";

			// do the test
			var parseContext = annotextDocumentProcessor.parse(doc);

			should.exist(parseContext);
			should.exist(parseContext.header);
			should.exist(parseContext.header.annotations);
			should.exist(parseContext.header.created);
			should.exist(parseContext.content);

			done();
		});
	});
});