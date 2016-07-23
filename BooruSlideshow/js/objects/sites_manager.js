var SitesManager = function (numberOfImagesToAlwaysHaveReadyToDisplay, maxNumberOfThumbnails)
{
	this.numberOfImagesToAlwaysHaveReadyToDisplay = numberOfImagesToAlwaysHaveReadyToDisplay;
	this.maxNumberOfThumbnails = maxNumberOfThumbnails;
	this.siteManagers = [];
	this.siteManagersCurrentlySearching = 0;
	this.currentImageNumber = 0;
	this.allPosts = [];
	this.allSortedPosts = [];
	this.numberOfPostsSorted = [];
	this.searchText = '';
	this.isTryingToLoadMoreImages = false;
	this.callbackToRunAfterAllSitesFinishedSearching = null;
	
	this.setupRequestHeaders();
}

SitesManager.prototype.setupRequestHeaders = function()
{
	// Only needed for Gelbooru at the moment
	var handler = function(details) {
		details.requestHeaders.push({
			'name': 'Referer',
			'value': 'http://gelbooru.com'
		});
		return {requestHeaders: details.requestHeaders};
	};
	
	var requestFilter = {
		urls: [
			"http://*.gelbooru.com/*"
		],
		types: ["image"]
	};
	
	var extraInfoSpec = [
		"blocking",
		"requestHeaders"
	];
	
	chrome.webRequest.onBeforeSendHeaders.addListener(
		handler,
		requestFilter,
		extraInfoSpec
	);
}

SitesManager.prototype.addSite = function(id, url, pageLimit)
{
	this.siteManagers.push(new SiteManager(id, url, pageLimit));
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
	this.numberOfPostsSorted = [];
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