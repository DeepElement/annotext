'use strict';

var should = require('should'),
    util = require('./test'),
    uu = require('util'),
    uuid = require('uuid'),
    async = require('async'),
    annotext = require('../annotext'),
    diff_match_patch = require('googlediff');

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
            var annotext_instance = new annotext();
            var edit_date = new Date();

            var sampleContent = "mmmm";
            var updatedContent = "mmmmm";

            // create the baseline document
            annotext_instance.update({
                user_key: user_key,
                revision_key: revision_key,
                content: sampleContent,
                edit_date: edit_date
            });

            // create disconnected patches (read-only)
            var patches = annotext_instance.createPatch(updatedContent);

            // apply the patches to the doc
            annotext_instance.update({
                user_key: user_key,
                revision_key: update_revision_key,
                patches: patches,
                edit_date: edit_date
            });

            var parsed = annotext_instance.parse();
            should.exist(parsed.header.annotations);
            parsed.header.annotations.length.should.equal(2);

            reconstructContentFromHeader(parsed);

            done();
        });

        it('created revision runs correct', function(done) {
            var user_key = uuid.v4();
            var revision_key = uuid.v4();
            var update_revision_key = uuid.v4();
            var annotext_instance = new annotext();
            var edit_date = new Date();

            var sampleContent = "mmmm";
            var updatedContent = "mmmmn";

            // create the baseline document
            annotext_instance.update({
                user_key: user_key,
                revision_key: revision_key,
                content: sampleContent,
                edit_date: edit_date
            });

            var patches = annotext_instance.createPatch(updatedContent);
            annotext_instance.update({
                user_key: user_key,
                revision_key: revision_key,
                patches: patches,
                edit_date: edit_date
            });

            var parsed = annotext_instance.parse();
            should.exist(parsed.header.annotations);
            parsed.header.annotations.length.should.equal(1);

            reconstructContentFromHeader(parsed);

            done();
        });


        it('custom data attached to revision', function(done) {
            var user_key = uuid.v4();
            var revision_key = uuid.v4();
            var update_revision_key = uuid.v4();
            var annotext_instance = new annotext();
            var edit_date = new Date();

            var sampleContent = "mmmm";
            var updatedContent = "mmmmn";

            annotext_instance.update({
                user_key: user_key,
                revision_key: revision_key,
                content: sampleContent,
                custom_inline: {
                    go: 'ninja-go'
                },
                edit_date: edit_date
            });

            var patches = annotext_instance.createPatch(updatedContent);
            annotext_instance.update({
                patches: patches,
                user_key: user_key,
                revision_key: revision_key,
                edit_date: edit_date
            });

            var parsed = annotext_instance.parse();
            should.exist(parsed.header.annotations);
            parsed.header.annotations.length.should.equal(1);
            parsed.header.annotations[0].go.should.equal('ninja-go');

            reconstructContentFromHeader(parsed);

            done();
        });

    });

    describe('api.update', function() {
        it('revision indexes correct', function(done) {
            var user_key = uuid.v4();
            var revision_key = uuid.v4();
            var annotext_instance = new annotext();
            var sampleContent = "mmmm";

            var textAnnotateDoc = annotext_instance.update({
                user_key: user_key,
                revision_key: revision_key,
                content: sampleContent
            });
            var parsedDoc = annotext_instance.parse();

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
            var parent_revision_key = uuid.v4();
            var annotext_instance = new annotext();
            var sampleContent = "mmmm";

            annotext_instance.update({
                user_key: user_key,
                revision_key: revision_key,
                content: sampleContent,
                custom_header: {
                    parent_revision_key: parent_revision_key
                }
            });

            var parsedDoc = annotext_instance.parse();

            parsedDoc.content.should.equal(sampleContent);
            parsedDoc.header.annotations.length.should.equal(1);

            done();
        });

        it('custom creation data', function(done) {
            var user_key = uuid.v4();
            var revision_key = uuid.v4();
            var parent_revision_key = uuid.v4();
            var annotext_instance = new annotext();
            var sampleContent = "mmmm";

            annotext_instance.update({
                user_key: user_key,
                revision_key: revision_key,
                content: sampleContent,
                custom_header: {
                    parent_revision_key: parent_revision_key
                },
                custom_inline: {
                    go: 'ninja-go'
                }
            });

            var parsedDoc = annotext_instance.parse();

            parsedDoc.header.parent_revision_key.should.equal(parent_revision_key);
            parsedDoc.header.annotations[0].go.should.equal('ninja-go');

            return done();
        });
    });


    describe('update', function() {
        it('Crazy User-Key', function(done) {
            var annotextDoc = new annotext();
            var doc = "---\nannotations:\n  - { range_start: 0, range_end: 18, created: \'2013-11-24T17:06:01.153Z\', user: yxuesbv7, revision: 21bf0c14-fe9e-428c-94c5-f1db5e3f2cc8 }\ncreated: \'2013-11-24T17:06:01.153Z\'\n---\nThis is my story...";
            var newContent = "asdfasdf";
            var user_key = "My name's mike D";
            var revision_key = uuid.v4();


            annotextDoc.update({
                content: newContent,
                user_key: user_key,
                revision_key: revision_key
            });

            return done();
        });

        it('Crazy Revision-Key', function(done) {
            var annotextDocumentProcessor = new annotext();
            var doc = "---\nannotations:\n  - { range_start: 0, range_end: 18, created: \'2013-11-24T17:06:01.153Z\', user: yxuesbv7, revision: 21bf0c14-fe9e-428c-94c5-f1db5e3f2cc8 }\ncreated: \'2013-11-24T17:06:01.153Z\'\n---\nThis is my story...";
            var newContent = "asdfasdf";
            var user_key = "toddpi314";
            var revision_key = uuid.v4() + " " + uuid.v4();

            annotextDocumentProcessor.update({
                content: newContent,
                user_key: user_key,
                revision_key: revision_key,

            });

            return done();
        });

        it('Validate Revision Timestamp', function(done) {
            var annotextDoc = new annotext();
            var doc = "---\nannotations:\n  - { range_start: 0, range_end: 18, created: \'2013-11-24T17:06:01.153Z\', user: yxuesbv7, revision: 21bf0c14-fe9e-428c-94c5-f1db5e3f2cc8 }\ncreated: \'2013-11-24T17:06:01.153Z\'\n---\nThis is my story...";
            var content = "asdfasdf";
            var user_key = "toddpi314";
            var revision_key = uuid.v4() + " " + uuid.v4();
            var edit_date = new Date();

            annotextDoc.update(
            {
                content: content,
                user_key: user_key,
                revision_key: revision_key,
                edit_date : edit_date
            });

            var parsed = annotextDoc.parse();
            should.exist(parsed.header);
            return done();
        });
    });
    describe('parse', function() {
        it('Standard Success', function(done) {
            var jsonDoc = "---\nannotations:\n  - { range_start: 0, range_end: 18, created: \'2013-11-24T17:06:01.153Z\', user: yxuesbv7, revision: 21bf0c14-fe9e-428c-94c5-f1db5e3f2cc8 }\ncreated: \'2013-11-24T17:06:01.153Z\'\n---\nThis is my story...";
            var annotextDoc = new annotext(jsonDoc);

            // do the test
            var parseContext = annotextDoc.parse();

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
