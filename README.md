#AnnoText - v0.1

  A document-based attribution engine for [node](http://nodejs.org).


##Philosophy

* The Content itself drives the Version history
* Human & Machine readable YAML storage of document attributions
* Fully serializable (Momento)


# Usage

##Create a Document

	var annotext = require('annotext');
	var annotextDocumentProcessor = new annotext();
	
	// create a basic document
	var annoTextDoc = annotextDocumentProcessor.create(
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

##Update an existing document

	var annotext = require('annotext');
	var annotextDocumentProcessor = new annotext();
	
	// create a basic document
	var annoTextDoc = annotextDocumentProcessor.create(
					'Here is some sample content',
					'toddpi314', 
					'v0.1');
					
	var updatedDoc = annotextDocumentProcessor.update(
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

#API
##Create
Create an AnnoText document without any historical versions of the document.

**Usage**

	var annotext = require('annotext');
	var annotextDocumentProcessor = new annotext();
	
	// create a basic document
	var annoTextDoc = annotextDocumentProcessor.create(
					'Here is some sample content',
					'toddpi314', 
					'v0.1');		

##Update
Update an existing document with the changed content. 

**Usage**

	var annotext = require('annotext');
	var annotextDocumentProcessor = new annotext();
	
	// create a basic document
	var annoTextDoc = annotextDocumentProcessor.create(
					'Here is some sample content',
					'toddpi314', 
					'v0.1');
					
	var updatedDoc = annotextDocumentProcessor.update(
				'Here is some sample "that I added" content',
				annoTextDoc,
				'VictorHugo',
				'v0.2');


##GetRevisionsByUser
Get a list of revisions based on the user key used in prior attribution entries.

**Usage**

	var annotext = require('annotext');
	var annotextDocumentProcessor = new annotext();
	
	// create a basic document
	var annoTextDoc = annotextDocumentProcessor.create(
					'Here is some sample content',
					'toddpi314', 
					'v0.1');
					
	// returns array of user keys
	var users = annotextDocumentProcessor.getRevisionsByUser(annoTextDoc)


##GetDistinctRevisionDates
Get a list of all revision dates relevant to the AnnoText document.

**Usage**

	var annotext = require('annotext');
	var annotextDocumentProcessor = new annotext();
	
	// create a basic document
	var annoTextDoc = annotextDocumentProcessor.create(
					'Here is some sample content',
					'toddpi314', 
					'v0.1');
					
	// returns array of dates
	var dates = annotextDocumentProcessor.getDistinctRevisionDates(annoTextDoc)

##GetDistinctRevisionKeys
Get a list of distinct revision keys relevant to the AnnoText document.

**Usage**

	var annotext = require('annotext');
	var annotextDocumentProcessor = new annotext();
	
	// create a basic document
	var annoTextDoc = annotextDocumentProcessor.create(
					'Here is some sample content',
					'toddpi314', 
					'v0.1');
					
	// returns array of revision Keys
	var revisionKeys = annotextDocumentProcessor.getDistinctRevisionKeys(annoTextDoc)

##GetDistinctUserKeys
Get a list of distinct user keys relevant to the AnnoText document.

**Usage**

	var annotext = require('annotext');
	var annotextDocumentProcessor = new annotext();
	
	// create a basic document
	var annoTextDoc = annotextDocumentProcessor.create(
					'Here is some sample content',
					'toddpi314', 
					'v0.1');
					
	// returns array of revision Keys
	var userKeys = annotextDocumentProcessor.getDistinctUserKeys(annoTextDoc)

##GetDistinctRevisions
Get a list of distinct revisions relevant to the AnnoText document.
Revisions contain 

**Usage**

	var annotext = require('annotext');
	var annotextDocumentProcessor = new annotext();
	
	// create a basic document
	var annoTextDoc = annotextDocumentProcessor.create(
					'Here is some sample content',
					'toddpi314', 
					'v0.1');
					
	// returns array of revisions
	var revisions = annotextDocumentProcessor.getDistinctRevisions(annoTextDoc)

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