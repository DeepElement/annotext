var util = require('./test'),
should = require('should'),
marked = require('../lib/marked'),
assert = require("assert"),
annotext = require('../bin/annotext'),
fs = require('fs'),
path = require('path'),
string = require('string'),
async = require('async'),
uuid = require('uuid'),
moment = require('moment');

var groupFilesByName = function(files) {
	var nameKey = {};
	var results = [];

	files.forEach(function(file) {
		var idxExtension = file.name.lastIndexOf('.');
		var name = file.name.substr(0, idxExtension);
		var extension = file.name.substr(idxExtension+1, file.name.length - 1);

		if (nameKey[name] == null)
			nameKey[name] = {};

		switch (extension) {
			case "html":
			nameKey[name].html = file.data;
			break;
			case "text":
			nameKey[name].markdown = file.data;
			break;
		}
	});

	for(var key in nameKey)
		results.push(nameKey[key]);

	return results;
}


describe('marked integration', function() {
	describe('/parse', function() {
		var samplesWithoutAttribution, samplesWithAttribution;

		beforeEach(function(done) {
			var nonAttributionSamplesFolder = path.join(__dirname, "/samples/export_html_without_attribution");
			var attributionSamplesFolder = path.join(__dirname, "/samples/export_html_with_attribution");

			util.loadSamples(nonAttributionSamplesFolder,
				function(err, resp) {
					samplesWithoutAttribution = groupFilesByName(resp);
					util.loadSamples(attributionSamplesFolder,
						function(err, resp) {
							samplesWithAttribution = groupFilesByName(resp);
							done(err);
						});
				});
		});

		it('Markdown HTML Generation - with single user attribution', function(done) {
			var userKey = 'd8eb9a26-cb9c-4342-8548-6d6f5750a914';
			var revisionKey = '4e183537-8b5d-48b4-9905-52b8e2d60686';
			var revisionDateTime = moment('2013-12-23T14:33:52.761Z').toDate();

			var annotextDocumentProcessor = new annotext();
			samplesWithAttribution.forEach(function(sample) {
				var annoTextDoc = annotextDocumentProcessor.create(
					sample.markdown,
					userKey,
					revisionKey,
					null, // parentRevisionKey
					null,
					revisionDateTime);

				var htmlExport = marked(sample.markdown, annoTextDoc);
				var exportClean = cleanseContent(htmlExport.replace(/\n/g, '<LF>'));
				var sampleClean = cleanseContent(sample.html.replace(/\n/g, '<LF>'));
				exportClean.trim().should.equal(sampleClean.trim());
			});
			done();
		});

		it('Markdown HTML Generation - without attribution', function(done) {
			samplesWithoutAttribution.forEach(function(sample) {
				var htmlExport = marked(sample.markdown);
				var exportClean = cleanseContent(htmlExport.replace(/\n/g, '<LF>'));
				var sampleClean = cleanseContent(sample.html.replace(/\n/g, '<LF>'));
				exportClean.trim().should.equal(sampleClean.trim());
			});

			done();
		});
	});
});

var cleanseContent = function(src) {
	src = src.replace(/(\<LF\>)+/g, "<LF>");
	return src;
}