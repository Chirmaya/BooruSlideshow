function SitesManager(model, numberOfSlidesToAlwaysHaveReadyToDisplay, maxNumberOfThumbnails)
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
	
	// Doesn't seem that this is needed right now.
	// Investigate later.
	this.setupRequestHeaders();
}

SitesManager.prototype = {
	displayWarningMessage: function(message)
	{
		if (this.model.view != null)
		{
			this.model.view.displayWarningMessage(message);
		}
	},

	displayInfoMessage: function(message)
	{
		if (this.model.view != null)
		{
			this.model.view.displayInfoMessage(message);
		}
	},

	clearInfoMessage: function()
	{
		if (this.model.view != null)
		{
			this.model.view.clearInfoMessage();
		}
	},

	setupRequestHeaders: function()
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
	},

	addSite: function(id, url, pageLimit)
	{
		this.siteManagers.push(new SiteManager(this, id, url, pageLimit));
	},

	enableSites: function(sites)
	{
		for (var i = 0; i < sites.length; i++)
		{
			var site = sites[i];
			
			this.enableSite(site);
		}
	},

	enableSite: function(site)
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
	},

	getCountOfActiveSiteManagers: function()
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
	},

	getCountOfActiveSiteManagersThatHaventExhaustedSearches: function()
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
	},

	resetConnections: function()
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
	},

	performSearch: function(searchText, doneSearchingAllSitesCallback)
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
	},

	performSearchUntilWeHaveEnoughSlides: function(doneSearchingAllSitesCallback)
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
	},

	searchSites: function(doneSearchingSitesCallback)
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
	},

	buildSortedSlideList: function()
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
	},

	getSortingMethod: function()
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
	},

	doMoreSlidesNeedToBeLoaded: function()
	{
		if (!this.areThereMoreLoadableSlides())
		{
			return false;
		}
		
		var numberOfLoadedSlidesLeftToDisplay = this.getTotalSlideNumber() - this.currentSlideNumber;
		
		var moreSlidesNeedToBeLoaded = (this.numberOfSlidesToAlwaysHaveReadyToDisplay > numberOfLoadedSlidesLeftToDisplay);
		
		return moreSlidesNeedToBeLoaded;
	},

	getTotalSlideNumber: function()
	{
		return this.allSortedSlides.length;
	},

	moveToFirstSlide: function()
	{
		this.setCurrentSlideNumber(1);
	},

	moveToLastSlide: function(callbackForAfterPossiblyLoadingMoreSlides)
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
	},

	increaseCurrentSlideNumber: function(callbackForAfterPossiblyLoadingMoreSlides)
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
	},

	increaseCurrentSlideNumberByTen: function(callbackForAfterPossiblyLoadingMoreSlides)
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
	},

	decreaseCurrentSlideNumber: function()
	{
		if (this.currentSlideNumber > 1)
		{
			this.setCurrentSlideNumber(this.currentSlideNumber - 1);
		}
	},

	decreaseCurrentSlideNumberByTen: function()
	{
		if (this.currentSlideNumber > 1)
		{
			var newSlideNumber = Math.max(this.currentSlideNumber - 10, 1);
			this.setCurrentSlideNumber(newSlideNumber);
		}
	},

	moveToSpecificSlide: function(specificSlideNumber)
	{
		if (specificSlideNumber > 0 && specificSlideNumber <= this.getTotalSlideNumber())
		{
			this.setCurrentSlideNumber(specificSlideNumber);
		}
	},

	isNextSlidePreloaded: function(slideId)
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
	},

	tryToMoveToPreloadedSlide: function(slideId)
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
	},

	moveToSlide: function(slideId)
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
	},

	setCurrentSlideNumber: function(newCurrentSlideNumber)
	{
		this.clearCallbacksForPreloadingSlides();
		this.currentSlideNumber = newCurrentSlideNumber;
		this.preloadCurrentSlideIfNeeded();
		this.preloadNextSlideIfNeeded();
	},

	clearCallbacksForPreloadingSlides: function()
	{
		if (this.currentSlideNumber > 0)
		{
			var currentSlide = this.getCurrentSlide();
			currentSlide.clearCallback();
		}
	},

	clearCallbacksForLoadingSlides: function()
	{
		this.callbackToRunAfterAllSitesFinishedSearching = null;
	},

	runCodeWhenCurrentSlideFinishesLoading: function(callback)
	{
		var currentSlide = this.getCurrentSlide();
		var sitesManager = this;
		
		currentSlide.addCallback(function(){
			if (currentSlide == sitesManager.getCurrentSlide())
			{
				callback.call();
			}
		});
	},

	runCodeWhenFinishGettingMoreSlides: function(callback)
	{
		this.callbackToRunAfterAllSitesFinishedSearching = callback
	},

	getCurrentSlide: function()
	{
		if (this.currentSlideNumber > 0)
		{
			return this.allSortedSlides[this.currentSlideNumber - 1];
		}
	},

	getNextSlidesForThumbnails: function()
	{
		if (this.currentSlideNumber > 0)
		{
			return this.allSortedSlides.slice(this.currentSlideNumber, this.currentSlideNumber + this.maxNumberOfThumbnails);
		}
	},

	areThereMoreLoadableSlides: function()
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
	},

	preloadCurrentSlideIfNeeded: function()
	{
		var currentSlide = this.allSortedSlides[this.currentSlideNumber - 1];
		
		currentSlide.preload();
	},

	preloadNextSlideIfNeeded: function()
	{
		if (this.currentSlideNumber < this.getTotalSlideNumber())
		{
			var currentSlide = this.getCurrentSlide();
			this.preloadNextUnpreloadedSlideIfInRange();
		}
	},

	preloadNextUnpreloadedSlideIfInRange: function()
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
	},

	preloadNextUnpreloadedSlideAfterThisOneIfInRange: function(startingSlide)
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
	},

	isCurrentSlideLoaded: function()
	{
		if (this.currentSlideNumber > 0)
		{
			return this.getCurrentSlide().isPreloaded;
		}
	}
}