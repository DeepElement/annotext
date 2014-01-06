var should = require('should'),
	util = require('./test'),
	uuid = require('uuid'),
	async = require('async'),
	annotext = require('../bin/annotext'),
	diff_match_patch = require('googlediff'),
	path = require('path');


var sampleFolders = [
	path.join(__dirname, '/samples/markdown'),
	path.join(__dirname, '/samples/gutenberg')
];

describe('AnnoText Integration tests', function() {
	describe('api.exportToHtml', function() {
		var samplesWithoutAttribution, samplesWithAttribution;

		beforeEach(function(done) {
			var nonAttributionSamplesFolder = path.join(__dirname, "/samples/export_html_without_attribution");
			var attributionSamplesFolder = path.join(__dirname, "/samples/export_html_with_attribution");

			util.loadSamples(nonAttributionSamplesFolder,
				function(err, resp) {
					samplesWithoutAttribution = util.groupFilesByName(resp);
					util.loadSamples(attributionSamplesFolder,
						function(err, resp) {
							samplesWithAttribution = util.groupFilesByName(resp);
							done(err);
						});
				});
		});
		
		it("Force Fail", 
		function(done){
			1.should.equal(2);
			done();
		});

		it('Standard case - with single user attribution', function(done) {
			var userKey = 'd8eb9a26-cb9c-4342-8548-6d6f5750a914';
			var revisionKey = '4e183537-8b5d-48b4-9905-52b8e2d60686';
			var revisionDateTime = new moment('2013-12-23T14:33:52.761Z').toDate();


			async.eachSeries(samplesWithAttribution,
				function(sample, sample_callback) {
					var annotext_instance = new annotext({
						user_placeholder: uuid.v4(),
						revision_placeholder: uuid.v4()
					});

					var annoTextDoc = annotext_instance.create(
						sample.markdown,
						userKey,
						revisionKey,
						null, // parentRevisionKey
						null,
						revisionDateTime);

					annotext_instance.exportToHtml(annoTextDoc,
						null,
						function(err, htmlExport) {
							var exportClean = cleanseContent(htmlExport.replace(/\n/g, '<LF>'));
							var sampleClean = cleanseContent(sample.html.replace(/\n/g, '<LF>'));
							exportClean.trim().should.equal(sampleClean.trim());
							sample_callback();
						});
				},
				function(err) {
					done(err);
				});
		});
	});
	var cleanseContent = function(src) {
		src = src.replace(/(\<LF\>)+/g, "<LF>");
		return src;
	}

	describe('api.updateByDiffMatchPatches', function() {
		var samples = {}

		beforeEach(function(done) {
			util.loadSamples(sampleFolders,
				function(err, resp) {
					if (err)
						done(err);

					resp.forEach(function(item) {
						samples[item.name] = item.data;
					});
					done();
				});
		});

		it('all docs - add word', function(done) {
			var user_key = uuid.v4();
			var revision_key = uuid.v4();
			var annotext_instance = new annotext({
				user_placeholder: uuid.v4(),
				revision_placeholder: uuid.v4()
			});
			var dmp = new diff_match_patch();

			for (var key in samples) {
				var sample = samples[key];
				var textAnnotateDoc = annotext_instance.create(sample,
					user_key, revision_key);

				should.exist(textAnnotateDoc);

				var patches = dmp.patch_make(sample, sample + "new-word");
				var updated_doc = annotext_instance.updateByDiffMatchPatches(
					patches,
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
			var dmp = new diff_match_patch();
			for (var key in samples) {
				var sample = samples[key];
				var textAnnotateDoc = annotext_instance.create(sample,
					user_key, revision_key);
				should.exist(textAnnotateDoc);


				var upper = 5; //sample.length-1;
				for (var i = 0; i <= upper; i++) {
					// alter source
					var patches = dmp.patch_make(sample, sample.substr(0, i) + sample.substr(i + 1, sample.length));
					var updated_doc = annotext_instance.updateByDiffMatchPatches(
						patches,
						textAnnotateDoc, user_key, revision_key);
					should.exist(updated_doc);
				}
			}
			done();
		});

	});



	describe('api.getRevisionsByUser', function() {
		var samples = {}
		beforeEach(function(done) {
			util.loadSamples(sampleFolders,
				function(err, resp) {
					if (err)
						done(err);

					resp.forEach(function(item) {
						samples[item.name] = item.data;
					});
					done();
				});
		});

		it('large document', function(done) {
			var user_key = uuid.v4();
			var revision_key = uuid.v4();
			var annotext_instance = new annotext();
			for (var key in samples) {
				var sample = samples[key];
				var textAnnotateDoc = annotext_instance.create(sample,
					user_key, revision_key);

				var results = annotext_instance.getRevisionsByUser(textAnnotateDoc, user_key);
				should.exist(results);
				results.length.should.equal(1);
			}
			done();
		});
	});

	describe('api.getDistinctRevisionDates', function() {
		var samples = {}
		beforeEach(function(done) {
			util.loadSamples(sampleFolders,
				function(err, resp) {
					if (err)
						done(err);

					resp.forEach(function(item) {
						samples[item.name] = item.data;
					});
					done();
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

				var results = annotext_instance.getDistinctRevisionDates(textAnnotateDoc);
				should.exist(results);
				results.length.should.equal(1);
			}
			done();
		});
	});

	describe('api.getDistinctRevisionKeys', function() {
		var samples = {}
		beforeEach(function(done) {
			util.loadSamples(sampleFolders,
				function(err, resp) {
					if (err)
						done(err);

					resp.forEach(function(item) {
						samples[item.name] = item.data;
					});
					done();
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
			util.loadSamples(sampleFolders,
				function(err, resp) {
					if (err)
						done(err);

					resp.forEach(function(item) {
						samples[item.name] = item.data;
					});
					done();
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
			util.loadSamples(sampleFolders,
				function(err, resp) {
					if (err)
						done(err);

					resp.forEach(function(item) {
						samples[item.name] = item.data;
					});
					done();
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
				results.length.should.equal(1);
			}
			done();
		});
	});

	describe('api.create', function() {
		var samples = {}
		beforeEach(function(done) {
			util.loadSamples(sampleFolders,
				function(err, resp) {
					if (err)
						done(err);

					resp.forEach(function(item) {
						samples[item.name] = item.data;
					});
					done();
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
			util.loadSamples(sampleFolders,
				function(err, resp) {
					if (err)
						done(err);

					resp.forEach(function(item) {
						samples[item.name] = item.data;
					});
					done();
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
