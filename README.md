<img src="http://www.deepelement.com/img/logos/de/de_logo.ico" height="30"> Annotext Attribution Format
---

  A document-based attribution engine for [NodeJS](http://nodejs.org). 


 [![Build Status](https://travis-ci.org/DeepElement/AnnoText.png?branch=master)](https://travis-ci.org/DeepElement/AnnoText) [![npm status](https://nodei.co/npm/annotext.png?compact=true)](https://nodei.co/npm/annotext.png?compact=true)

#Philosophy

* The Content itself drives the Version history
* Human & Machine readable YAML storage of document attributions
* Fully serializable (Momento)


# Node
## Usage

###Create a Document

	var annotextDoc = new annotext();
	annotextDoc.update(
			{
				content: 'Here is some sample content',
				user_key: 'toddpi314', 
				revision_key: 'v0.1'
			});			

**AnnoText**

	---
	annotations:
	  - { range_start: 0, range_end: 26, created: '2013-11-09T18:30:56.080Z', user: toddpi314, revision: v0.1 }
	created: '2013-11-09T18:30:56.080Z'
	---
	Here is some sample content

###Update an existing document

	var annotextDoc = new annotext();
	annotextDoc.update(
				{
					content: 'Here is some sample content',
					user_key: 'toddpi314', 
					revision_key: 'v0.1'
				});
	annotextDoc.update(
				{
					content: 'Here is some sample "that I added" content',
					user_key: 'VictorHugo',
					revision_key: 'v0.2'
				});
		

**AnnoText**

	---
	annotations:
	  - { created: '2013-11-09T18:45:43.511Z', user: toddpi314, revision: v0.1, range_start: 0, range_end: 20 }
	  - { created: '2013-11-09T18:45:43.513Z', user: VictorHugo, revision: v0.2, range_start: 21, range_end: 35 }
	  - { created: '2013-11-09T18:45:43.511Z', user: toddpi314, revision: v0.1, range_start: 36, range_end: 42 }
	created: '2013-11-09T18:45:43.514Z'
	---
	Here is some sample "that I added" content

##API
###Update
Add content to the document (creation and update)

**Arguments**

- content - document content
- user_key - user key of creator
- revision_key - revision key of first impression
- (Optional) inline_custom - custom attributes to attach to the annotation record
- (Optional) inline_header - custom attributes to attach to the document header
- (Optional) edit_date - datestamp for the revision updates

**Usage**

	var annotextDoc = new annotext();
	annotextDoc.update(
			{
				content: 'Here is some sample content', // Content
				user_key: 'toddpi314', // User key
				revision_key: 'v0.1',  // Current Revision
				inline_custom: {
					'go': 'ninja'				},
				header_custom: {
					'custom': 'header-value'					});
				

###Parse
Parse an existing document and get a pretty "ok" api for accessing header/content.

**Usage**

	var annotextDoc = new annotext();
	var annotextDoc = annotext.update(
		{
			content: 'Here is some sample content',
			user_key: 'toddpi314',
			revision_key: 'v0.1'		
		});
	var parsedDoc = annotextDoc.parse();



###GetRevisionsByUser
Get a list of revisions based on the user key used in prior attribution entries.

**Usage**

	var annotextDoc = new annotext();
	var annotextDoc = annotext.update(
		{
			content: 'Here is some sample content',
			user_key: 'toddpi314',
			revision_key: 'v0.1'		
		});
	var revisions = annotextDoc.getRevisionsByUser();


###GetDistinctRevisionDates
Get a list of all revision dates relevant to the AnnoText document.

**Usage**

	var annotextDoc = new annotext();
	var annotextDoc = annotext.update(
		{
			content: 'Here is some sample content',
			user_key: 'toddpi314',
			revision_key: 'v0.1'		
		});
	var dates = annotextDoc.getDistinctRevisionDates();

###GetDistinctRevisionKeys
Get a list of distinct revision keys relevant to the AnnoText document.

**Usage**

	var annotextDoc = new annotext();
	var annotextDoc = annotext.update(
		{
			content: 'Here is some sample content',
			user_key: 'toddpi314',
			revision_key: 'v0.1'		
		});
	var revisionKey = annotextDoc.getDistinctRevisionKeys();

###GetDistinctUserKeys
Get a list of distinct user keys relevant to the AnnoText document.

**Usage**

	var annotextDoc = new annotext();
	var annoTextDoc = annotext.update(
		{
			content: 'Here is some sample content',
			user_key: 'toddpi314',
			revision_key: 'v0.1'		
		});
	var users = annotextDoc.getDistinctUserKeys();


#Contact & Issues

[https://github.com/DeepElement/AnnoText/issues](https://github.com/DeepElement/AnnoText/issues) 

<todd@deepelement.com>

# License

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
