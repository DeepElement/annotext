var async = require('async'),
	fs = require('fs'),
	path = require('path');

exports.loadSamples = function(data, callback) {
	var folders = [];
	var samples = [];
	if (Object.prototype.toString.call(data) === '[object Array]') {
		folders = data;
	} else {
		folders = [data];
	}

	async.each(folders,
		function(folder, folder_callback) {
			fs.readdir(folder,
				function(err, files) {
					if (err)
						return folder_callback(err);
					var fileNames = [];
					files.forEach(function(file) {
						fileNames.push(path.join(folder, file));
					});

					async.each(
						fileNames,
						function(item, item_callback) {
							fs.readFile(item, 'utf8', function(err, data) {
								if (err)
									return item_callback(err);
								if (item.indexOf('.DS_Store') == -1) {
									samples.push({
										data: data,
										name: item
									});
								}

								return item_callback();
							});
						},
						function(err) {
							if (err)
								return folder_callback(err);
							return folder_callback(null, samples);
						});
				});
		},
		function(err) {
			if (err)
				return callback(err);
			return callback(null, samples);
		});
}

exports.groupFilesByName = function(files) {
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
