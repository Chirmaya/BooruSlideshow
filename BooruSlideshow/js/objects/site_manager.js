class SiteManager
{
    constructor(sitesManager, id, url, pageLimit)
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
        this.isOnline = false;
        
        this.siteQueryTermAssociations = SITE_QUERY_TERM_ASSOCIATIONS[id];
    }
    
    buildPingRequestUrl()
	{
		switch (this.id)
		{
			case SITE_GELBOORU:
			case SITE_REALBOORU:
			case SITE_RULE34:
			case SITE_SAFEBOORU:
				return this.url + '/index.php?page=dapi&s=post&q=index&limit=1';
			case SITE_DANBOORU:
				return this.url + '/posts.json?limit=1';
			case SITE_DERPIBOORU:
				return this.url + '/images.json';
			case SITE_KONACHAN:
			case SITE_YANDERE:
				return this.url + '/post.json?limit=1';
			case SITE_E621:
				return this.url + '/post/index.json?limit=1';
			case SITE_IBSEARCH:
				return this.url + '/api/v1/images.json?limit=1';
			default:
				console.log('Error building the ping URL. Supplied site ID is not in the list.');
				return;
		}
    }
    
    buildRequestUrl(searchText, pageNumber)
	{
		var query = this.buildSiteSpecificQuery(searchText);
		
		switch (this.id)
		{
			case SITE_GELBOORU:
			case SITE_REALBOORU:
			case SITE_RULE34:
			case SITE_SAFEBOORU:
				return this.url + '/index.php?page=dapi&s=post&q=index&tags=' + query + '&pid=' + (pageNumber - 1) + '&limit=' + this.pageLimit;
			case SITE_DANBOORU:
				return this.url + '/posts.json?tags=' + query + '&page=' + pageNumber + '&limit=' + this.pageLimit;
			case SITE_DERPIBOORU:
				var possibleAddedKey = this.sitesManager.model.derpibooruApiKey ? '&key=' + this.sitesManager.model.derpibooruApiKey : '';
				return this.url + '/search.json?q=' + this.prepareQueryForDerpibooru(query) + '&page=' + pageNumber + '&limit=' + this.pageLimit + possibleAddedKey;
			case SITE_KONACHAN:
			case SITE_YANDERE:
				return this.url + '/post.json?tags=' + query + '&page=' + pageNumber + '&limit=' + this.pageLimit;
			case SITE_E621:
				return this.url + '/post/index.json?tags=' + query + '&page=' + pageNumber + '&limit=' + this.pageLimit;
			case SITE_IBSEARCH:
				return this.url + '/api/v1/images.json?q=' + query + '&page=' + pageNumber + '&limit=' + this.pageLimit + '&sources=1';
			default:
				console.log('Error building the URL. Supplied site ID is not in the list.');
				return;
		}
	}
    
    buildSiteSpecificQuery(searchText)
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
    
    prepareQueryForDerpibooru(searchQuery)
    {
        searchQuery = this.addCommasToSearchQuery(searchQuery);
        return this.replaceUnderscoresWithSpaces(searchQuery);
	}
	
	addCommasToSearchQuery(searchQuery)
	{
		return searchQuery.replace(" ", ",");
	}

	replaceUnderscoresWithSpaces(searchQuery)
	{
		return searchQuery.replace("_", " ");
	}

	resetConnection()
	{
		if (this.xhr != null) 
			this.xhr.abort();
		
		this.xhr = new XMLHttpRequest();
		
		this.lastPageLoaded = 0;
		this.isEnabled = false;
		this.allUnsortedSlides = [];
		this.hasExhaustedSearch = false;
	}

	enable()
	{
		this.isEnabled = true;
	}

	pingStatus(callback)
	{
		var url = this.buildPingRequestUrl();
		
		if (url != null)
		{
			var _this = this;
			this.makeWebsiteRequest(url, callback, function(responseText) {
				if (_this.doesResponseTextIndicateOnline(responseText))
					_this.isOnline = true;
			}, true);
		}
	}

	doesResponseTextIndicateOnline(responseText)
	{
		switch (this.id)
		{
			case SITE_GELBOORU:
			case SITE_REALBOORU:
			case SITE_RULE34:
			case SITE_SAFEBOORU:
				var parser = new DOMParser();
				var xml = parser.parseFromString(responseText, "text/xml");
				
				var xmlPosts = xml.getElementsByTagName("post");
				
				return (xmlPosts.length > 0);
			case SITE_DANBOORU:
			case SITE_DERPIBOORU:
			case SITE_KONACHAN:
			case SITE_YANDERE:
			case SITE_E621:
			case SITE_IBSEARCH:
				var jsonPosts;
		
				try
				{
					jsonPosts = JSON.parse(responseText);
				}
				catch(e)
				{
					console.log("JSON failed to parse.");
					console.log(e);
					return;
				}
				
				if (this.id == SITE_DERPIBOORU)
				{
					jsonPosts = jsonPosts["images"];
				}
				
				if (jsonPosts == null)
					return false;
				
				return (jsonPosts.length > 0);
			default:
				console.log('Error figuring out if the response text meant the site is online. Supplied site ID is not in the list.');
				return;
		}
	}

	performSearch(searchText, doneSearchingSiteCallback)
	{
		this.ranIntoErrorWhileSearching = false;
		var pageNumber = this.lastPageLoaded + 1;
		var url = this.buildRequestUrl(searchText, pageNumber);
		
		var siteManager = this;
		
		if (url != null)
		{
			this.makeWebsiteRequest(url, doneSearchingSiteCallback, function(responseText){
				siteManager.addSlides(responseText);
			});
		}
	}

	makeWebsiteRequest(url, doneSearchingSiteCallback, onSuccessCallback, useSecondaryXhr = false)
	{
		var method = 'GET';
		
        let xhr = useSecondaryXhr ? this.secondaryXhr : this.xhr;
        
        if (xhr != null)
        {
            xhr.abort();
        }
		
        if (useSecondaryXhr)
            this.secondaryXhr = new XMLHttpRequest();
        else
            this.xhr = new XMLHttpRequest();
        
        xhr = useSecondaryXhr ? this.secondaryXhr : this.xhr;
		
		if ("withCredentials" in xhr) {
			// XHR for Chrome/Firefox/Opera/Safari.
			xhr.open(method, url, true);
		} else if (typeof XDomainRequest != "undefined") {
			// XDomainRequest for IE.
			xhr = new XDomainRequest();
			xhr.open(method, url);
		} else {
			// CORS not supported.
			xhr = null;
		}
		
		var siteManager = this;
		
		xhr.onload = function() {
			siteManager.lastPageLoaded++;
            
			var responseText = xhr.responseText;
			
			if (xhr.status == 200)
			{
				if (onSuccessCallback != null)
				{
					onSuccessCallback(responseText);
				}
			}
			else
			{
				siteManager.handleErrorFromSiteResponse(responseText, xhr.status, useSecondaryXhr);
			}
			
			doneSearchingSiteCallback(siteManager);
		};
		
		xhr.onerror = function() {
			siteManager.sitesManager.displayWarningMessage('Error making the request to ' + siteManager.url);
		};
		
		xhr.send();
	}

	handleErrorFromSiteResponse(responseText, statusCode, hideVisibleWarning = false)
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
		
		if (statusCode == 429)
        {
			warningMessage += ' Requests were made too quickly. (Likely from the initial site status check.) Please try again.';
        }
		
        if (!hideVisibleWarning)
            this.sitesManager.displayWarningMessage(warningMessage);
	}

	addSlides(responseText)
	{
		if (this.id == SITE_GELBOORU || this.id == SITE_REALBOORU || this.id == SITE_RULE34 || this.id == SITE_SAFEBOORU)
		{
			this.addXmlSlides(responseText);
		}
		else
		{
			this.addJsonSlides(responseText);
		}
	}

	addXmlSlides(xmlResponseText)
	{
		var parser = new DOMParser();
		var xml = parser.parseFromString(xmlResponseText, "text/xml");
		
		var xmlPosts = xml.getElementsByTagName("post");
		
		this.hasExhaustedSearch = (xmlPosts.length < this.pageLimit);
		
		for (var i = 0; i < xmlPosts.length; i++)
		{
			var xmlPost = xmlPosts[i];
			
			this.addXmlSlide(xmlPost);
		}
	}

	addJsonSlides(jsonResponseText)
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

	addXmlSlide(xmlPost)
	{
		this.addSlideGelRuleSafe(xmlPost);
	}

	addJsonSlide(jsonPost)
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

	addSlideGelRuleSafe(xmlPost)
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
					this.reformatUrl(xmlPost.getAttribute('file_url')),
					this.reformatUrl(xmlPost.getAttribute('preview_url')),
					this.url + '/index.php?page=post&s=view&id=' + xmlPost.getAttribute('id'),
					xmlPost.getAttribute('width'),
					xmlPost.getAttribute('height'),
					new Date(xmlPost.getAttribute('created_at')),
					xmlPost.getAttribute('score'),
					this.getMediaTypeFromPath(xmlPost.getAttribute('file_url')),
					xmlPost.getAttribute('md5')
				);
				
				this.allUnsortedSlides.push(newSlide);
			}
		}
	}

	reformatUrl(url)
	{
		// Rule34 starts with two slashes right now.
		if (url.substring(0,2) == '//')
		{
			url = 'http:' + url;
		}
		
		return url;
	}

	addSlideDanbooru(jsonPost)
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
					this.getMediaTypeFromPath(jsonPost.file_url),
					jsonPost.md5
				);
				this.allUnsortedSlides.push(newSlide);
			}
		}
	}

	addSlideE621KonaYand(jsonPost)
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
		
		if (url.substring(0, 4) != 'http')
			prefix = 'https://';
		
		var date;
		
		if (jsonPost.created_at.s != null)
			date = this.convertSDateToDate(jsonPost.created_at.s)
		else
			date = this.convertSDateToDate(jsonPost.created_at)
		
		var newSlide = new Slide(
			jsonPost.id,
			prefix + jsonPost.file_url,
			prefix + jsonPost.preview_url,
			url,
			jsonPost.width,
			jsonPost.height,
			date,
			jsonPost.score,
			this.getMediaTypeFromPath(jsonPost.file_url),
			jsonPost.md5
		);
		this.allUnsortedSlides.push(newSlide);
	}

	addSlideIbSearch(jsonPost)
	{
		if (jsonPost.hasOwnProperty('path'))
		{
			if (this.isPathForSupportedMediaType(jsonPost.path))
			{
				if (this.areSomeTagsAreBlacklisted(jsonPost.tags))
					return;
				
				var date;
				
				if (jsonPost.site_uploaded != null)
					date = new Date(this.convertSDateToDate(jsonPost.site_uploaded));
				else
					date = new Date(this.convertSDateToDate(jsonPost.found));
				
				var newSlide = new Slide(
					jsonPost.id,
					'https://im1.ibsearch.xxx/' + jsonPost.path,
					'https://im1.ibsearch.xxx/t' + jsonPost.path,
					this.url + '/images/' + jsonPost.id,
					jsonPost.width,
					jsonPost.height,
					date,
					0,// No score
					this.getMediaTypeFromPath(jsonPost.path),
					jsonPost.md5
				);
				this.allUnsortedSlides.push(newSlide);
			}
		}
	}

	addSlideDerpibooru(jsonPost)
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
					this.getMediaTypeFromPath(jsonPost.image),
					jsonPost.md5
				);
				this.allUnsortedSlides.push(newSlide);
			}
		}
	}

	hasntExhaustedSearch()
	{
		return this.isEnabled && !this.hasExhaustedSearch && !this.ranIntoErrorWhileSearching;
	}

	convertSDateToDate(sDate)
	{
		return new Date(sDate * 1000);
	}

	isPathForSupportedMediaType(filePath)
	{
		var mediaType = this.getMediaTypeFromPath(filePath)
		
		return this.isMediaTypeSupported(mediaType);
	}

	getMediaTypeFromPath(filePath)
	{
		var fileExtension = filePath.substring(filePath.length - 4);
		
		switch (fileExtension.toLowerCase())
		{
			case 'webm':
			case '.mp4':
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

	isMediaTypeSupported(mediaType)
	{
		return (mediaType == MEDIA_TYPE_IMAGE && this.sitesManager.model.includeImages) ||
			(mediaType == MEDIA_TYPE_GIF && this.sitesManager.model.includeGifs) ||
			(mediaType == MEDIA_TYPE_VIDEO && this.sitesManager.model.includeWebms);
	}

	areSomeTagsAreBlacklisted(tags)
	{
		return this.sitesManager.model.areSomeTagsAreBlacklisted(tags);
	}
}