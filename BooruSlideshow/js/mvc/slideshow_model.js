class SlideshowModel{
    constructor()
    {
        this.view = null;
        
        this.videoVolume = 0;
        this.videoMuted = false;
        
        this.searchText = "";
        
        this.sitesToSearch = {
            [SITE_DANBOORU]: false,
            [SITE_DERPIBOORU]: false,
            [SITE_E621]: false,
            [SITE_GELBOORU]: false,
            //[SITE_IBSEARCH]: false,
            [SITE_KONACHAN]: false,
            [SITE_REALBOORU]: false,
            [SITE_RULE34]: false,
            [SITE_SAFEBOORU]: true,
            [SITE_YANDERE]: false
        };

        this.secondsPerSlide = 6;
        this.maxWidth = null;
        this.maxHeight = null;
        this.autoFitSlide = false;
        this.includeImages = true;
        this.includeGifs = true;
        this.includeWebms = false;
        this.hideBlacklist = false;
        this.blacklist = '';
        this.derpibooruApiKey = '';

        this.isPlaying = false;
        this.timer = null;
        this.timerMs = 0;

        this.sitesManager = null;

        this.currentSlideChangedEvent = new Event(this);
        this.playingChangedEvent = new Event(this);
        this.videoVolumeUpdatedEvent = new Event(this);
        this.sitesToSearchUpdatedEvent = new Event(this);
        this.secondsPerSlideUpdatedEvent = new Event(this);
        this.maxWidthUpdatedEvent = new Event(this);
        this.maxHeightUpdatedEvent = new Event(this);
        this.autoFitSlideUpdatedEvent = new Event(this);
        this.includeImagesUpdatedEvent = new Event(this);
        this.includeGifsUpdatedEvent = new Event(this);
        this.includeWebmsUpdatedEvent = new Event(this);
        this.hideBlacklistUpdatedEvent = new Event(this);
        this.blacklistUpdatedEvent = new Event(this);
        this.derpibooruApiKeyUpdatedEvent = new Event(this);

        this.initialize();
    }

    initialize()
    {
        var numberOfSlidesToAlwaysHaveReadyToDisplay = 20;
        var maxNumberOfThumbnails = 10;

        this.sitesManager = new SitesManager(this, numberOfSlidesToAlwaysHaveReadyToDisplay, maxNumberOfThumbnails);
		
		var pageLimit = 100;
		
        this.sitesManager.addSite(SITE_DANBOORU, pageLimit);
        this.sitesManager.addSite(SITE_DERPIBOORU, 10);
        this.sitesManager.addSite(SITE_E621, pageLimit);
        this.sitesManager.addSite(SITE_GELBOORU, pageLimit);
        //this.sitesManager.addSite(SITE_IBSEARCH, pageLimit);
        this.sitesManager.addSite(SITE_KONACHAN, pageLimit);
        this.sitesManager.addSite(SITE_REALBOORU, pageLimit);
        this.sitesManager.addSite(SITE_RULE34, pageLimit);
        this.sitesManager.addSite(SITE_SAFEBOORU, pageLimit);
        this.sitesManager.addSite(SITE_YANDERE, pageLimit);
    }
	
    pingSites()
    {
		var _this = this;
		this.sitesManager.pingSites(function(siteManager){
			if (!siteManager.isOnline)
				_this.view.showSiteOffline(siteManager.id);
		});
	}

    performSearch(searchText)
    {
        this.sitesManager.resetConnections();

        var selectedSites = this.getSelectedSitesToSearch();
        this.sitesManager.enableSites(selectedSites);

        var _this = this;

        this.sitesManager.performSearch(searchText, function () {
			_this.view.clearInfoMessage();
            _this.currentSlideChangedEvent.notify();
        });
    }
	
    areSomeTagsAreBlacklisted(tags)
    {
		var postTags = tags.trim().split(" ");
		var blacklistTags = this.blacklist.trim().replace(/(\r\n|\n|\r)/gm," ").split(" ");
		
		if (postTags.length == 0 || blacklistTags.length == 0)
			return false;
		
		for (let blacklistTag of blacklistTags)
		{
			for (let postTag of postTags)
			{
				if (blacklistTag == postTag)
				{
					return true;
				}
			}
		}
		
		return false;
	}

    setSlideNumberToFirst()
    {
        this.sitesManager.moveToFirstSlide();
        this.currentSlideChangedEvent.notify();

        this.restartSlideshowIfOn();
    }

    decreaseCurrentSlideNumber()
    {
        if (!this.sitesManager.canDecreaseCurrentSlideNumber())
        {
            return;
        }

        this.sitesManager.decreaseCurrentSlideNumber();
        this.currentSlideChangedEvent.notify();

        this.restartSlideshowIfOn();
    }

    increaseCurrentSlideNumber()
    {
        var _this = this;

        this.sitesManager.increaseCurrentSlideNumber(function () {
            _this.currentSlideChangedEvent.notify();
        });

        this.restartSlideshowIfOn();
    }
	
    decreaseCurrentSlideNumberByTen()
    {
        if (!this.sitesManager.canDecreaseCurrentSlideNumber())
        {
            return;
        }
        
        this.sitesManager.decreaseCurrentSlideNumberByTen();
        this.currentSlideChangedEvent.notify();

        this.restartSlideshowIfOn();
    }
	
    increaseCurrentSlideNumberByTen()
    {
        var _this = this;

        this.sitesManager.increaseCurrentSlideNumberByTen(function () {
            _this.currentSlideChangedEvent.notify();
        });

        this.restartSlideshowIfOn();
    }

    setSlideNumberToLast()
    {
        var _this = this;

        this.sitesManager.moveToLastSlide(function () {
            _this.currentSlideChangedEvent.notify();
        });

        this.restartSlideshowIfOn();
    }

    moveToSlide(id)
    {
        if (this.sitesManager.moveToSlide(id))
        {
            this.currentSlideChangedEvent.notify();
            //restartSlideshowIfOn();
        }
    }

    preloadNextUnpreloadedSlideAfterThisOneIfInRange(slide)
    {
        this.sitesManager.preloadNextUnpreloadedSlideAfterThisOneIfInRange(slide);
    }

    tryToPlayOrPause()
    {
        if (this.hasSlidesToDisplay())
        {
            if (this.isPlaying)
                this.pauseSlideshow();
            else
                this.startSlideshow();
        }
    }

    startSlideshow()
    {
        this.tryToStartCountdown();

        this.isPlaying = true;

        this.playingChangedEvent.notify();
    }

    tryToStartCountdown()
    {
        if (this.sitesManager.isCurrentSlideLoaded())
        {
            this.startCountdown();
        }
        else
        {
            var _this = this;

            this.sitesManager.runCodeWhenCurrentSlideFinishesLoading(function(){
                _this.startCountdown();
            });
        }
    }

    startCountdown()
    {
        var millisecondsPerSlide = this.secondsPerSlide * 1000;
	    
        var _this = this;

        this.timer = setTimeout(function() {
            if (_this.hasNextSlide())
            {
                // Continue slideshow
                _this.increaseCurrentSlideNumber();
            }
            else if (_this.isTryingToLoadMoreSlides())
            {
                // Wait for loading images/videos to finish
                _this.sitesManager.runCodeWhenFinishGettingMoreSlides(function(){
                    _this.tryToStartCountdown();
                });
            }
            else
            {
                // Loop when out of images/videos
                _this.setSlideNumberToFirst();
            }
		
        }, millisecondsPerSlide);
    }

    restartSlideshowIfOn()
    {
        
        if (this.isPlaying)
        {
            clearTimeout(this.timer);
            this.sitesManager.clearCallbacksForPreloadingSlides();
		
            this.tryToStartCountdown();
        }
    }

    pauseSlideshow()
    {
        clearTimeout(this.timer);
        this.sitesManager.clearCallbacksForPreloadingSlides();
        this.sitesManager.clearCallbacksForLoadingSlides();

        this.isPlaying = false;

        this.playingChangedEvent.notify();
    }

    hasAtLeastOneOnlineSiteSelected()
    {
        this.sitesManager.resetConnections();

        var selectedSites = this.getSelectedSitesToSearch();
        this.sitesManager.enableSites(selectedSites);

        return this.sitesManager.hasAtLeastOneOnlineSiteSelected();
    }

    getSlideCount()
    {
        return this.sitesManager.getTotalSlideNumber();
    }

    hasSlidesToDisplay()
    {
        return (this.getSlideCount() > 0);
    }

    hasNextSlide()
    {
        return (this.getSlideCount() > this.getCurrentSlideNumber());
    }

    isTryingToLoadMoreSlides()
    {
        return this.sitesManager.isTryingToLoadMoreSlides;
    }

    getCurrentSlide()
    {
        return this.sitesManager.getCurrentSlide();
    }

    getCurrentSlideNumber()
    {
        return this.sitesManager.currentSlideNumber;
    }

    areThereMoreLoadableSlides()
    {
        return this.sitesManager.areThereMoreLoadableSlides();
    }

    getNextSlidesForThumbnails()
    {
        return this.sitesManager.getNextSlidesForThumbnails();
    }

    getSelectedSitesToSearch()
    {
        var selectedSitesToSearch = [];

        for (var siteToSearch in this.sitesToSearch)
        {
            if (this.sitesToSearch[siteToSearch])
            {
                selectedSitesToSearch.push(siteToSearch);
            }
        }

        return selectedSitesToSearch;
    }

    areMaxWithAndHeightEnabled()
    {
        return !this.autoFitSlide;
    }
	
    setVideoVolume(volume)
    {
        this.videoVolume = volume;

        this.saveVideoVolume();

        this.videoVolumeUpdatedEvent.notify();
    }
	
    setVideoMuted(muted)
    {
        this.videoMuted = muted;

        this.saveVideoMuted();

        this.videoVolumeUpdatedEvent.notify();
    }

    setSitesToSearch(sitesToSearch)
    {
        this.sitesToSearch = sitesToSearch;

        this.saveSitesToSearch();

        this.sitesToSearchUpdatedEvent.notify();
    }

    setSiteToSearch(site, checked)
    {
        this.sitesToSearch[site] = checked;

        this.saveSitesToSearch();

        this.sitesToSearchUpdatedEvent.notify();
    }
	
    setSecondsPerSlide(secondsPerSlide)
    {
        this.secondsPerSlide = secondsPerSlide;

        this.saveSecondsPerSlide();

        this.secondsPerSlideUpdatedEvent.notify();
    }
	
    setSecondsPerSlideIfValid(secondsPerSlide)
    {
		if (secondsPerSlide == '')
            return;

        if (isNaN(secondsPerSlide))
            return;

        if (secondsPerSlide < 1)
            return;

        this.setSecondsPerSlide(secondsPerSlide);
	}

    setMaxWidth(maxWidth)
    {
        this.maxWidth = maxWidth;

        this.saveMaxWidth();

        this.maxWidthUpdatedEvent.notify();
    }

    setMaxHeight(maxHeight)
    {
        this.maxHeight = maxHeight;

        this.saveMaxHeight();

        this.maxHeightUpdatedEvent.notify();
    }

    setAutoFitSlide(onOrOff)
    {
        this.autoFitSlide = onOrOff;

        this.saveAutoFitSlide();

        this.autoFitSlideUpdatedEvent.notify();
    }
	
    setIncludeImages(onOrOff)
    {
        this.includeImages = onOrOff;

        this.saveIncludeImages();

        this.includeImagesUpdatedEvent.notify();
    }
	
    setIncludeGifs(onOrOff)
    {
        this.includeGifs = onOrOff;

        this.saveIncludeGifs();

        this.includeGifsUpdatedEvent.notify();
    }
	
    setIncludeWebms(onOrOff)
    {
        this.includeWebms = onOrOff;

        this.saveIncludeWebms();

        this.includeWebmsUpdatedEvent.notify();
    }
	
    setHideBlacklist(onOrOff)
    {
        this.hideBlacklist = onOrOff;

        this.saveHideBlacklist();

        this.hideBlacklistUpdatedEvent.notify();
    }

    setBlacklist(blacklist)
    {
        this.blacklist = blacklist;

        this.saveBlacklist();

        this.blacklistUpdatedEvent.notify();
    }
	
    setDerpibooruApiKey(derpibooruApiKey)
    {
        this.derpibooruApiKey = derpibooruApiKey;

        this.saveDerpibooruApiKey();

        this.derpibooruApiKeyUpdatedEvent.notify();
    }

    loadUserSettings()
    {
        var _this = this;

        chrome.storage.sync.get([
			'videoVolume',
			'videoMuted',
			'sitesToSearch',
			'secondsPerSlide',
			'maxWidth',
			'maxHeight',
			'autoFitSlide',
			'includeImages',
			'includeGifs',
			'includeWebms',
			'hideBlacklist',
			'blacklist',
			'derpibooruApiKey'],
			function (obj) {
				if (obj != null)
				{
					var videoVolume = obj['videoVolume'];
					var videoMuted = obj['videoMuted'];
					var sitesToSearch = obj['sitesToSearch'];
					var secondsPerSlide = obj['secondsPerSlide'];
					var maxWidth = obj['maxWidth'];
					var maxHeight = obj['maxHeight'];
					var autoFitSlide = obj['autoFitSlide'];
					var includeImages = obj['includeImages'];
					var includeGifs = obj['includeGifs'];
					var includeWebms = obj['includeWebms'];
					var hideBlacklist = obj['hideBlacklist'];
					var blacklist = obj['blacklist'];
					var derpibooruApiKey = obj['derpibooruApiKey'];
					
					if (videoVolume == null)
					{
						_this.setVideoVolume(_this.videoVolume);
					}
					else
					{
						if (_this.videoVolume != videoVolume)
						{
							_this.setVideoVolume(videoVolume);
						}
					}
					
					if (videoMuted == null)
					{
						_this.setVideoMuted(_this.videoMuted);
					}
					else
					{
						if (_this.videoMuted != videoMuted)
						{
							_this.setVideoMuted(videoMuted);
						}
					}
					
					if (sitesToSearch != null)
					{
                        let cleanSitesToSearch = Object.assign({}, this.sitesToSearch);

                        _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_DANBOORU);
                        _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_DERPIBOORU);
                        _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_E621);
                        _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_GELBOORU);
                        //_this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_IBSEARCH);
                        _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_KONACHAN);
                        _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_REALBOORU);
                        _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_RULE34);
                        _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_SAFEBOORU);
                        _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_YANDERE);

                        _this.setSitesToSearch(cleanSitesToSearch);
					}
					
					if (_this.secondsPerSlide != secondsPerSlide)
					{
						_this.setSecondsPerSlideIfValid(secondsPerSlide);
					}

					if (_this.maxWidth != maxWidth)
					{
						_this.setMaxWidth(maxWidth);
					}

					if (_this.maxHeight != maxHeight)
					{
						_this.setMaxHeight(maxHeight);
					}
					
					if (autoFitSlide != null)
					{
						if (_this.autoFitSlide != autoFitSlide)
						{
							_this.setAutoFitSlide(autoFitSlide);
						}
					}
					
					if (includeImages == null)
					{
						_this.setIncludeImages(_this.includeImages);
					}
					else
					{
						if (_this.includeImages != includeImages)
						{
							_this.setIncludeImages(includeImages);
						}
					}
					
					if (includeGifs == null)
					{
						_this.setIncludeGifs(_this.includeGifs);
					}
					else
					{
						if (_this.includeGifs != includeGifs)
						{
							_this.setIncludeGifs(includeGifs);
						}
					}
					
					if (includeWebms != null)
					{
						if (_this.includeWebms != includeWebms)
						{
							_this.setIncludeWebms(includeWebms);
						}
                    }
                    
                    if (hideBlacklist != null)
					{
						if (_this.hideBlacklist != hideBlacklist)
						{
							_this.setHideBlacklist(hideBlacklist);
						}
					}
					
					if (blacklist != null && _this.blacklist != blacklist)
					{
						_this.setBlacklist(blacklist);
					}
					
					if (derpibooruApiKey != null && _this.derpibooruApiKey != derpibooruApiKey)
					{
						_this.setDerpibooruApiKey(derpibooruApiKey);
					}
				}
			}
		);
    }

    addPropertyIfExists(sitesToSearch, cleanSitesToSearch, siteEnum)
    {
        if (sitesToSearch.hasOwnProperty(siteEnum))
        {
            cleanSitesToSearch[siteEnum] = sitesToSearch[siteEnum];
        }
    }
	
    saveVideoVolume()
    {
        chrome.storage.sync.set({'videoVolume': this.videoVolume});
    }
	
    saveVideoMuted()
    {
        chrome.storage.sync.set({'videoMuted': this.videoMuted});
    }

    saveSitesToSearch()
    {
        chrome.storage.sync.set({'sitesToSearch': this.sitesToSearch});
    }

    saveSecondsPerSlide()
    {
        chrome.storage.sync.set({'secondsPerSlide': this.secondsPerSlide});
    }

    saveMaxWidth()
    {
        chrome.storage.sync.set({'maxWidth': this.maxWidth});
    }

    saveMaxHeight()
    {
        chrome.storage.sync.set({'maxHeight': this.maxHeight});
    }

    saveAutoFitSlide()
    {
        chrome.storage.sync.set({'autoFitSlide': this.autoFitSlide});
    }
	
    saveIncludeImages()
    {
        chrome.storage.sync.set({'includeImages': this.includeImages});
    }
	
    saveIncludeGifs()
    {
        chrome.storage.sync.set({'includeGifs': this.includeGifs});
    }
	
    saveIncludeWebms()
    {
        chrome.storage.sync.set({'includeWebms': this.includeWebms});
    }
	
    saveHideBlacklist()
    {
        chrome.storage.sync.set({'hideBlacklist': this.hideBlacklist});
    }

    saveBlacklist()
    {
        chrome.storage.sync.set({'blacklist': this.blacklist});
    }
	
    saveDerpibooruApiKey()
    {
        chrome.storage.sync.set({'derpibooruApiKey': this.derpibooruApiKey});
    }
}