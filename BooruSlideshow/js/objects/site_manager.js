class SiteManager
{
    constructor(sitesManager, id, url, pageLimit)
    {
		this.webRequester = new WebRequester();
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
		console.log('buildPingRequestUrl() was not implemented.');
    }
    
    buildRequestUrl(searchText, pageNumber)
	{
		console.log('buildRequestUrl() was not implemented.');
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

	resetConnection()
	{
		this.webRequester.resetConnection();
		
		this.lastPageLoaded = 0;
		this.isEnabled = false;
		this.allUnsortedSlides = [];
		this.hasExhaustedSearch = false;
		this.ranIntoErrorWhileSearching = false;
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
			this.webRequester.makeWebsiteRequest(
				url,
				function(responseText){
					if (_this.doesResponseTextIndicateOnline(responseText))
						_this.isOnline = true;
				},
				this.handleErrorFromSiteResponse.bind(_this),
				function(){
					callback(_this);
				},
				function(url, hideVisibleWarning = false){
					_this.handleGeneralError(url, hideVisibleWarning);
					callback(_this);
				},
				true);
		}
	}

	doesResponseTextIndicateOnline(responseText)
	{
		console.log('doesResponseTextIndicateOnline() was not implemented.');
	}

	performSearch(searchText, doneSearchingSiteCallback)
	{
		if (!this.isOnline)
		{
			console.log('Trying to perform search on site that has not been determined to be online.');
			return;
		}

		this.ranIntoErrorWhileSearching = false;
		var pageNumber = this.lastPageLoaded + 1;
		var url = this.buildRequestUrl(searchText, pageNumber);
		
		var siteManager = this;
		
		if (url != null)
		{
			this.webRequester.makeWebsiteRequest(
				url,
				function(responseText){
					siteManager.lastPageLoaded++;
					siteManager.addSlides(responseText);
				},
				this.handleErrorFromSiteResponse.bind(siteManager),
				function(){
					doneSearchingSiteCallback(siteManager);
				},
				this.handleGeneralError.bind(siteManager),
			);
		}
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
			console.log('status code = ' + statusCode);
			console.log(responseText);
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

	handleGeneralError(url, hideVisibleWarning = false)
	{
		if (!hideVisibleWarning)
			this.sitesManager.displayWarningMessage('Error making the request to ' + url);
	}

	addSlides(responseText)
	{
		console.log('addSlides() was not implemented.');
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
			
			this.addSlide(xmlPost);
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
		else if (this.id == SITE_E621)
		{
			jsonPosts = jsonPosts["posts"]
		}
		
		this.hasExhaustedSearch = (jsonPosts.length < this.pageLimit);

		for (var i = 0; i < jsonPosts.length; i++)
		{
			var jsonPost = jsonPosts[i];
			
			this.addSlide(jsonPost);
		}
	}

	addSlide(jsonOrXmlPost)
	{
		console.log('addSlide() was not implemented.');
	}

	hasntExhaustedSearch()
	{
		return this.isEnabled && !this.hasExhaustedSearch && !this.ranIntoErrorWhileSearching;
	}

	convertSDateToDate(sDate)
	{
		console.log('passed in ' + sDate);
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

	isRatingAllowed(rating)
	{
		if (!this.sitesManager.model.includeExplicit && !this.sitesManager.model.includeQuestionable && !this.sitesManager.model.includeSafe)
			return true;
		
		return (rating == "e" && this.sitesManager.model.includeExplicit) || 
			(rating == "q" && this.sitesManager.model.includeQuestionable) ||
			(rating == "s" && this.sitesManager.model.includeSafe);
	}

	areSomeTagsAreBlacklisted(tags)
	{
		return this.sitesManager.model.areSomeTagsAreBlacklisted(tags);
	}

	reformatFileUrl(url)
	{
		if (url.substring(0,2) == '//')
		{
			url = 'http:' + url;
		}
		
		return url;
	}
}