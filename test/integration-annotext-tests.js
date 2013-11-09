'use strict';


var should = require('should'),
	uuid = require('uuid'),
	async = require('async'),
	samplesProvider = require('./samples/samples-provider'),
	annotext = require('../bin/annotext');

describe('AnnoText Integration tests', function() {
	describe('api.getDistinctRevisionKeys', function() {
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
			var annotext_instance = new annotext({
				user_placeholder: uuid.v4(),
				revision_placeholder: uuid.v4()
			});
			for (var key in samples) {
				var sample = samples[key];
				var textAnnotateDoc = annotext_instance.create(sample,
					user_key, revision_key);

				var results = annotext_instance.getDistinctRevisionKeys(textAnnotateDoc);
				should.exist(results);
				results.length.should.equal(1);
			}
			done();
		});
	});


	describe('api.getDistinctUserKeys', function() {
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
			var annotext_instance = new annotext({
				user_placeholder: uuid.v4(),
				revision_placeholder: uuid.v4()
			});
			for (var key in samples) {
				var sample = samples[key];
				var textAnnotateDoc = annotext_instance.create(sample,
					user_key, revision_key);

				var results = annotext_instance.getDistinctUserKeys(textAnnotateDoc);
				should.exist(results);
				results.length.should.equal(1);
			}
			done();
		});
	});

	describe('api.getDistinctRevisions', function() {
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
			var annotext_instance = new annotext({
				user_placeholder: uuid.v4(),
				revision_placeholder: uuid.v4()
			});
			for (var key in samples) {
				var sample = samples[key];
				var textAnnotateDoc = annotext_instance.create(sample,
					user_key, revision_key);

				var results = annotext_instance.getDistinctRevisions(textAnnotateDoc);
				should.exist(results);
				results.length.should.equal(1);
			}
			done();
		});

		it('large document - expanded', function(done) {
			var user_key = uuid.v4();
			var revision_key = uuid.v4();
			var annotext_instance = new annotext({
				user_placeholder: uuid.v4(),
				revision_placeholder: uuid.v4()
			});
			for (var key in samples) {
				var sample = samples[key];
				var textAnnotateDoc = annotext_instance.create(sample,
					user_key, revision_key);

				var results = annotext_instance.getDistinctRevisions(textAnnotateDoc, true);
				results.length.should.equal(sample.length);
			}
			done();
		});
	});

	describe('api.create', function() {
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
			var annotext_instance = new annotext({
				user_placeholder: uuid.v4(),
				revision_placeholder: uuid.v4()
			});
			for (var key in samples) {
				var sample = samples[key];
				var textAnnotateDoc = annotext_instance.create(sample,
					user_key, revision_key);

				should.exist(textAnnotateDoc);
				//console.log(textAnnotateDoc);

				// TODO: Assert behavior of the doc
				// TODO: Assert header
			}
			done();
		});
	});

	describe('api.update', function() {
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

		it('all docs - add word', function(done) {
			var user_key = uuid.v4();
			var revision_key = uuid.v4();
			var annotext_instance = new annotext({
				user_placeholder: uuid.v4(),
				revision_placeholder: uuid.v4()
			});
			for (var key in samples) {
				var sample = samples[key];
				var textAnnotateDoc = annotext_instance.create(sample,
					user_key, revision_key);

				should.exist(textAnnotateDoc);

				// alter source
				var updated_doc = annotext_instance.update(
					sample + "new-word",
					textAnnotateDoc,
					user_key, 
					revision_key);
				should.exist(updated_doc);
			}
			done();
		});


		it('all-docs - remove word', function(done) {
			var user_key = uuid.v4();
			var revision_key = uuid.v4();
			var annotext_instance = new annotext({
				user_placeholder: uuid.v4(),
				revision_placeholder: uuid.v4()
			});
			for (var key in samples) {
				var sample = samples[key];
				var textAnnotateDoc = annotext_instance.create(sample,
					user_key, revision_key);
				should.exist(textAnnotateDoc);


				var upper = 5; //sample.length-1;
				for (var i = 0; i <= upper; i++) {
					// alter source
					var updated_doc = annotext_instance.update(
						sample.substr(0, i) + sample.substr(i + 1, sample.length),
						textAnnotateDoc, user_key, revision_key);
					should.exist(updated_doc);
				}
			}
			done();
		});

	});
});