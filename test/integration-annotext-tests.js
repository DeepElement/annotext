'use strict';


var should = require('should'),
	uuid = require('uuid'),
	async = require('async'),
	samplesProvider = require('./samples/samples-provider'),
	annotext = require('../bin/annotext');

describe('AnnoText Integration tests', function() {
	describe('api.annotate', function() {
		var samples = {}

		beforeEach(function(done) {
			samplesProvider.getAllSampleFileNames(
				function(err, resp) {
					async.each(resp,
						function(item, item_callback) {
							samplesProvider.getSampleContent({
									filepath: item
								},
								function(content_err, content) {
									should.not.exist(content_err);
									samples[item] = content;
									item_callback();
								});
						},
						function(err) {
							should.not.exist(err);
							done();
						});
				});
		});

		it('large document', function(done) {
			var user_key = uuid.v4();
			var revision_key = uuid.v4();
			var annotext_instance = new annotext();
			for (var key in samples) {
				var sample = samples[key];
				annotext_instance.api.annotate(sample, user_key, revision_key);
			}
			done();
		});
	});

	describe('api.annotateDiff', function() {
		var samples = {}

		beforeEach(function(done) {
			samplesProvider.getAllSampleFileNames(
				function(err, resp) {
					async.each(resp,
						function(item, item_callback) {
							samplesProvider.getSampleContent({
									filepath: item
								},
								function(content_err, content) {
									should.not.exist(content_err);
									samples[item] = content;
									item_callback();
								});
						},
						function(err) {
							should.not.exist(err);
							done();
						});
				});
		});

		it('large document', function(done) {
			for (var key in samples) {
				var sample = samples[key];
			}
			done();
		});
	});

	describe('api.deannotate', function() {
		var samples = {}

		beforeEach(function(done) {
			samplesProvider.getAllSampleFileNames(
				function(err, resp) {
					async.each(resp,
						function(item, item_callback) {
							samplesProvider.getSampleContent({
									filepath: item
								},
								function(content_err, content) {
									should.not.exist(content_err);
									samples[item] = content;
									item_callback();
								});
						},
						function(err) {
							should.not.exist(err);
							done();
						});
				});
		});

		it('large document', function(done) {
			for (var key in samples) {
				var sample = samples[key];
			}
			done();
		});
	});
});