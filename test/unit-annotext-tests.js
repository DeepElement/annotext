'use strict';


var should = require('should'),
	uuid = require('uuid'),
	async = require('async'),
	samplesProvider = require('./samples/samples-provider'),
	annotext = require('../bin/annotext'),
	diff_match_patch = require('googlediff'),
	moment = require('moment');


var reconstructContentFromHeader = function(parsed) {
	parsed.header.annotations.sort(function(a, b) {
		var leftProp;
		var rightProp;

		var test = function(val) {
			if (val.index != null)
				return val.index;
			if (val.range_start != null)
				return val.range_start;
		};

		return test(a) - test(b);
	});
	var reconstructedContent = "";
	parsed.header.annotations.forEach(function(rev) {
		if (rev.index != null) {
			reconstructedContent += parsed.content[rev.index];
		} else {
			reconstructedContent += parsed.content.substr(rev.range_start, rev.range_end - rev.range_start + 1);
		}
	});

	reconstructedContent.should.equal(parsed.content);
}

describe('AnnoText Unit tests', function() {
	describe('api.update', function() {
		it('revision indexes correct', function(done) {
			var user_key = uuid.v4();
			var revision_key = uuid.v4();
			var update_revision_key = uuid.v4();
			var annotext_instance = new annotext({
				user_placeholder: uuid.v4(),
				revision_placeholder: uuid.v4()
			});
			var dmp = new diff_match_patch();

			var sampleContent = "mmmm";
			var updatedContent = "mmmmm";

			var textAnnotateDoc = annotext_instance.create(sampleContent,
				user_key, revision_key);

			var patches = dmp.patch_make(sampleContent, updatedContent);
			var updated_doc = annotext_instance.updateByDiffMatchPatches(
				patches,
				textAnnotateDoc,
				user_key,
				update_revision_key);

			var parsed = annotext_instance.parse(updated_doc);

			should.exist(parsed.header.annotations);
			parsed.header.annotations.length.should.equal(2);

			reconstructContentFromHeader(parsed);

			done();
		});

		it('created revision runs correct', function(done) {
			var user_key = uuid.v4();
			var revision_key = uuid.v4();
			var update_revision_key = uuid.v4();
			var annotext_instance = new annotext({
				user_placeholder: uuid.v4(),
				revision_placeholder: uuid.v4()
			});
			var dmp = new diff_match_patch();

			var sampleContent = "mmmm";
			var updatedContent = "mmmmn";

			var textAnnotateDoc = annotext_instance.create(sampleContent,
				user_key, revision_key);

			var patches = dmp.patch_make(sampleContent, updatedContent);
			var updated_doc = annotext_instance.updateByDiffMatchPatches(
				patches,
				textAnnotateDoc,
				user_key,
				update_revision_key);

			var parsed = annotext_instance.parse(updated_doc);

			should.exist(parsed.header.annotations);
			parsed.header.annotations.length.should.equal(2);

			reconstructContentFromHeader(parsed);

			done();
		});

	});

	describe('api.create', function() {
		it('revision indexes correct', function(done) {
			var user_key = uuid.v4();
			var revision_key = uuid.v4();
			var annotext_instance = new annotext({
				user_placeholder: uuid.v4(),
				revision_placeholder: uuid.v4()
			});
			var dmp = new diff_match_patch();

			var sampleContent = "mmmm";

			var textAnnotateDoc = annotext_instance.create(sampleContent,
				user_key, revision_key);

			var parsedDoc = annotext_instance.parse(textAnnotateDoc);

			should.exist(parsedDoc.header.annotations);
			parsedDoc.header.annotations.length.should.equal(1);
			parsedDoc.header.annotations[0].range_start.should.equal(0);
			parsedDoc.header.annotations[0].range_end.should.equal(3);

			reconstructContentFromHeader(parsedDoc);

			done();
		});

		it('retains parent revision reference', function(done) {
			var user_key = uuid.v4();
			var revision_key = uuid.v4();
			var parentRevision_key = uuid.v4();
			var annotext_instance = new annotext({
				user_placeholder: uuid.v4(),
				revision_placeholder: uuid.v4()
			});
			var dmp = new diff_match_patch();
			var sampleContent = "mmmm";

			var textAnnotateDoc = annotext_instance.create(sampleContent,
				user_key, revision_key, parentRevision_key);

			var parsedDoc = annotext_instance.parse(textAnnotateDoc);
			parsedDoc.header.parentRevisionKey.should.equal(parentRevision_key);

			done();
		});
	});

	describe('api.updateByDiffMatchPatches', function() {
		it('add word', function(done) {
			var user_key = uuid.v4();
			var revision_key = uuid.v4();
			var annotext_instance = new annotext({
				user_placeholder: uuid.v4(),
				revision_placeholder: uuid.v4()
			});
			var dmp = new diff_match_patch();

			var sampleContent = "This is some sample content";
			var updatedContent = sampleContent + " added words ";

			var textAnnotateDoc = annotext_instance.create(sampleContent,
				user_key, revision_key);

			should.exist(textAnnotateDoc);

			var patches = dmp.patch_make(sampleContent, updatedContent);
			var updated_doc = annotext_instance.updateByDiffMatchPatches(
				patches,
				textAnnotateDoc,
				user_key,
				revision_key);
			should.exist(updated_doc);

			var parsed = annotext_instance.parse(updated_doc);
			parsed.content.should.equal(updatedContent);

			reconstructContentFromHeader(parsed);

			done();
		});

		it('remove word', function(done) {
			var user_key = uuid.v4();
			var revision_key = uuid.v4();
			var annotext_instance = new annotext({
				user_placeholder: uuid.v4(),
				revision_placeholder: uuid.v4()
			});
			var dmp = new diff_match_patch();

			var sampleContent = "This is some sample content";
			var updatedContent = "This is content";

			var textAnnotateDoc = annotext_instance.create(sampleContent,
				user_key, revision_key);

			should.exist(textAnnotateDoc);

			var patches = dmp.patch_make(sampleContent, updatedContent);
			var updated_doc = annotext_instance.updateByDiffMatchPatches(
				patches,
				textAnnotateDoc,
				user_key,
				revision_key);
			should.exist(updated_doc);

			var parsed = annotext_instance.parse(updated_doc);
			parsed.content.should.equal(updatedContent);

			reconstructContentFromHeader(parsed);

			done();
		});

		it('remove word - complex use-case', function(done) {
			var user_key = uuid.v4();
			var revision_key = uuid.v4();
			var annotext_instance = new annotext({
				user_placeholder: uuid.v4(),
				revision_placeholder: uuid.v4()
			});
			var dmp = new diff_match_patch();

			var sampleContent = "some crazy \n sample content \n";
			var updatedContent = "a\na\na\na\na";

			var textAnnotateDoc = annotext_instance.create(sampleContent,
				user_key, revision_key);

			should.exist(textAnnotateDoc);

			var patches = dmp.patch_make(sampleContent, updatedContent);
			var updated_doc = annotext_instance.updateByDiffMatchPatches(
				patches,
				textAnnotateDoc,
				user_key,
				revision_key);
			should.exist(updated_doc);

			var parsed = annotext_instance.parse(updated_doc);
			parsed.content.should.equal(updatedContent);

			reconstructContentFromHeader(parsed);

			done();
		});

	});


	describe('update', function() {
		it('Crazy User-Key', function(done) {
			var annotextDocumentProcessor = new annotext();
			var doc = "---\nannotations:\n  - { range_start: 0, range_end: 18, created: \'2013-11-24T17:06:01.153Z\', user: yxuesbv7, revision: 21bf0c14-fe9e-428c-94c5-f1db5e3f2cc8 }\ncreated: \'2013-11-24T17:06:01.153Z\'\n---\nThis is my story...";
			var newContent = "asdfasdf";
			var crazyUserKey = "My name's mike D";
			var revisionKey = uuid.v4();

			var updateContent = annotextDocumentProcessor.update(
				newContent,
				doc,
				crazyUserKey,
				revisionKey);

			should.exist(updateContent);

			done();
		});

		it('Crazy Revision-Key', function(done) {
			var annotextDocumentProcessor = new annotext();
			var doc = "---\nannotations:\n  - { range_start: 0, range_end: 18, created: \'2013-11-24T17:06:01.153Z\', user: yxuesbv7, revision: 21bf0c14-fe9e-428c-94c5-f1db5e3f2cc8 }\ncreated: \'2013-11-24T17:06:01.153Z\'\n---\nThis is my story...";
			var newContent = "asdfasdf";
			var crazyUserKey = "toddpi314";
			var revisionKey = uuid.v4() + " " + uuid.v4();

			var updateContent = annotextDocumentProcessor.update(
				newContent,
				doc,
				crazyUserKey,
				revisionKey);

			should.exist(updateContent);

			done();
		});

		it('Validate Revision Timestamp', function(done) {
			var annotextDocumentProcessor = new annotext();
			var doc = "---\nannotations:\n  - { range_start: 0, range_end: 18, created: \'2013-11-24T17:06:01.153Z\', user: yxuesbv7, revision: 21bf0c14-fe9e-428c-94c5-f1db5e3f2cc8 }\ncreated: \'2013-11-24T17:06:01.153Z\'\n---\nThis is my story...";
			var newContent = "asdfasdf";
			var crazyUserKey = "toddpi314";
			var revisionKey = uuid.v4() + " " + uuid.v4();
			var revisionDateTime = new Date();
			var revisionDateTimeIso = moment(revisionDateTime).toISOString();

			var updateContent = annotextDocumentProcessor.update(
				newContent,
				doc,
				crazyUserKey,
				revisionKey,
				revisionDateTime);

			var stripped = updateContent.replace(revisionDateTimeIso, '');
			stripped.length.should.be.below(updateContent.length);

			done();
		});
	});
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

			reconstructContentFromHeader(parseContext);

			done();
		});
	});
});