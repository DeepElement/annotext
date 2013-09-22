var path = require('path'),
fs = require('fs'),
async = require('async'),
S = require('string');

var sample_folders = ['markdown', 'gutenberg'];
var ignore_files = ['.DS_Store'];

exports.getAllSampleFileNames = function(callback) {
	var files = [];
	async.each(sample_folders,
		function(item, item_callback) {
			var expanded_folder_str =  item;
			var item_dir = path.join(__dirname, expanded_folder_str);
			fs.readdir(item_dir, function(err, dir_files) {
				if (err) {
					item_callback(err);
					return;
				}
				for(var i=0; i<=dir_files.length-1; i++)
				{
					if(ignore_files.indexOf(dir_files[i]) == -1)
					{
						var file_path_expanded = path.join(item_dir, dir_files[i]);
						files.push(file_path_expanded);
					}
				}
				item_callback();
			});
		},
		function(err) {
			if (err) {
				callback(err);
				return;
			}
			callback(null, files);
		});
}

exports.getSampleContent = function(data, callback) {
	var filepath = data.filepath;
	fs.readFile(filepath, 'utf-8', function(err, contents) {
		if (err) {
			callback(err);
			return;
		}
		callback(null, contents);
	});
}