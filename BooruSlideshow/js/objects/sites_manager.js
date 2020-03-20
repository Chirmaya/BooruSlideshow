class SitesManager{
	constructor(model, numberOfSlidesToAlwaysHaveReadyToDisplay, maxNumberOfThumbnails)
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

	displayWarningMessage(message)
	{
		console.log(message);
		if (this.model.view != null)
		{
			this.model.view.displayWarningMessage(message);
		}
	}

	displayInfoMessage(message)
	{
		if (this.model.view != null)
		{
			this.model.view.displayInfoMessage(message);
		}
	}

	clearInfoMessage()
	{
		if (this.model.view != null)
		{
			this.model.view.clearInfoMessage();
		}
	}

	setupRequestHeaders()
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

	addSite(id, pageLimit)
	{
		let siteManager = SiteManagerFactory.createSiteManager(this, id, pageLimit);
		this.siteManagers.push(siteManager);
	}

	enableSites(sites)
	{
		for (var i = 0; i < sites.length; i++)
		{
			var site = sites[i];
			
			this.enableSite(site);
		}
	}

	enableSite(site)
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

	getCountOfActiveSiteManagers()
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

	getCountOfActiveSiteManagersThatHaventExhaustedSearches()
	{
		var count = 0;
		
		for (var i = 0; i < this.siteManagers.length; i++)
		{
			var siteManager = this.siteManagers[i];
			
			if (siteManager.isOnline && siteManager.hasntExhaustedSearch())
			{
				count++;
			}
		}
		
		return count;
	}

	resetConnections()
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
	
	pingSites(callback)
	{
		for (var i = 0; i < this.siteManagers.length; i++)
		{
			var siteManager = this.siteManagers[i];
			
			siteManager.pingStatus(callback);
		}
	}

	performSearch(searchText, doneSearchingAllSitesCallback)
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

	performSearchUntilWeHaveEnoughSlides(doneSearchingAllSitesCallback)
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

	searchSites(doneSearchingSitesCallback)
	{
		this.siteManagersCurrentlySearching = this.getCountOfActiveSiteManagersThatHaventExhaustedSearches();
		
		for (var i = 0; i < this.siteManagers.length; i++)
		{
			var siteManager = this.siteManagers[i];
			
			if (siteManager.isOnline && siteManager.hasntExhaustedSearch())
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

	buildSortedSlideList()
	{
		var slidesFromAllSitesToSort = [];
		var md5Hashes = [];
		
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

		slidesFromAllSitesToSort = slidesFromAllSitesToSort.filter(function(slide){
			if (slide.md5 === null)
				return true; //Err on the side of inclusion.
			
			if (_this.model.view.getIncludeDupes())
			{
				return true;
			}
			else
			{
				if(md5Hashes.includes(slide.md5))
				{
					return false;
				}
				else
				{
					md5Hashes.push(slide.md5);
					return true;
				}
			}
		});

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

	getSortingMethod()
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

	doMoreSlidesNeedToBeLoaded()
	{
		if (!this.areThereMoreLoadableSlides())
		{
			return false;
		}
		
		var numberOfLoadedSlidesLeftToDisplay = this.getTotalSlideNumber() - this.currentSlideNumber;
		
		var moreSlidesNeedToBeLoaded = (this.numberOfSlidesToAlwaysHaveReadyToDisplay > numberOfLoadedSlidesLeftToDisplay);
		
		return moreSlidesNeedToBeLoaded;
	}

	getTotalSlideNumber()
	{
		return this.allSortedSlides.length;
	}

	moveToFirstSlide()
	{
		this.setCurrentSlideNumber(1);
	}

	moveToLastSlide(callbackForAfterPossiblyLoadingMoreSlides)
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

	increaseCurrentSlideNumber(callbackForAfterPossiblyLoadingMoreSlides)
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

	increaseCurrentSlideNumberByTen(callbackForAfterPossiblyLoadingMoreSlides)
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

	decreaseCurrentSlideNumber()
	{
		if (this.canDecreaseCurrentSlideNumber())
		{
			this.setCurrentSlideNumber(this.currentSlideNumber - 1);
		}
	}

	canDecreaseCurrentSlideNumber()
	{
		return (this.currentSlideNumber > 1);
	}

	decreaseCurrentSlideNumberByTen()
	{
		if (this.currentSlideNumber > 1)
		{
			var newSlideNumber = Math.max(this.currentSlideNumber - 10, 1);
			this.setCurrentSlideNumber(newSlideNumber);
		}
	}

	moveToThumbnailSlide(thumbnailSlideId)
	{
		var thumbnailSlides = this.getNextSlidesForThumbnails();

		if (thumbnailSlides == null)
			return;
		
		for (var i = 0; i < thumbnailSlides.length; i++)
		{
			var thumbnailSlide = thumbnailSlides[i];
			
			if (thumbnailSlide.id == thumbnailSlideId)
			{
				var slideNumber = this.currentSlideNumber + i + 1;
				
				this.setCurrentSlideNumber(slideNumber);
				
				return true;
			}
		}
		
		return false;
	}

	setCurrentSlideNumber(newCurrentSlideNumber)
	{
		this.clearCallbacksForPreloadingSlides();
		this.currentSlideNumber = newCurrentSlideNumber;
		this.preloadCurrentSlideIfNeeded();
		this.preloadNextSlideIfNeeded();
	}

	clearCallbacksForPreloadingSlides()
	{
		if (this.currentSlideNumber > 0)
		{
			var currentSlide = this.getCurrentSlide();

			if (currentSlide == null)
            	return;

			currentSlide.clearCallback();
		}
	}

	clearCallbacksForLoadingSlides()
	{
		this.callbackToRunAfterAllSitesFinishedSearching = null;
	}

	runCodeWhenCurrentSlideFinishesLoading(callback)
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

	runCodeWhenFinishGettingMoreSlides(callback)
	{
		this.callbackToRunAfterAllSitesFinishedSearching = callback
	}

	getCurrentSlide()
	{
		if (this.currentSlideNumber <= 0)
			return null;
		
		return this.allSortedSlides[this.currentSlideNumber - 1];
	}

	getNextSlidesForThumbnails()
	{
		if (this.currentSlideNumber <= 0)
			return null;
		
		return this.allSortedSlides.slice(this.currentSlideNumber, this.currentSlideNumber + this.maxNumberOfThumbnails);
	}

	areThereMoreLoadableSlides()
	{
		for (var i = 0; i < this.siteManagers.length; i++)
		{
			var siteManager = this.siteManagers[i];
			
			if (siteManager.isOnline && siteManager.hasntExhaustedSearch())
			{
				return true;
			}
		}
		
		return false;
	}

	preloadCurrentSlideIfNeeded()
	{
		var currentSlide = this.allSortedSlides[this.currentSlideNumber - 1];
		
		currentSlide.preload();
	}

	preloadNextSlideIfNeeded()
	{
		if (this.currentSlideNumber < this.getTotalSlideNumber())
		{
			this.preloadNextUnpreloadedSlideIfInRange();
		}
	}

	preloadNextUnpreloadedSlideIfInRange()
	{
		if (this.currentSlideNumber >= this.getTotalSlideNumber())
			return;
		
		var nextSlides = this.getNextSlidesForThumbnails();

		if (nextSlides == null)
			return;
		
		for (var i = 0; i < nextSlides.length; i++)
		{
			if (!nextSlides[i])
				return;
			
			var slide = nextSlides[i];
			
			if (!slide.isPreloaded)
			{
				slide.preload();
				break;
			}
		}
	}

	preloadNextUnpreloadedSlideAfterThisOneIfInRange(startingSlide)
	{
		if (this.currentSlideNumber >= this.getTotalSlideNumber())
			return;
		
		var nextSlides = this.getNextSlidesForThumbnails();

		if (nextSlides == null)
			return;
		
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

	isCurrentSlideLoaded()
	{
		let currentSlide = this.getCurrentSlide();

		if (currentSlide == null)
		{
			return false;
		}

		return currentSlide.isPreloaded;
	}

	hasAtLeastOneOnlineSiteSelected()
	{
		for (var i = 0; i < this.siteManagers.length; i++)
		{
			var siteManager = this.siteManagers[i];
			
			if (siteManager.isEnabled && siteManager.isOnline)
				return true;
		}

		return false;
	}
}