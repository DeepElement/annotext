#AnnoText [![Build Status](https://travis-ci.org/DeepElement/AnnoText.png?branch=master)](https://travis-ci.org/DeepElement/AnnoText)

  A document-based attribution engine for various languages ([node](http://nodejs.org)). 


##Philosophy

* The Content itself drives the Version history
* Human & Machine readable YAML storage of document attributions
* Fully serializable (Momento)


## Node
### Usage

####Create a Document

	var annotext = new (require('annotext'))();
	
	// create a basic document
	var annoTextDoc = annotext.create(
					'Here is some sample content',
					'toddpi314', 
					'v0.1');			

**AnnoText**

	---
	annotations:
	  - { range_start: 0, range_end: 26, created: '2013-11-09T18:30:56.080Z', user: toddpi314, revision: v0.1 }
	created: '2013-11-09T18:30:56.080Z'
	---
	Here is some sample content

####Update an existing document

	var annotext = new (require('annotext'))();
	
	// create a basic document
	var annoTextDoc = annotext.create(
					'Here is some sample content',
					'toddpi314', 
					'v0.1');
					
	var updatedDoc = annotext.update(
				'Here is some sample "that I added" content',
				annoTextDoc,
				'VictorHugo',
				'v0.2');
		

**AnnoText**

	---
	annotations:
	  - { created: '2013-11-09T18:45:43.511Z', user: toddpi314, revision: v0.1, range_start: 0, range_end: 20 }
	  - { created: '2013-11-09T18:45:43.513Z', user: VictorHugo, revision: v0.2, range_start: 21, range_end: 35 }
	  - { created: '2013-11-09T18:45:43.511Z', user: toddpi314, revision: v0.1, range_start: 36, range_end: 42 }
	created: '2013-11-09T18:45:43.514Z'
	---
	Here is some sample "that I added" content

###API
####Create
Create an AnnoText document without any historical versions of the document. 

_Arguments_
	- content - document content
	- userKey - user key of creator
	- revisionKey - revision key of first impression
	- (Optional) parentRevisionKey - revision key of parent if derived
	- (Optional) createDateTime

**Usage**

	var annotext = new (require('annotext'))();
	
	// create a basic document
	var annoTextDoc = annotext.create(
					'Here is some sample content', // Content
					'toddpi314', // User key
					'v0.1',  // Current Revision
					'v0.0'); // Parent revision optional		

####Update
Update an existing document with the changed content. 

_Arguments_
	- newContent - updated document content
	- annotextDoc - pre-existing annotext document
	- userKey - user key of editor
	- revisionKey - revision key of new revision
	- (Optional) editDateTime - DateTime of the edit

**Usage**

	var annotext = new (require('annotext'))();
	
	// create a basic document
	var annoTextDoc = annotext.create(
					'Here is some sample content',
					'toddpi314', 
					'v0.1');
					
	var updatedDoc = annotext.update(
				'Here is some sample "that I added" content',
				annoTextDoc,
				'VictorHugo',
				'v0.2');


####Parse
Parse an existing document and get a pretty "ok" api for accessing header/content.

**Usage**

	var annotext = new (require('annotext'))();
	
	// create a basic document
	var annoTextDoc = annotext.create(
					'Here is some sample content',
					'toddpi314', 
					'v0.1');
					
	var parsedDoc = annotext.parse(annoTextDoc);



####GetRevisionsByUser
Get a list of revisions based on the user key used in prior attribution entries.

**Usage**

	var annotext = new (require('annotext'))();
	
	// create a basic document
	var annoTextDoc = annotext.create(
					'Here is some sample content',
					'toddpi314', 
					'v0.1');
					
	// returns array of user keys
	var users = annotext.getRevisionsByUser(annoTextDoc)


####GetDistinctRevisionDates
Get a list of all revision dates relevant to the AnnoText document.

**Usage**

	var annotext = new (require('annotext'))();
	
	// create a basic document
	var annoTextDoc = annotext.create(
					'Here is some sample content',
					'toddpi314', 
					'v0.1');
					
	// returns array of dates
	var dates = annotext.getDistinctRevisionDates(annoTextDoc)

####GetDistinctRevisionKeys
Get a list of distinct revision keys relevant to the AnnoText document.

**Usage**

	var annotext = new (require('annotext'))();
	
	// create a basic document
	var annoTextDoc = annotext.create(
					'Here is some sample content',
					'toddpi314', 
					'v0.1');
					
	// returns array of revision Keys
	var revisionKeys = annotext.getDistinctRevisionKeys(annoTextDoc)

####GetDistinctUserKeys
Get a list of distinct user keys relevant to the AnnoText document.

**Usage**

	var annotext = new (require('annotext'))();
	
	// create a basic document
	var annoTextDoc = annotext.create(
					'Here is some sample content',
					'toddpi314', 
					'v0.1');
					
	// returns array of revision Keys
	var userKeys = annotext.getDistinctUserKeys(annoTextDoc)

####GetDistinctRevisions
Get a list of distinct revisions relevant to the AnnoText document.
Revisions contain 

**Usage**

	var annotext = new (require('annotext'))();
	
	// create a basic document
	var annoTextDoc = annotext.create(
					'Here is some sample content',
					'toddpi314', 
					'v0.1');
					
	// returns array of revisions
	var revisions = annotext.getDistinctRevisions(annoTextDoc)

##Contact & Issues

Issues: https://github.com/DeepElement/AnnoText/issues

or,<todd@deepelement.com>

## License

(The MIT License)

Copyright (c) 2008-2014 Todd Morrison &lt;todd@deepelement.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
