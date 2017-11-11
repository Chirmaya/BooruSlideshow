var SiteManager = function (sitesManager, id, url, pageLimit)
{
	this.sitesManager = sitesManager;
	this.id = id;
	this.url = url;
	this.pageLimit = pageLimit;
	this.lastPageLoaded = 0;
	this.isEnabled = false;
	this.allUnsortedSlides = [];
	this.hasExhaustedSearch = false;
	this.ranIntoErrorWhileSearching = false;
	
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
		case SITE_DERPIBOORU:
			return this.url + '/search.json?q=' + query + '&page=' + pageNumber + '&limit=' + this.pageLimit;
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
	this.allUnsortedSlides = [];
	this.hasExhaustedSearch = false;
}

SiteManager.prototype.enable = function()
{
	this.isEnabled = true;
}

SiteManager.prototype.performSearch = function(searchText, doneSearchingSiteCallback)
{
	this.ranIntoErrorWhileSearching = false;
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
		
		if (siteManager.xhr.status == 200)
		{
			siteManager.addSlides(responseText);
		}
		else
		{
			siteManager.handleErrorFromSiteResponse(responseText);
		}
		
		doneSearchingSiteCallback.call(siteManager);
	};
	
	this.xhr.onerror = function() {
		siteManager.sitesManager.displayWarningMessage('Error making the request to ' + siteManager.url);
	};
	
	this.xhr.send();
}

SiteManager.prototype.handleErrorFromSiteResponse = function(responseText)
{
	this.ranIntoErrorWhileSearching = true;
	
	var warningMessage = 'Error when calling site ' + this.url;
	
	var possibleJson = '';
	
	try
	{
		possibleJson = JSON.parse(responseText);
	}
	catch (e)
	{
		possibleJson = null;
	}
	
	if (possibleJson != null && possibleJson.message != null)
	{
		warningMessage += ': ' + possibleJson.message;
	}
	
	this.sitesManager.displayWarningMessage(warningMessage);
}

SiteManager.prototype.addSlides = function(responseText)
{
	if (this.id == SITE_GELBOORU || this.id == SITE_RULE34 || this.id == SITE_SAFEBOORU)
	{
		this.addXmlSlides(responseText);
	}
	else
	{
		this.addJsonSlides(responseText);
	}
}
	
SiteManager.prototype.addXmlSlides = function(xmlResponseText)
{
	parser = new DOMParser();
	xml = parser.parseFromString(xmlResponseText, "text/xml");
	
	var xmlPosts = xml.getElementsByTagName("post");
	
	this.hasExhaustedSearch = (xmlPosts.length < this.pageLimit);
	
	for (var i = 0; i < xmlPosts.length; i++)
	{
		var xmlPost = xmlPosts[i];
		
		this.addXmlSlide(xmlPost);
	}
}

SiteManager.prototype.addJsonSlides = function(jsonResponseText)
{
	var jsonPosts;
	
	try
	{
		jsonPosts = JSON.parse(jsonResponseText);
	}
	catch(e)
	{
		console.log("JSON failed to parse.");
		console.log(e);
		return;
	}
	
	if (this.id == SITE_DERPIBOORU)
	{
		jsonPosts = jsonPosts["search"];
	}
	
	this.hasExhaustedSearch = (jsonPosts.length < this.pageLimit);
	
	for (var i = 0; i < jsonPosts.length; i++)
	{
	    var jsonPost = jsonPosts[i];
		
		this.addJsonSlide(jsonPost);
	}
}

SiteManager.prototype.addXmlSlide = function(xmlPost)
{
	this.addSlideGelRuleSafe(xmlPost);
}

SiteManager.prototype.addJsonSlide = function(jsonPost)
{
	switch (this.id)
	{
		case SITE_DANBOORU:
			this.addSlideDanbooru(jsonPost);
			break;
		case SITE_DERPIBOORU:
			this.addSlideDerpibooru(jsonPost);
			break;
		case SITE_E621:
		case SITE_KONACHAN:
		case SITE_YANDERE:
			this.addSlideE621KonaYand(jsonPost);
			break;
		case SITE_IBSEARCH:
			this.addSlideIbSearch(jsonPost);
			break;
	}
}

SiteManager.prototype.addSlideGelRuleSafe = function(xmlPost)
{
	if (xmlPost.hasAttribute('file_url') &&
		xmlPost.hasAttribute('preview_url'))
	{
		if (this.isPathForSupportedMediaType(xmlPost.getAttribute('file_url')))
		{
			if (this.areSomeTagsAreBlacklisted(xmlPost.getAttribute('tags')))
				return;
			
			var newSlide = new Slide(
				xmlPost.getAttribute('id'),
				reformatUrl(xmlPost.getAttribute('file_url')),
				reformatUrl(xmlPost.getAttribute('preview_url')),
				this.url + '/index.php?page=post&s=view&id=' + xmlPost.getAttribute('id'),
				xmlPost.getAttribute('width'),
				xmlPost.getAttribute('height'),
				new Date(xmlPost.getAttribute('created_at')),
				xmlPost.getAttribute('score'),
				this.getMediaTypeFromPath(xmlPost.getAttribute('file_url'))
			);
			
			this.allUnsortedSlides.push(newSlide);
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

SiteManager.prototype.addSlideDanbooru = function(jsonPost)
{
	if (jsonPost.hasOwnProperty('file_url') &&
		jsonPost.hasOwnProperty('preview_file_url'))
	{
		if (this.isPathForSupportedMediaType(jsonPost.file_url))
		{
			if (this.areSomeTagsAreBlacklisted(jsonPost.tag_string))
				return;
			
			var newSlide = new Slide(
				jsonPost.id,
				this.url + jsonPost.file_url,
				this.url + jsonPost.preview_file_url,
				this.url + '/posts/' + jsonPost.id,
				jsonPost.image_width,
				jsonPost.image_height,
				new Date(jsonPost.created_at),
				jsonPost.score,
				this.getMediaTypeFromPath(jsonPost.file_url)
			);
			this.allUnsortedSlides.push(newSlide);
		}
	}
}

SiteManager.prototype.addSlideE621KonaYand = function(jsonPost)
{
	if (!jsonPost.hasOwnProperty('id') ||
		!jsonPost.hasOwnProperty('file_url') ||
		!jsonPost.hasOwnProperty('preview_url') ||
		!jsonPost.hasOwnProperty('width') ||
		!jsonPost.hasOwnProperty('height') ||
		!jsonPost.hasOwnProperty('created_at') ||
		!jsonPost.hasOwnProperty('score') ||
		!jsonPost.hasOwnProperty('tags'))
		return;
	
	if (!this.isPathForSupportedMediaType(jsonPost.file_url))
		return;
		
	if (this.areSomeTagsAreBlacklisted(jsonPost.tags))
		return;
	
	var url = this.url + '/post/show/' + jsonPost.id;
	
	var prefix = '';
	
	if (this.id == SITE_KONACHAN)
		prefix = 'https://';
	
	var newSlide = new Slide(
		jsonPost.id,
		prefix + jsonPost.file_url,
		prefix + jsonPost.preview_url,
		this.url + '/post/show/' + jsonPost.id,
		jsonPost.width,
		jsonPost.height,
		this.convertSDateToDate(jsonPost.created_at.s),
		jsonPost.score,
		this.getMediaTypeFromPath(jsonPost.file_url)
	);
	this.allUnsortedSlides.push(newSlide);
	
}

SiteManager.prototype.addSlideIbSearch = function(jsonPost)
{
	if (jsonPost.hasOwnProperty('path'))
	{
		if (this.isPathForSupportedMediaType(jsonPost.path))
		{
			if (this.areSomeTagsAreBlacklisted(jsonPost.tags))
				return;
			
			var newSlide = new Slide(
				jsonPost.id,
				'https://im1.ibsearch.xxx/' + jsonPost.path,
				'https://im1.ibsearch.xxx/t' + jsonPost.path,
				this.url + '/images/' + jsonPost.id,
				jsonPost.width,
				jsonPost.height,
				new Date(jsonPost.found),
				0,// No score
				this.getMediaTypeFromPath(jsonPost.path)
			);
			this.allUnsortedSlides.push(newSlide);
		}
	}
}

SiteManager.prototype.addSlideDerpibooru = function(jsonPost)
{
	if (jsonPost.hasOwnProperty('image') &&
		jsonPost.hasOwnProperty('representations'))
	{
		if (this.isPathForSupportedMediaType(jsonPost.image))
		{
			var tags = jsonPost.tags;
			
			tags = tags.replace(/,\s/gm,",");
			tags = tags.replace(/\s/gm,"_");
			tags = tags.replace(/,/gm," ");
			
			if (this.areSomeTagsAreBlacklisted(tags))
				return;
			
			var newSlide = new Slide(
				jsonPost.id,
				"https://" + jsonPost.image,
				"https://" + jsonPost.representations["thumb"],
				this.url + '/' + jsonPost.id,
				jsonPost.width,
				jsonPost.height,
				new Date(jsonPost.created_at),
				jsonPost.score,
				this.getMediaTypeFromPath(jsonPost.image)
			);
			this.allUnsortedSlides.push(newSlide);
		}
	}
}

SiteManager.prototype.hasntExhaustedSearch = function()
{
	return this.isEnabled && !this.hasExhaustedSearch && !this.ranIntoErrorWhileSearching;
}


SiteManager.prototype.convertSDateToDate = function(sDate)
{
	return date = new Date(sDate * 1000);
}

SiteManager.prototype.isPathForSupportedMediaType = function (filePath)
{
	var mediaType = this.getMediaTypeFromPath(filePath)
	
	return this.isMediaTypeSupported(mediaType);
}

SiteManager.prototype.getMediaTypeFromPath = function (filePath)
{
	var fileExtension = filePath.substring(filePath.length - 4);
	
	switch (fileExtension.toLowerCase())
	{
		case 'webm':
			return MEDIA_TYPE_VIDEO;
		case '.gif':
			return MEDIA_TYPE_GIF;
		case '.swf':
		case '.zip':
			return MEDIA_TYPE_UNSUPPORTED;
		default:
			return MEDIA_TYPE_IMAGE;
	}
}

SiteManager.prototype.isMediaTypeSupported = function (mediaType)
{
    return (mediaType == MEDIA_TYPE_IMAGE && this.sitesManager.model.includeImages) ||
		(mediaType == MEDIA_TYPE_GIF && this.sitesManager.model.includeGifs) ||
		(mediaType == MEDIA_TYPE_VIDEO && this.sitesManager.model.includeWebms);
}

SiteManager.prototype.areSomeTagsAreBlacklisted = function (tags)
{
	return this.sitesManager.model.areSomeTagsAreBlacklisted(tags);
}