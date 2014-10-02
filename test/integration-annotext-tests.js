var should = require('should'),
    util = require('./test'),
    uuid = require('uuid'),
    async = require('async'),
    annotext = require('../annotext'),
    diff_match_patch = require('googlediff'),
    path = require('path'),
    moment = require('moment');


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

        it('Standard case - with single user attribution', function(done) {
            var user_key = 'd8eb9a26-cb9c-4342-8548-6d6f5750a914';
            var revision_key = '4e183537-8b5d-48b4-9905-52b8e2d60686';
            var revision_date = new moment('2013-12-23T14:33:52.761Z').toDate();

            async.eachSeries(samplesWithAttribution,
                function(sample, sample_callback) {
                    var annotext_instance = new annotext();

                    var annoTextDoc = annotext_instance.update({
                        content: sample.markdown,
                        user_key: user_key,
                        revision_key: revision_key,
                        edit_date: revision_date
                    });

                    annotext_instance.exportToHtml({},
                        function(err, htmlExport) {
                            var exportClean = cleanseContent(htmlExport.replace(/\n/g, '<LF>'));
                            var sampleClean = cleanseContent(sample.html.replace(/\n/g, '<LF>'));
                            exportClean.trim().should.equal(sampleClean.trim());
                            return sample_callback();
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
            for (var key in samples) {
                var annotext_instance = new annotext();
                var sample = samples[key];
                annotext_instance.update({
                    content: sample,
                    user_key: user_key,
                    revision_key: revision_key
                });

                var results = annotext_instance.getRevisionsByUser(user_key);
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
            for (var key in samples) {
                var annotext_instance = new annotext();
                var sample = samples[key];
                annotext_instance.update({
                    content: sample,
                    user_key: user_key,
                    revision_key: revision_key
                });

                var results = annotext_instance.getDistinctRevisionDates();
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
            for (var key in samples) {
                var annotext_instance = new annotext();
                var sample = samples[key];
                annotext_instance.update({
                    content: sample,
                    user_key: user_key,
                    revision_key: revision_key
                });

                var results = annotext_instance.getDistinctRevisionKeys();
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
            for (var key in samples) {
                var annotext_instance = new annotext();
                var sample = samples[key];
                annotext_instance.update({
                    content: sample,
                    user_key: user_key,
                    revision_key: revision_key
                });

                var results = annotext_instance.getDistinctUserKeys();
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
            for (var key in samples) {
                var annotext_instance = new annotext();
                var sample = samples[key];
                annotext_instance.update({
                    content: sample,
                    user_key: user_key,
                    revision_key: revision_key
                });

                var results = annotext_instance.getDistinctRevisions();
                should.exist(results);
                results.length.should.equal(1);
            }
            done();
        });

        it('large document - expanded', function(done) {
            var user_key = uuid.v4();
            var revision_key = uuid.v4();
            for (var key in samples) {
                var annotext_instance = new annotext();
                var sample = samples[key];
                annotext_instance.update({
                    content: sample,
                    user_key: user_key,
                    revision_key: revision_key
                });

                var results = annotext_instance.getDistinctRevisions();
                results.length.should.equal(1);
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

        it('large document', function(done) {
            var user_key = uuid.v4();
            var revision_key = uuid.v4();
            for (var key in samples) {
                var annotext_instance = new annotext();
                var sample = samples[key];
                annotext_instance.update({
                    user_key: user_key,
                    revision_key: revision_key,
                    content: sample
                });

                var parsed = annotext_instance.parse();

                should.exist(parsed);
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
            var edit_date = new Date();
            for (var key in samples) {
                var annotext_instance = new annotext();
                var sample = samples[key];
                annotext_instance.update({
                    content: sample,
                    user_key: user_key,
                    revision_key: revision_key,
                    edit_date: edit_date
                });

                // alter source
                annotext_instance.update({
                    content: sample + "new-word",
                    user_key: user_key,
                    revision_key: revision_key,
                    edit_date: edit_date
                });


                var parsed = annotext_instance.parse();
                should.exist(parsed);
            }
            done();
        });

        it('all-docs - remove word', function(done) {
            var user_key = uuid.v4();
            var revision_key = uuid.v4();
            var edit_date = new Date();
            for (var key in samples) {
                var annotext_instance = new annotext();
                var sample = samples[key];
                annotext_instance.update({
                    content: sample,
                    user_key: user_key,
                    revision_key: revision_key,
                    edit_date: edit_date
                });

                var upper = 5; //sample.length-1;
                for (var i = 0; i <= upper; i++) {
                    // alter source
                    annotext_instance.update({
                        content: sample.substr(0, i) + sample.substr(i + 1, sample.length),
                        user_key: user_key,
                        revision_key: revision_key,
                        edit_date: edit_date
                    });

                    var parsed = annotext_instance.parse();
                    should.exist(parsed);
                }
            }
            return done();
        });

    });
});
