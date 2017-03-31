var SitesManager = function (model, numberOfImagesToAlwaysHaveReadyToDisplay, maxNumberOfThumbnails)
{
	this.model = model;
	this.numberOfImagesToAlwaysHaveReadyToDisplay = numberOfImagesToAlwaysHaveReadyToDisplay;
	this.maxNumberOfThumbnails = maxNumberOfThumbnails;
	this.siteManagers = [];
	this.siteManagersCurrentlySearching = 0;
	this.currentImageNumber = 0;
	this.allSortedPosts = [];
	this.searchText = '';
	this.isTryingToLoadMoreImages = false;
	this.callbackToRunAfterAllSitesFinishedSearching = null;
	
	this.sortingTypeDateDesc = 'order:id_desc';
	this.sortingTypeDateAsc = 'order:id_asc';
	this.sortingTypeScoreDesc = 'order:score_desc';
	this.sortingTypeScoreAsc = 'order:score_asc';
	
	this.sortingQueryTerms = {};
	this.sortingQueryTerms["(?:order|sort):(?:id|id_asc)\\b"] = this.sortingTypeDateAsc;
	this.sortingQueryTerms["(?:order|sort):id_desc\\b"] = this.sortingTypeDateDesc;
	this.sortingQueryTerms["(?:order|sort):(?:score|score_desc)\\b"] = this.sortingTypeScoreDesc;
	this.sortingQueryTerms["(?:order|sort):score_asc\\b"] = this.sortingTypeScoreAsc;
	
	this.setupRequestHeaders();
}

SitesManager.prototype.displayWarningMessage = function(message)
{
	if (this.model.view != null)
	{
		this.model.view.displayWarningMessage(message);
	}
}

SitesManager.prototype.displayInfoMessage = function(message)
{
	if (this.model.view != null)
	{
		this.model.view.displayInfoMessage(message);
	}
}

SitesManager.prototype.clearInfoMessage = function()
{
	if (this.model.view != null)
	{
		this.model.view.clearInfoMessage();
	}
}

SitesManager.prototype.setupRequestHeaders = function()
{
	// Only needed for Gelbooru at the moment
	var listener = function(details) {
		details.requestHeaders.push({
			'name': 'Referer',
			'value': 'https://gelbooru.com'
		});
		return {requestHeaders: details.requestHeaders};
	};
	
	var requestFilter = {
		urls: [
			"https://*.gelbooru.com/*"
		],
		types: ["image"]
	};
	
	var extraInfoSpec = [
		"blocking",
		"requestHeaders"
	];
	
	chrome.webRequest.onBeforeSendHeaders.addListener(
		listener,
		requestFilter,
		extraInfoSpec
	);
}

SitesManager.prototype.addSite = function(id, url, pageLimit)
{
	this.siteManagers.push(new SiteManager(this, id, url, pageLimit));
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
	this.searchText = '';
	this.isTryingToLoadMoreImages = false;
	this.callbackToRunAfterAllSitesFinishedSearching = null;
}

SitesManager.prototype.performSearch = function(searchText, doneSearchingAllSitesCallback)
{
	this.searchText = searchText;
	
	var sitesManager = this;
	
	this.performSearchUntilWeHaveEnoughPosts(function () {
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
			
			siteManager.performSearch(this.searchText, function() {
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
	var postsFromAllSitesToSort = [];
	
	for (var i = 0; i < this.siteManagers.length; i++)
	{
		var siteManager = this.siteManagers[i];
		
		if (siteManager.isEnabled)
		{
			Array.prototype.push.apply(postsFromAllSitesToSort, siteManager.allUnsortedPosts);
			siteManager.allUnsortedPosts = [];
		}
	}
	
	var _this = this;
	
	postsFromAllSitesToSort.sort(function(a,b) {
		var sortingMethod = _this.getSortingMethod();
		
		switch (sortingMethod)
		{
			case _this.sortingTypeDateDesc:
				return b.date.getTime() - a.date.getTime();
			case _this.sortingTypeDateAsc:
				return a.date.getTime() - b.date.getTime();
			case _this.sortingTypeScoreDesc:
				return b.score - a.score;
			case _this.sortingTypeScoreAsc:
				return a.score - b.score;
			default:
				console.log('Sort error. Sorting method not in the list: ' + sortingMethod);
		}
		
		return b.date.getTime() - a.date.getTime();
	});
	
	Array.prototype.push.apply(this.allSortedPosts, postsFromAllSitesToSort);
}

SitesManager.prototype.getSortingMethod = function()
{
	for (var sortingQueryTerm in this.sortingQueryTerms)
	{
		var sortingQueryTermRegex = new RegExp(sortingQueryTerm, 'i');
		
		var matches = this.searchText.match(sortingQueryTermRegex);
		
		if (matches != null)
		{
			var sortingType = this.sortingQueryTerms[sortingQueryTerm];
			
			return sortingType;
		}
	}
	
	return this.sortingTypeDateDesc;
}

/*SitesManager.prototype.getNumberOfSortedPosts = function()
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
}*/

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
	
	this.isTryingToLoadMoreImages = true;
	
	var sitesManager = this;
	
	this.performSearchUntilWeHaveEnoughPosts(function() {
		callbackForAfterPossiblyLoadingMoreImages.call(sitesManager);
		
		this.isTryingToLoadMoreImages = false;
		
		if (this.callbackToRunAfterAllSitesFinishedSearching != null)
		{
			this.callbackToRunAfterAllSitesFinishedSearching.call(sitesManager);
			this.callbackToRunAfterAllSitesFinishedSearching = null;
		}
		
		this.preloadNextImageIfNeeded();
	});
}

SitesManager.prototype.increaseCurrentImageNumber = function(callbackForAfterPossiblyLoadingMoreImages)
{
	if (this.currentImageNumber < this.getTotalImageNumber())
	{
		this.setCurrentImageNumber(this.currentImageNumber + 1);
		
		var sitesManager = this;
		
		this.performSearchUntilWeHaveEnoughPosts(function() {
			callbackForAfterPossiblyLoadingMoreImages.call(sitesManager);
			
			this.preloadNextImageIfNeeded();
		});
	}
}

SitesManager.prototype.decreaseCurrentImageNumber = function()
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

SitesManager.prototype.isNextImagePreloaded = function(imageId)
{
	var nextPosts = this.getNextPostsForThumbnails();
	
	for (var i = 0; i <= nextPosts.length; i++)
	{
		var nextPost = nextPosts[i];
		
		if (nextPost.id == imageId)
		{
			return nextPost.isPreloaded;
		}
	}
	
	return false;
}

SitesManager.prototype.tryToMoveToPreloadedImage = function(imageId)
{
	var nextPosts = this.getNextPostsForThumbnails();
	
	for (var i = 0; i < nextPosts.length; i++)
	{
		var nextPost = nextPosts[i];
		
		if (nextPost.id == imageId)
		{
			if (nextPost.isPreloaded)
			{
				var imageNumber = this.currentImageNumber + i + 1;
				
				this.setCurrentImageNumber(imageNumber);
				
				return true;
			}
		}
	}
	
	return false;
}

SitesManager.prototype.moveToImage = function(imageId)
{
	var nextPosts = this.getNextPostsForThumbnails();
	
	for (var i = 0; i < nextPosts.length; i++)
	{
		var nextPost = nextPosts[i];
		
		if (nextPost.id == imageId)
		{
			var imageNumber = this.currentImageNumber + i + 1;
			
			this.setCurrentImageNumber(imageNumber);
			
			return true;
		}
	}
	
	return false;
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
		currentPost.clearCallback();
	}
}

SitesManager.prototype.clearCallbacksForLoadingImages = function()
{
	this.callbackToRunAfterAllSitesFinishedSearching = null;
}

SitesManager.prototype.runCodeWhenCurrentImageFinishesLoading = function(callback)
{
	var currentPost = this.getCurrentPost();
	var sitesManager = this;
	
	currentPost.addCallback(function(){
		if (currentPost == sitesManager.getCurrentPost())
		{
			callback.call();
		}
	});
}

SitesManager.prototype.runCodeWhenFinishGettingMoreImages = function(callback)
{
	this.callbackToRunAfterAllSitesFinishedSearching = callback
}

SitesManager.prototype.getCurrentPost = function()
{
	if (this.currentImageNumber > 0)
	{
		return this.allSortedPosts[this.currentImageNumber - 1];
	}
}

SitesManager.prototype.getNextPostsForThumbnails = function()
{
	if (this.currentImageNumber > 0)
	{
	    return this.allSortedPosts.slice(this.currentImageNumber, this.currentImageNumber + this.maxNumberOfThumbnails);
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
		var currentPost = this.getCurrentPost();
		this.preloadNextUnpreloadedImageIfInRange();
	}
}

SitesManager.prototype.preloadNextUnpreloadedImageIfInRange = function()
{
	if (this.currentImageNumber < this.getTotalImageNumber())
	{
		var nextPosts = this.getNextPostsForThumbnails();
		
		for (var i = 0; i < nextPosts.length; i++)
		{
			var post = nextPosts[i];
			
			if (!post.isPreloaded)
			{
				post.preload();
				break;
			}
		}
	}
}

SitesManager.prototype.preloadNextUnpreloadedImageAfterThisOneIfInRange = function(startingPost)
{
	if (this.currentImageNumber < this.getTotalImageNumber())
	{
		var nextPosts = this.getNextPostsForThumbnails();
		var foundStartingPost = false;
		
		for (var i = 0; i < nextPosts.length; i++)
		{
			var post = nextPosts[i];
			
			if (foundStartingPost)
			{
				if (!post.isPreloaded)
				{
					post.preload();
					break;
				}
			}
			
			if (startingPost == post)
			{
				foundStartingPost = true;
			}
		}
	}
}

SitesManager.prototype.isCurrentImageLoaded = function()
{
	if (this.currentImageNumber > 0)
	{
		return this.getCurrentPost().isPreloaded;
	}
}