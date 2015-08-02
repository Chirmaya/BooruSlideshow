// Post
var Post = function (id, fileUrl, previewFileUrl, postOnSiteUrl, imageWidth, imageHeight, date)
{
	this.id = id;
	this.fileUrl = fileUrl;
	this.previewFileUrl = previewFileUrl;
	this.postOnSiteUrl = postOnSiteUrl;
	this.imageWidth = imageWidth;
	this.imageHeight = imageHeight;
	this.date = date;
	this.isPreloaded = false;
	this.isPreloading = false;
	this.preloadImage = null;
	this.callbackToRunAfterPreloadingFinishes = null;
}

Post.prototype.preload = function()
{
	if (!this.isPreloaded && !this.isPreloading)
	{
		this.isPreloading = true;
		
		this.preloadImage = new Image();
		
		var post = this;
		
		this.preloadImage.onload = function() {
			post.isPreloaded = true;
			post.isPreloading = false;
			
			if (post.callbackToRunAfterPreloadingFinishes != null)
			{
				post.callbackToRunAfterPreloadingFinishes.call();
			}
		}
		
		this.preloadImage.onerror = function() {
			this.isPreloading = false;
		}
		
		this.preloadImage.src = this.fileUrl;
	}
}

Post.prototype.toString = function postToString()
{
	return 'Post ' + this.id + ' ' + this.fileUrl + ' ' + this.fileUrl + ' ' + this.previewFileUrl + ' ' + this.imageWidth + ' ' + this.imageHeight;
}





// Sites Manager
var SitesManager = function (numberOfImagesToAlwaysHaveReadyToDisplay)
{
	this.numberOfImagesToAlwaysHaveReadyToDisplay = numberOfImagesToAlwaysHaveReadyToDisplay;
	this.siteManagers = [];
	this.siteManagersCurrentlySearching = 0;
	this.currentImageNumber = 0;
	this.allPosts = [];
	this.numberOfPostsSorted = [];
	this.searchText = '';
}

SitesManager.prototype.addSite = function(id, url, pageLimit, numberOfImagesToAlwaysHaveReadyToDisplay)
{
	this.siteManagers.push(new SiteManager(id, url, pageLimit, numberOfImagesToAlwaysHaveReadyToDisplay));
}

SitesManager.prototype.enableSites = function(sites)
{
	for (var i = 0; i < sites.length; i++)
	{
		var site = sites[i];
		
		this.enableSite(site);
	}
}

SitesManager.prototype.enableSite = function(site)
{
	for (var i = 0; i < this.siteManagers.length; i++)
	{
		var siteManager = this.siteManagers[i];
		
		if (siteManager.id == site)
		{
			displayDebugText('Enabling site ' + site);
			siteManager.enable();
			return;
		}
	}
}

SitesManager.prototype.getCountOfActiveSiteManagers = function()
{
	var count = 0;
	
	for (var i = 0; i < this.siteManagers.length; i++)
	{
		var siteManager = this.siteManagers[i];
		
		if (siteManager.isEnabled)
		{
			count++;
		}
	}
	
	return count;
}

SitesManager.prototype.getCountOfActiveSiteManagersThatHaventExhaustedSearches = function()
{
	var count = 0;
	
	for (var i = 0; i < this.siteManagers.length; i++)
	{
		var siteManager = this.siteManagers[i];
		
		if (siteManager.hasntExhaustedSearch())
		{
			count++;
		}
	}
	
	return count;
}

SitesManager.prototype.resetConnections = function()
{
	for (var i = 0; i < this.siteManagers.length; i++)
	{
		var siteManager = this.siteManagers[i];
		
		siteManager.resetConnection();
	}
	
	this.siteManagersCurrentlySearching = 0;
	this.currentImageNumber = 0;
	this.allSortedPosts = [];
	this.numberOfPostsSorted = [];
	this.searchText = '';
}

SitesManager.prototype.performSearch = function(searchText, doneSearchingAllSitesCallback)
{
	this.searchText = searchText;
	
	displayDebugText('Searching ' + this.siteManagersCurrentlySearching + ' sites');
	
	var sitesManager = this;
	
	this.performSearchUntilWeHaveEnoughPosts(function() {
		if (this.allSortedPosts.length > 0)
		{
			sitesManager.setCurrentImageNumber(1);
		}
		
		doneSearchingAllSitesCallback.call(sitesManager);
	});
}

SitesManager.prototype.performSearchUntilWeHaveEnoughPosts = function(doneSearchingAllSitesCallback)
{
	if (this.doMoreImagesNeedToBeLoaded())
	{
		var sitesManager = this;
		this.searchSites(function() {
			sitesManager.performSearchUntilWeHaveEnoughPosts(doneSearchingAllSitesCallback);
		});
	}
	else
	{
		doneSearchingAllSitesCallback.call(this);
	}
}

SitesManager.prototype.searchSites = function(doneSearchingSitesCallback)
{
	this.siteManagersCurrentlySearching = this.getCountOfActiveSiteManagersThatHaventExhaustedSearches();
	
	for (var i = 0; i < this.siteManagers.length; i++)
	{
		var siteManager = this.siteManagers[i];
		
		if (siteManager.hasntExhaustedSearch())
		{
			var sitesManager = this;
			
			siteManager.performSearch(searchText, function() {
				displayDebugText('siteManagersCurrentlySearching = ' + sitesManager.siteManagersCurrentlySearching);
				sitesManager.siteManagersCurrentlySearching--;
				
				if (sitesManager.siteManagersCurrentlySearching == 0)
				{
					sitesManager.buildSortedPostList();
					doneSearchingSitesCallback.call(sitesManager);
				}
			});
		}
	}
}

SitesManager.prototype.buildSortedPostList = function()
{
	var numberOfAlreadySortedPosts = this.getNumberOfSortedPosts();
	var postsToSort = [];
	
	for (var i = 0; i < this.siteManagers.length; i++)
	{
		var siteManager = this.siteManagers[i];
		
		if (siteManager.isEnabled)
		{
			if (this.numberOfPostsSorted[siteManager.id] == null)
			{
				Array.prototype.push.apply(postsToSort, siteManager.allPosts);
				this.numberOfPostsSorted[siteManager.id] = siteManager.allPosts.length;
			}
			else
			{
				var numberOfPostsSortedBySiteManager = this.numberOfPostsSorted[siteManager.id];
				
				for (var j = numberOfPostsSortedBySiteManager; j < siteManager.allPosts.length; j++)
				{
					postsToSort.push(siteManager.allPosts[j]);
				}
				
				var numberOfAddedSortedPosts = siteManager.allPosts.length - numberOfPostsSortedBySiteManager;
				this.numberOfPostsSorted[siteManager.id] += numberOfAddedSortedPosts;
			}
		}
	}
	displayDebugText('about to sort');
	
	postsToSort.sort(function(a,b) {
		return b.date.getTime() - a.date.getTime();
	});
	
	Array.prototype.push.apply(this.allSortedPosts, postsToSort);
}

SitesManager.prototype.getNumberOfSortedPosts = function()
{
	var count = 0;
	
	for (var i = 0; i < this.siteManagers.length; i++)
	{
		var siteManager = this.siteManagers[i];
		
		if (siteManager.isEnabled)
		{
			count += this.numberOfPostsSorted[siteManager.id];
		}
	}
	
	return count;
}

SitesManager.prototype.doMoreImagesNeedToBeLoaded = function()
{
	if (!this.areThereMoreLoadableImages())
	{
		return false;
	}
	
	var numberOfLoadedImagesLeftToDisplay = this.getTotalImageNumber() - this.currentImageNumber;
	
	var moreImagesNeedToBeLoaded = (this.numberOfImagesToAlwaysHaveReadyToDisplay > numberOfLoadedImagesLeftToDisplay);
	
	return moreImagesNeedToBeLoaded;
}

SitesManager.prototype.getTotalImageNumber = function()
{
	return this.allSortedPosts.length;
}

SitesManager.prototype.moveToFirstImage = function()
{
	this.setCurrentImageNumber(1);
}

SitesManager.prototype.moveToLastImage = function(callbackForAfterPossiblyLoadingMoreImages)
{
	var totalImageNumber = this.getTotalImageNumber();
	this.setCurrentImageNumber(totalImageNumber);
	
	var sitesManager = this;
	
	this.performSearchUntilWeHaveEnoughPosts(function() {
		callbackForAfterPossiblyLoadingMoreImages.call(sitesManager);
		
		this.preloadNextImageIfNeeded();
	});
}

SitesManager.prototype.increaseCurrentImageNumber = function(callbackForAfterPossiblyLoadingMoreImages)
{
	if (this.currentImageNumber <= this.getTotalImageNumber())
	{
		this.setCurrentImageNumber(this.currentImageNumber + 1);
		
		var sitesManager = this;
		
		this.performSearchUntilWeHaveEnoughPosts(function() {
			callbackForAfterPossiblyLoadingMoreImages.call(sitesManager);
			
			this.preloadNextImageIfNeeded();
		});
	}
}

SitesManager.prototype.moveToPreviousImage = function()
{
	if (this.currentImageNumber > 1)
	{
		this.setCurrentImageNumber(this.currentImageNumber - 1);
	}
}

SitesManager.prototype.moveToSpecificImage = function(specificImageNumber)
{
	if (specificImageNumber > 0 && specificImageNumber <= this.getTotalImageNumber())
	{
		this.setCurrentImageNumber(specificImageNumber);
	}
}

SitesManager.prototype.setCurrentImageNumber = function(newCurrentImageNumber)
{
	this.clearCallbacksForPreloadingImages();
	this.currentImageNumber = newCurrentImageNumber;
	this.preloadCurrentImageIfNeeded();
	this.preloadNextImageIfNeeded();
}

SitesManager.prototype.clearCallbacksForPreloadingImages = function()
{
	if (this.currentImageNumber > 0)
	{
		var currentPost = this.getCurrentPost();
		currentPost.callbackToRunAfterPreloadingFinishes = null;
	}
}

SitesManager.prototype.runCodeWhenCurrentImageFinishesLoading = function(callback)
{
	var currentPost = this.getCurrentPost();
	currentPost.callbackToRunAfterPreloadingFinishes = callback;
}

SitesManager.prototype.getCurrentPost = function()
{
	if (this.currentImageNumber > 0)
	{
		return this.allSortedPosts[this.currentImageNumber - 1];
	}
}

SitesManager.prototype.areThereMoreLoadableImages = function()
{
	for (var i = 0; i < this.siteManagers.length; i++)
	{
		var siteManager = this.siteManagers[i];
		
		if (siteManager.hasntExhaustedSearch())
		{
			return true;
		}
	}
	
	return false;
}

SitesManager.prototype.preloadCurrentImageIfNeeded = function()
{
	var currentPost = this.allSortedPosts[this.currentImageNumber - 1];
	
	currentPost.preload();
}

SitesManager.prototype.preloadNextImageIfNeeded = function()
{
	if (this.currentImageNumber < this.getTotalImageNumber())
	{
		var nextPost = this.allSortedPosts[this.currentImageNumber];
		
		nextPost.preload();
	}
}

SitesManager.prototype.isCurrentImageLoaded = function()
{
	if (this.currentImageNumber > 0)
	{
		return this.getCurrentPost().isPreloaded;
	}
}




// Site Manager
var SiteManager = function (id, url, pageLimit)
{
	this.id = id;
	this.url = url;
	this.pageLimit = pageLimit;
	this.lastPageLoaded = 0;
	this.isEnabled = false;
	this.allPosts = [];
	this.hasExhaustedSearch = false;
}

SiteManager.prototype.buildRequestUrl = function(searchText, pageNumber)
{
	switch (this.id)
	{
		case SITE_GELBOORU:
		case SITE_RULE34:
		case SITE_SAFEBOORU:
			return this.url + '/index.php?page=dapi&s=post&q=index&tags=' + searchText + '&pid=' + (pageNumber - 1) + '&limit=' + this.pageLimit;
		case SITE_DANBOORU:
			return this.url + '/posts.json?tags=' + searchText + '&page=' + pageNumber + '&limit=' + this.pageLimit;
		case SITE_E621:
			return this.url + '/post/index.json?tags=' + searchText + '&page=' + pageNumber + '&limit=' + this.pageLimit;
		default:
			displayDebugText('Error making the request.');
			return;
	}
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
		displayDebugText(url);
		
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
		displayDebugText('handle request response');
		siteManager.lastPageLoaded++;
		displayDebugText('pageNumber = ' + siteManager.lastPageLoaded);
		displayDebugText(siteManager.id);
		
		var responseText = siteManager.xhr.responseText;
		siteManager.addPosts(responseText);
		
		displayDebugText(siteManager.id + ' total image number =  ' + siteManager.getTotalImageNumber());
		
		doneSearchingSiteCallback.call(siteManager);
	};
	
	this.xhr.onerror = function() {
		displayDebugText('Error making the request.');
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
	
	displayDebugText('site ' + this.id + ' has ' + xmlPosts.length + ' xml objects');
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
	displayDebugText('site ' + this.id + ' has ' + jsonPosts.length + ' json objects');
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
	/*switch (this.id)
	{
		case SITE_SAFEBOORU:
			this.addPostSafebooru(jsonObject);
			break;
		case SITE_GELBOORU:
			this.addPostGelbooru(jsonObject);
			break;
	}*/
}

SiteManager.prototype.addJsonPost = function(jsonObject)
{
	switch (this.id)
	{
		case SITE_DANBOORU:
			this.addPostDanbooru(jsonObject);
			break;
		case SITE_E621:
			this.addPostE621(jsonObject);
			break;
	}
}

SiteManager.prototype.addPostGelRuleSafe = function(xmlPost)
{
	if (xmlPost.hasAttribute('file_url') &&
		xmlPost.hasAttribute('preview_url'))
	{
		var fileExtension = xmlPost.getAttribute('file_url').substring(xmlPost.getAttribute('file_url').length - 4);
		
		if (fileExtension != '.zip' && // No zip files!
			fileExtension != '.swf' && // No flash files!
			fileExtension != 'webm') // No video files!
		{
			var newPost = new Post(
				xmlPost.getAttribute('id'),
				xmlPost.getAttribute('file_url'),
				xmlPost.getAttribute('preview_url'),
				this.url + '/index.php?page=post&s=view&id=' + xmlPost.getAttribute('id'),
				xmlPost.getAttribute('width'),
				xmlPost.getAttribute('height'),
				new Date(xmlPost.getAttribute('created_at'))
			);
			this.allPosts.push(newPost);
		}
	}
}

/*SiteManager.prototype.addPostGelbooru = function(xmlPost)
{
	if (xmlPost.hasAttribute('file_url') &&
		xmlPost.hasAttribute('preview_url'))
	{
		var fileExtension = xmlPost.getAttribute('file_url').substring(xmlPost.getAttribute('file_url').length - 4);
	
		if (fileExtension != '.zip' && // No zip files!
			fileExtension != '.swf' && // No flash files!
			fileExtension != 'webm') // No video files!
		{
			var newPost = new Post(
				xmlPost.getAttribute('id'),
				xmlPost.getAttribute('file_url'),
				xmlPost.getAttribute('preview_url'),
				this.url + '/index.php?page=post&s=view&id=' + xmlPost.getAttribute('id'),
				xmlPost.getAttribute('width'),
				xmlPost.getAttribute('height'),
				new Date(xmlPost.getAttribute('created_at'))
			);
			this.allPosts.push(newPost);
		}
	}
}*/

SiteManager.prototype.addPostDanbooru = function(jsonObject)
{
	if (jsonObject.hasOwnProperty('file_url') &&
		jsonObject.hasOwnProperty('preview_file_url'))
	{
		var fileExtension = jsonObject.file_url.substring(jsonObject.file_url.length - 4);
		
		// Filter out results that don't display as images
		if (fileExtension != '.zip' && // No zip files!
			fileExtension != '.swf' && // No flash files!
			fileExtension != 'webm') // No video files!
		{
			var newPost = new Post(
				jsonObject.id,
				this.url + jsonObject.file_url,
				this.url + jsonObject.preview_file_url,
				this.url + '/posts/' + jsonObject.id,
				jsonObject.image_width,
				jsonObject.image_height,
				new Date(jsonObject.created_at)
			);
			this.allPosts.push(newPost);
		}
	}
}

SiteManager.prototype.addPostE621 = function(jsonObject)
{
	if (jsonObject.hasOwnProperty('file_url') &&
		jsonObject.hasOwnProperty('preview_url'))
	{
		var fileExtension = jsonObject.file_url.substring(jsonObject.file_url.length - 4);
		
		// Filter out results that don't display as images
		if (fileExtension != '.zip' && // No zip files
			fileExtension != '.swf' && // No flash files
			fileExtension != 'webm') // No video files
		{
			var newPost = new Post(
				jsonObject.id,
				jsonObject.file_url,
				jsonObject.preview_url,
				this.url + '/post/show/' + jsonObject.id,
				jsonObject.width,
				jsonObject.height,
				convertSDateToDate(jsonObject.created_at.s)
			);
			this.allPosts.push(newPost);
			
			//displayLink(newPost.id, newPost.fileUrl, newPost.previewFileUrl);
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





function convertSDateToDate(sDate)
{
	return date = new Date(sDate * 1000);
}