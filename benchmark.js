var sampleRepository = require('./test/samples/samples-provider'),
	async = require('async'),
	annotext = new(require('./bin/annotext'))(),
	uuid = require('uuid');

var elapsed_time = function(note) {
	var precision = 3; // 3 decimal places
	var elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
	console.log(process.hrtime(start)[0] + " s, " + elapsed.toFixed(precision) + " ms - " + note); // print message + time
}

// start the benchmark
var start = process.hrtime();

sampleRepository.getAllSampleFileNames(function(err, files) {
	var contents = [];
	async.each(files,
		function(item, item_callback) {
			sampleRepository.getSampleContent({
				filepath: item
			}, function(err, content) {
				if (err)
					return item_callback(err);
				contents.push(content);
				item_callback();
			});
		},
		function(err) {
			runBenchmark(contents);
		});
});

var runBenchmark = function(contents) {
	var delegateRuntimes = [];
	operators.forEach(function(operatorRecord) {
		var elapsedRecords = [];
		contents.forEach(function(content) {
			//var start = process.hrtime();
			var start = Date.now();
			operatorRecord.delegate(content);
			var end = Date.now();

			//var elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
			var elapsed = end - start;

			console.log("\t" + operatorRecord.name + ": " + elapsed.toFixed(3) + " ms, size=" + content.length + " normalized=" + (elapsed / content.length).toFixed(5) + " ms");

			elapsedRecords.push(elapsed);
		});

		var sum = 0;
		elapsedRecords.forEach(function(e) {
			sum += e;
		});
		var elapsedRecordsAvg = sum / elapsedRecords.length;

		console.log(operatorRecord.name + ": " + 'Average Create Time: ' + elapsedRecordsAvg.toFixed(3) + " mss");
		console.log("==============================================");

		delegateRuntimes.push({
			record: operatorRecord,
			average: elapsedRecordsAvg
		});
	});

	delegateRuntimes.sort(function(a, b) {
		return a.average - b.average
	});
	delegateRuntimes.reverse();

	console.log('============= Benchmark Report ===============');
	delegateRuntimes.forEach(function(b){
		console.log(b.record.name + " - " + b.average + " ms");
	});
	console.log('==============================================');
}

var operators = [{
	name: "Create",
	delegate: function(content) {
		var userKey = uuid.v4();
		var revisionKey = uuid.v4();
		var textAnnotateDoc = annotext.create(content,
			userKey, revisionKey);
	}
}, {
	name: "Create & Update (Remove Content)",
	delegate: function(content) {
		var userKey = uuid.v4();
		var revisionKey = uuid.v4();
		var textAnnotateDoc = annotext.create(content,
			userKey, revisionKey);

		var newContent = content.substr(content.length / 2);
		var editUserKey = uuid.v4();
		var editRevisionKey = uuid.v4();

		var updateContent = annotext.update(
			newContent,
			textAnnotateDoc,
			editUserKey,
			editRevisionKey);
	}
}, {
	name: "Create & Update (Add Content)",
	delegate: function(content) {
		var userKey = uuid.v4();
		var revisionKey = uuid.v4();
		var textAnnotateDoc = annotext.create(content,
			userKey, revisionKey);

		var newContent = content + content.substr(content.length / 2);
		var editUserKey = uuid.v4();
		var editRevisionKey = uuid.v4();

		var updateContent = annotext.update(
			newContent,
			textAnnotateDoc,
			editUserKey,
			editRevisionKey);
	}
}];