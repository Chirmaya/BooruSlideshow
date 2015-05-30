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
		sitesManager.setCurrentImageNumberToFirst();
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

SitesManager.prototype.setCurrentImageNumberToFirst = function()
{
	this.currentImageNumber = 1;
}

SitesManager.prototype.setCurrentImageNumberToLast = function(callbackForAfterPossiblyLoadingMoreImages)
{
	this.currentImageNumber = this.getTotalImageNumber();
	
	var sitesManager = this;
	
	this.performSearchUntilWeHaveEnoughPosts(function() {
		callbackForAfterPossiblyLoadingMoreImages.call(sitesManager);
	});
}

SitesManager.prototype.increaseCurrentImageNumber = function(callbackForAfterPossiblyLoadingMoreImages)
{
	if (this.currentImageNumber <= this.getTotalImageNumber())
	{
		this.currentImageNumber++;
		
		var sitesManager = this;
		
		this.performSearchUntilWeHaveEnoughPosts(function() {
			callbackForAfterPossiblyLoadingMoreImages.call(sitesManager);
		});
	}
}

SitesManager.prototype.decreaseCurrentImageNumber = function()
{
	if (this.currentImageNumber > 1)
		this.currentImageNumber--;
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
		var jsonText = siteManager.xhr.responseText;
		siteManager.addPosts(jsonText);
		
		displayDebugText(siteManager.id + ' total image number =  ' + siteManager.getTotalImageNumber());
		
		doneSearchingSiteCallback.call(siteManager);
	};
	
	this.xhr.onerror = function() {
		displayDebugText('Error making the request.');
		displayWarningMessage('Error making the request to the website');
	};
	
	this.xhr.send();
}

SiteManager.prototype.addPosts = function(jsonText)
{
	var json = JSON.parse(jsonText);
	displayDebugText('site ' + this.id + ' has ' + json.length + ' json objects');
	this.hasExhaustedSearch = (json.length < this.pageLimit);
	
	for (var i = 0; i < json.length; i++)
	{
		var jsonObject = json[i];
		
		this.addPost(jsonObject);
	}
	
	/*if (this.hasExhaustedSearch && totalImageNumber() == 0)
	{
		displayWarningMessage('No images were found');
	}*/
}

SiteManager.prototype.addPost = function(jsonObject)
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

SiteManager.prototype.addPostDanbooru = function(jsonObject)
{
	// Filter out results that don't display as images
	if (jsonObject.hasOwnProperty('file_url') &&
		//jsonObject.hasOwnProperty('large_file_url') &&
		jsonObject.hasOwnProperty('preview_file_url') &&
		jsonObject.file_url.substring(jsonObject.file_url.length - 3) != 'zip') // No .zip files!
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
		
		//displayLink(newPost.id, newPost.fileUrl, newPost.previewFileUrl);
	}
}

SiteManager.prototype.addPostE621 = function(jsonObject)
{
	var fileExtension = jsonObject.file_url.substring(jsonObject.file_url.length - 4);
	
	// Filter out results that don't display as images
	if (jsonObject.hasOwnProperty('file_url') &&
		jsonObject.hasOwnProperty('preview_url') &&
		fileExtension != '.zip' && // No zip files
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