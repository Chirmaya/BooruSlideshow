var SitesManager = function (model, numberOfSlidesToAlwaysHaveReadyToDisplay, maxNumberOfThumbnails)
{
	this.model = model;
	this.numberOfSlidesToAlwaysHaveReadyToDisplay = numberOfSlidesToAlwaysHaveReadyToDisplay;
	this.maxNumberOfThumbnails = maxNumberOfThumbnails;
	this.siteManagers = [];
	this.siteManagersCurrentlySearching = 0;
	this.currentSlideNumber = 0;
	this.allSortedSlides = [];
	this.searchText = '';
	this.isTryingToLoadMoreSlides = false;
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
		types: ["image", "other"]//object?
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
	this.currentSlideNumber = 0;
	this.allSortedSlides = [];
	this.searchText = '';
	this.isTryingToLoadMoreSlides = false;
	this.callbackToRunAfterAllSitesFinishedSearching = null;
}

SitesManager.prototype.performSearch = function(searchText, doneSearchingAllSitesCallback)
{
	this.searchText = searchText;
	
	var sitesManager = this;
	
	this.performSearchUntilWeHaveEnoughSlides(function () {
		if (this.allSortedSlides.length > 0)
		{
			sitesManager.setCurrentSlideNumber(1);
		}
		
		doneSearchingAllSitesCallback.call(sitesManager);
	});
}

SitesManager.prototype.performSearchUntilWeHaveEnoughSlides = function(doneSearchingAllSitesCallback)
{
	if (this.doMoreSlidesNeedToBeLoaded())
	{
		var sitesManager = this;
		this.searchSites(function() {
			sitesManager.performSearchUntilWeHaveEnoughSlides(doneSearchingAllSitesCallback);
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
					sitesManager.buildSortedSlideList();
					doneSearchingSitesCallback.call(sitesManager);
				}
			});
		}
	}
}

SitesManager.prototype.buildSortedSlideList = function()
{
	var slidesFromAllSitesToSort = [];
	
	for (var i = 0; i < this.siteManagers.length; i++)
	{
		var siteManager = this.siteManagers[i];
		
		if (siteManager.isEnabled)
		{
			Array.prototype.push.apply(slidesFromAllSitesToSort, siteManager.allUnsortedSlides);
			siteManager.allUnsortedSlides = [];
		}
	}
	
	var _this = this;
	
	slidesFromAllSitesToSort.sort(function(a,b) {
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
	
	Array.prototype.push.apply(this.allSortedSlides, slidesFromAllSitesToSort);
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

SitesManager.prototype.doMoreSlidesNeedToBeLoaded = function()
{
	if (!this.areThereMoreLoadableSlides())
	{
		return false;
	}
	
	var numberOfLoadedSlidesLeftToDisplay = this.getTotalSlideNumber() - this.currentSlideNumber;
	
	var moreSlidesNeedToBeLoaded = (this.numberOfSlidesToAlwaysHaveReadyToDisplay > numberOfLoadedSlidesLeftToDisplay);
	
	return moreSlidesNeedToBeLoaded;
}

SitesManager.prototype.getTotalSlideNumber = function()
{
	return this.allSortedSlides.length;
}

SitesManager.prototype.moveToFirstSlide = function()
{
	this.setCurrentSlideNumber(1);
}

SitesManager.prototype.moveToLastSlide = function(callbackForAfterPossiblyLoadingMoreSlides)
{
	var totalSlideNumber = this.getTotalSlideNumber();
	this.setCurrentSlideNumber(totalSlideNumber);
	
	this.isTryingToLoadMoreSlides = true;
	
	var sitesManager = this;
	
	this.performSearchUntilWeHaveEnoughSlides(function() {
		callbackForAfterPossiblyLoadingMoreSlides.call(sitesManager);
		
		this.isTryingToLoadMoreSlides = false;
		
		if (this.callbackToRunAfterAllSitesFinishedSearching != null)
		{
			this.callbackToRunAfterAllSitesFinishedSearching.call(sitesManager);
			this.callbackToRunAfterAllSitesFinishedSearching = null;
		}
		
		this.preloadNextSlideIfNeeded();
	});
}

SitesManager.prototype.increaseCurrentSlideNumber = function(callbackForAfterPossiblyLoadingMoreSlides)
{
	if (this.currentSlideNumber < this.getTotalSlideNumber())
	{
		this.setCurrentSlideNumber(this.currentSlideNumber + 1);
		
		var sitesManager = this;
		
		this.performSearchUntilWeHaveEnoughSlides(function() {
			callbackForAfterPossiblyLoadingMoreSlides.call(sitesManager);
			
			this.preloadNextSlideIfNeeded();
		});
	}
}

SitesManager.prototype.increaseCurrentSlideNumberByTen = function(callbackForAfterPossiblyLoadingMoreSlides)
{
	if (this.currentSlideNumber < this.getTotalSlideNumber())
	{
		var newSlideNumber = Math.min(this.currentSlideNumber + 10, this.getTotalSlideNumber())
		this.setCurrentSlideNumber(newSlideNumber);
		
		var sitesManager = this;
		
		this.performSearchUntilWeHaveEnoughSlides(function() {
			callbackForAfterPossiblyLoadingMoreSlides.call(sitesManager);
			
			this.preloadNextSlideIfNeeded();
		});
	}
}

SitesManager.prototype.decreaseCurrentSlideNumber = function()
{
	if (this.currentSlideNumber > 1)
	{
		this.setCurrentSlideNumber(this.currentSlideNumber - 1);
	}
}

SitesManager.prototype.decreaseCurrentSlideNumberByTen = function()
{
	if (this.currentSlideNumber > 1)
	{
		var newSlideNumber = Math.max(this.currentSlideNumber - 10, 1);
		this.setCurrentSlideNumber(newSlideNumber);
	}
}

SitesManager.prototype.moveToSpecificSlide = function(specificSlideNumber)
{
	if (specificSlideNumber > 0 && specificSlideNumber <= this.getTotalSlideNumber())
	{
		this.setCurrentSlideNumber(specificSlideNumber);
	}
}

SitesManager.prototype.isNextSlidePreloaded = function(slideId)
{
	var nextSlides = this.getNextSlidesForThumbnails();
	
	for (var i = 0; i <= nextSlides.length; i++)
	{
		var nextSlide = nextSlides[i];
		
		if (nextSlide.id == slideId)
		{
			return nextSlide.isPreloaded;
		}
	}
	
	return false;
}

SitesManager.prototype.tryToMoveToPreloadedSlide = function(slideId)
{
	var nextSlides = this.getNextSlidesForThumbnails();
	
	for (var i = 0; i < nextSlides.length; i++)
	{
		var nextSlide = nextSlides[i];
		
		if (nextSlide.id == slideId)
		{
			if (nextSlide.isPreloaded)
			{
				var slideNumber = this.currentSlideNumber + i + 1;
				
				this.setCurrentSlideNumber(slideNumber);
				
				return true;
			}
		}
	}
	
	return false;
}

SitesManager.prototype.moveToSlide = function(slideId)
{
	var nextSlides = this.getNextSlidesForThumbnails();
	
	for (var i = 0; i < nextSlides.length; i++)
	{
		var nextSlide = nextSlides[i];
		
		if (nextSlide.id == slideId)
		{
			var slideNumber = this.currentSlideNumber + i + 1;
			
			this.setCurrentSlideNumber(slideNumber);
			
			return true;
		}
	}
	
	return false;
}

SitesManager.prototype.setCurrentSlideNumber = function(newCurrentSlideNumber)
{
	this.clearCallbacksForPreloadingSlides();
	this.currentSlideNumber = newCurrentSlideNumber;
	this.preloadCurrentSlideIfNeeded();
	this.preloadNextSlideIfNeeded();
}

SitesManager.prototype.clearCallbacksForPreloadingSlides = function()
{
	if (this.currentSlideNumber > 0)
	{
		var currentSlide = this.getCurrentSlide();
		currentSlide.clearCallback();
	}
}

SitesManager.prototype.clearCallbacksForLoadingSlides = function()
{
	this.callbackToRunAfterAllSitesFinishedSearching = null;
}

SitesManager.prototype.runCodeWhenCurrentSlideFinishesLoading = function(callback)
{
	var currentSlide = this.getCurrentSlide();
	var sitesManager = this;
	
	currentSlide.addCallback(function(){
		if (currentSlide == sitesManager.getCurrentSlide())
		{
			callback.call();
		}
	});
}

SitesManager.prototype.runCodeWhenFinishGettingMoreSlides = function(callback)
{
	this.callbackToRunAfterAllSitesFinishedSearching = callback
}

SitesManager.prototype.getCurrentSlide = function()
{
	if (this.currentSlideNumber > 0)
	{
		return this.allSortedSlides[this.currentSlideNumber - 1];
	}
}

SitesManager.prototype.getNextSlidesForThumbnails = function()
{
	if (this.currentSlideNumber > 0)
	{
	    return this.allSortedSlides.slice(this.currentSlideNumber, this.currentSlideNumber + this.maxNumberOfThumbnails);
	}
}

SitesManager.prototype.areThereMoreLoadableSlides = function()
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

SitesManager.prototype.preloadCurrentSlideIfNeeded = function()
{
	var currentSlide = this.allSortedSlides[this.currentSlideNumber - 1];
	
	currentSlide.preload();
}

SitesManager.prototype.preloadNextSlideIfNeeded = function()
{
	if (this.currentSlideNumber < this.getTotalSlideNumber())
	{
		var currentSlide = this.getCurrentSlide();
		this.preloadNextUnpreloadedSlideIfInRange();
	}
}

SitesManager.prototype.preloadNextUnpreloadedSlideIfInRange = function()
{
	if (this.currentSlideNumber < this.getTotalSlideNumber())
	{
		var nextSlides = this.getNextSlidesForThumbnails();
		
		for (var i = 0; i < nextSlides.length; i++)
		{
			var slide = nextSlides[i];
			
			if (!slide.isPreloaded)
			{
				slide.preload();
				break;
			}
		}
	}
}

SitesManager.prototype.preloadNextUnpreloadedSlideAfterThisOneIfInRange = function(startingSlide)
{
	if (this.currentSlideNumber < this.getTotalSlideNumber())
	{
		var nextSlides = this.getNextSlidesForThumbnails();
		var foundStartingSlide = false;
		
		for (var i = 0; i < nextSlides.length; i++)
		{
			var slide = nextSlides[i];
			
			if (foundStartingSlide)
			{
				if (!slide.isPreloaded)
				{
					slide.preload();
					break;
				}
			}
			
			if (startingSlide == slide)
			{
				foundStartingSlide = true;
			}
		}
	}
}

SitesManager.prototype.isCurrentSlideLoaded = function()
{
	if (this.currentSlideNumber > 0)
	{
		return this.getCurrentSlide().isPreloaded;
	}
}