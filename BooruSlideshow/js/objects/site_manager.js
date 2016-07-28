var SiteManager = function (id, url, pageLimit)
{
	this.id = id;
	this.url = url;
	this.pageLimit = pageLimit;
	this.lastPageLoaded = 0;
	this.isEnabled = false;
	this.allPosts = [];
	this.hasExhaustedSearch = false;
	
	this.siteQueryTermAssociations = SITE_QUERY_TERM_ASSOCIATIONS[id];
}

SiteManager.prototype.buildRequestUrl = function(searchText, pageNumber)
{
	var query = this.buildSiteSpecificQuery(searchText);
	
	switch (this.id)
	{
		case SITE_GELBOORU:
		case SITE_RULE34:
		case SITE_SAFEBOORU:
			return this.url + '/index.php?page=dapi&s=post&q=index&tags=' + query + '&pid=' + (pageNumber - 1) + '&limit=' + this.pageLimit;
		case SITE_DANBOORU:
			return this.url + '/posts.json?tags=' + query + '&page=' + pageNumber + '&limit=' + this.pageLimit;
		case SITE_KONACHAN:
		case SITE_YANDERE:
			return this.url + '/post.json?tags=' + query + '&page=' + pageNumber + '&limit=' + this.pageLimit;
		case SITE_E621:
			return this.url + '/post/index.json?tags=' + query + '&page=' + pageNumber + '&limit=' + this.pageLimit;
		case SITE_IBSEARCH:
			return this.url + '/api/v1/images.json?q=' + query + '&page=' + pageNumber + '&limit=' + this.pageLimit;
		default:
			console.log('Error building the URL. Supplied site ID is not in the list.');
			return;
	}
}

SiteManager.prototype.buildSiteSpecificQuery = function(searchText)
{
	var query = searchText.trim();
	
	for (var queryTermToReplace in this.siteQueryTermAssociations)
	{
		var queryTermReplacement = this.siteQueryTermAssociations[queryTermToReplace];
		
		var queryTermRegexp = new RegExp(queryTermToReplace, 'i');
		
		query = query.replace(queryTermRegexp, queryTermReplacement);
	}
	
	return query;
}

SiteManager.prototype.resetConnection = function()
{
	if (this.xhr != null) 
		this.xhr.abort();
	
	this.xhr = new XMLHttpRequest();
	
	this.lastPageLoaded = 0;
	this.isEnabled = false;
	this.allPosts = [];
	this.hasExhaustedSearch = false;
}

SiteManager.prototype.enable = function()
{
	this.isEnabled = true;
}

SiteManager.prototype.performSearch = function(searchText, doneSearchingSiteCallback)
{
	var pageNumber = this.lastPageLoaded + 1;
	var url = this.buildRequestUrl(searchText, pageNumber);
	
	if (url != null)
	{
		this.makeWebsiteRequest(url, doneSearchingSiteCallback);
	}
}

SiteManager.prototype.makeWebsiteRequest = function(url, doneSearchingSiteCallback)
{
	var method = 'GET';
	
	if (this.xhr != null) 
		this.xhr.abort();
	
	this.xhr = new XMLHttpRequest();
	
	if ("withCredentials" in this.xhr) {
		// XHR for Chrome/Firefox/Opera/Safari.
		this.xhr.open(method, url, true);
	} else if (typeof XDomainRequest != "undefined") {
		// XDomainRequest for IE.
		this.xhr = new XDomainRequest();
		this.xhr.open(method, url);
	} else {
		// CORS not supported.
		this.xhr = null;
	}
	
	var siteManager = this;
	
	this.xhr.onload = function() {
		siteManager.lastPageLoaded++;
		
		var responseText = siteManager.xhr.responseText;
		
		siteManager.addPosts(responseText);
		
		doneSearchingSiteCallback.call(siteManager);
	};
	
	this.xhr.onerror = function() {
		displayWarningMessage('Error making the request to the website');
	};
	
	this.xhr.send();
}

SiteManager.prototype.addPosts = function(responseText)
{
	if (this.id == SITE_GELBOORU || this.id == SITE_RULE34 || this.id == SITE_SAFEBOORU)
	{
		this.addXmlPosts(responseText);
	}
	else
	{
		this.addJsonPosts(responseText);
	}
}
	
SiteManager.prototype.addXmlPosts = function(xmlResponseText)
{
	parser = new DOMParser();
	xml = parser.parseFromString(xmlResponseText, "text/xml");
	
	var xmlPosts = xml.getElementsByTagName("post");
	
	this.hasExhaustedSearch = (xmlPosts.length < this.pageLimit);
	
	for (var i = 0; i < xmlPosts.length; i++)
	{
		var xmlPost = xmlPosts[i];
		
		this.addXmlPost(xmlPost);
	}
}

SiteManager.prototype.addJsonPosts = function(jsonResponseText)
{
	var jsonPosts = JSON.parse(jsonResponseText);
	this.hasExhaustedSearch = (jsonPosts.length < this.pageLimit);
	
	for (var i = 0; i < jsonPosts.length; i++)
	{
	    var jsonPost = jsonPosts[i];
		
		this.addJsonPost(jsonPost);
	}
}

SiteManager.prototype.addXmlPost = function(jsonObject)
{
	this.addPostGelRuleSafe(jsonObject);
}

SiteManager.prototype.addJsonPost = function(jsonObject)
{
	switch (this.id)
	{
		case SITE_DANBOORU:
			this.addPostDanbooru(jsonObject);
			break;
		case SITE_E621:
		case SITE_KONACHAN:
		case SITE_YANDERE:
			this.addPostE621KonaYand(jsonObject);
			break;
		case SITE_IBSEARCH:
			this.addPostIbSearch(jsonObject);
			break;
	}
}

SiteManager.prototype.addPostGelRuleSafe = function(xmlPost)
{
	if (xmlPost.hasAttribute('file_url') &&
		xmlPost.hasAttribute('preview_url'))
	{
		var fileExtension = xmlPost.getAttribute('file_url').substring(xmlPost.getAttribute('file_url').length - 4);
		
		if (this.isFileExtensionSupported(fileExtension))
		{
			var newPost = new Post(
				xmlPost.getAttribute('id'),
				reformatUrl(xmlPost.getAttribute('file_url')),
				reformatUrl(xmlPost.getAttribute('preview_url')),
				this.url + '/index.php?page=post&s=view&id=' + xmlPost.getAttribute('id'),
				xmlPost.getAttribute('width'),
				xmlPost.getAttribute('height'),
				new Date(xmlPost.getAttribute('created_at')),
				xmlPost.getAttribute('score')
			);
			
			this.allPosts.push(newPost);
		}
	}
}

function reformatUrl(url)
{
	// Rule34 starts with two slashes right now.
	if (url.substring(0,2) == '//')
	{
		url = 'http:' + url;
	}
	
	return url;
}

SiteManager.prototype.addPostDanbooru = function(jsonObject)
{
	if (jsonObject.hasOwnProperty('file_url') &&
		jsonObject.hasOwnProperty('preview_file_url'))
	{
		var fileExtension = jsonObject.file_url.substring(jsonObject.file_url.length - 4);
		
		if (this.isFileExtensionSupported(fileExtension))
		{
			var newPost = new Post(
				jsonObject.id,
				this.url + jsonObject.file_url,
				this.url + jsonObject.preview_file_url,
				this.url + '/posts/' + jsonObject.id,
				jsonObject.image_width,
				jsonObject.image_height,
				new Date(jsonObject.created_at),
				jsonObject.score
			);
			this.allPosts.push(newPost);
		}
	}
}

SiteManager.prototype.addPostE621KonaYand = function(jsonObject)
{
	if (jsonObject.hasOwnProperty('file_url') &&
		jsonObject.hasOwnProperty('preview_url'))
	{
		var fileExtension = jsonObject.file_url.substring(jsonObject.file_url.length - 4);
		
		if (this.isFileExtensionSupported(fileExtension))
		{
			var newPost = new Post(
				jsonObject.id,
				jsonObject.file_url,
				jsonObject.preview_url,
				this.url + '/post/show/' + jsonObject.id,
				jsonObject.width,
				jsonObject.height,
				this.convertSDateToDate(jsonObject.created_at.s),
				jsonObject.score
			);
			this.allPosts.push(newPost);
		}
	}
}

SiteManager.prototype.addPostIbSearch = function(jsonObject)
{
	if (jsonObject.hasOwnProperty('path'))
	{
		var fileExtension = jsonObject.path.substring(jsonObject.path.length - 4);
		
		if (this.isFileExtensionSupported(fileExtension))
		{
			var newPost = new Post(
				jsonObject.id,
				'https://im1.ibsearch.xxx/' + jsonObject.path,
				'https://im1.ibsearch.xxx/t' + jsonObject.path,
				this.url + '/images/' + jsonObject.id,
				jsonObject.width,
				jsonObject.height,
				new Date(jsonObject.found),
				0// No score
			);
			this.allPosts.push(newPost);
		}
	}
}

SiteManager.prototype.getTotalImageNumber = function()
{
	return this.allPosts.length;
}

SiteManager.prototype.hasntExhaustedSearch = function()
{
	return this.isEnabled && !this.hasExhaustedSearch;
}


SiteManager.prototype.convertSDateToDate = function(sDate)
{
	return date = new Date(sDate * 1000);
}

SiteManager.prototype.isFileExtensionSupported = function (fileExtension)
{
    return fileExtension != '.zip' && // No zip files
        fileExtension != '.swf' && // No flash files
        fileExtension != 'webm'; // No video files
}