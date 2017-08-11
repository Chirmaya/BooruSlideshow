function SlideshowModel() {
    this.view = null;
	
	this.searchText = "";

    this.sitesToSearch = {
        [SITE_DANBOORU]: false,
        [SITE_DERPIBOORU]: false,
        [SITE_E621]: false,
        [SITE_GELBOORU]: false,
        [SITE_IBSEARCH]: false,
        [SITE_KONACHAN]: false,
		[SITE_RULE34]: false,
        [SITE_SAFEBOORU]: true,
        [SITE_YANDERE]: false
    };

    this.secondsPerSlide = 6;
    this.maxWidth = null;
    this.maxHeight = null;
    this.autoFitSlide = false;
    this.includeWebm = false;

    this.isPlaying = false;
    this.timer = null;
    this.timerMs = 0;

    this.sitesManager = null;

    this.currentSlideChangedEvent = new Event(this);
    this.playingChangedEvent = new Event(this);
    this.sitesToSearchUpdatedEvent = new Event(this);
    this.secondsPerSlideUpdatedEvent = new Event(this);
    this.maxWidthUpdatedEvent = new Event(this);
    this.maxHeightUpdatedEvent = new Event(this);
    this.autoFitSlideUpdatedEvent = new Event(this);
    this.includeWebmUpdatedEvent = new Event(this);

    this.initialize();
}

SlideshowModel.prototype = {
    initialize: function () {
        var numberOfSlidesToAlwaysHaveReadyToDisplay = 20;
        var maxNumberOfThumbnails = 10;

        this.sitesManager = new SitesManager(this, numberOfSlidesToAlwaysHaveReadyToDisplay, maxNumberOfThumbnails);
		
		var pageLimit = 100;
		
        this.sitesManager.addSite(SITE_DANBOORU, 'https://danbooru.donmai.us', pageLimit);
        this.sitesManager.addSite(SITE_DERPIBOORU, 'https://derpibooru.org', 10);
        this.sitesManager.addSite(SITE_E621, 'https://e621.net', pageLimit);
        this.sitesManager.addSite(SITE_GELBOORU, 'https://gelbooru.com', pageLimit);
        this.sitesManager.addSite(SITE_IBSEARCH, 'https://ibsearch.xxx', pageLimit);
        this.sitesManager.addSite(SITE_KONACHAN, 'https://konachan.com', pageLimit);
        this.sitesManager.addSite(SITE_RULE34, 'https://rule34.xxx', pageLimit);
        this.sitesManager.addSite(SITE_SAFEBOORU, 'http://safebooru.org', pageLimit);
        this.sitesManager.addSite(SITE_YANDERE, 'https://yande.re', pageLimit);
    },

    performSearch: function (searchText) {
        this.sitesManager.resetConnections();

        var selectedSites = this.getSelectedSitesToSearch();
        this.sitesManager.enableSites(selectedSites);

        var _this = this;

        this.sitesManager.performSearch(searchText, function () {
			_this.view.clearInfoMessage();
            _this.currentSlideChangedEvent.notify();
        });
    },

    setSlideNumberToFirst: function () {
        this.sitesManager.moveToFirstSlide();
        this.currentSlideChangedEvent.notify();

        this.restartSlideshowIfOn();
    },

    decreaseCurrentSlideNumber: function () {
        this.sitesManager.decreaseCurrentSlideNumber();
        this.currentSlideChangedEvent.notify();

        this.restartSlideshowIfOn();
    },

    increaseCurrentSlideNumber: function () {
        var _this = this;

        this.sitesManager.increaseCurrentSlideNumber(function () {
            _this.currentSlideChangedEvent.notify();
        });

        this.restartSlideshowIfOn();
    },
	
	decreaseCurrentSlideNumberByTen: function () {
        this.sitesManager.decreaseCurrentSlideNumberByTen();
        this.currentSlideChangedEvent.notify();

        this.restartSlideshowIfOn();
    },
	
	increaseCurrentSlideNumberByTen: function () {
        var _this = this;

        this.sitesManager.increaseCurrentSlideNumberByTen(function () {
            _this.currentSlideChangedEvent.notify();
        });

        this.restartSlideshowIfOn();
    },

    setSlideNumberToLast: function () {
        var _this = this;

        this.sitesManager.moveToLastSlide(function () {
            _this.currentSlideChangedEvent.notify();
        });

        this.restartSlideshowIfOn();
    },

    moveToSlide: function (id) {
        if (this.sitesManager.moveToSlide(id))
        {
            this.currentSlideChangedEvent.notify();
            //restartSlideshowIfOn();
        }
    },

    preloadNextUnpreloadedSlideAfterThisOneIfInRange: function (slide) {
        this.sitesManager.preloadNextUnpreloadedSlideAfterThisOneIfInRange(slide);
    },

    tryToPlayOrPause: function () {
        if (this.hasSlidesToDisplay())
        {
            if (this.isPlaying)
                this.pauseSlideshow();
            else
                this.startSlideshow();
        }
    },

    startSlideshow: function () {
        this.tryToStartCountdown();

        this.isPlaying = true;

        this.playingChangedEvent.notify();
    },

    tryToStartCountdown: function () {
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
    },

    startCountdown: function () {
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
    },

    restartSlideshowIfOn: function () {
        
        if (this.isPlaying)
        {
            clearTimeout(this.timer);
            this.sitesManager.clearCallbacksForPreloadingSlides();
		
            this.tryToStartCountdown();
        }
    },

    pauseSlideshow: function () {
        clearTimeout(this.timer);
        this.sitesManager.clearCallbacksForPreloadingSlides();
        this.sitesManager.clearCallbacksForLoadingSlides();

        this.isPlaying = false;

        this.playingChangedEvent.notify();
    },

    getSlideCount: function () {
        return this.sitesManager.getTotalSlideNumber();
    },

    hasSlidesToDisplay: function () {
        return (this.getSlideCount() > 0);
    },

    hasNextSlide: function () {
        return (this.getSlideCount() > this.getCurrentSlideNumber());
    },

    isTryingToLoadMoreSlides: function () {
        return this.sitesManager.isTryingToLoadMoreSlides;
    },

    getCurrentSlide: function() {
        return this.sitesManager.getCurrentSlide();
    },

    getCurrentSlideNumber: function () {
        return this.sitesManager.currentSlideNumber;
    },

    areThereMoreLoadableSlides: function () {
        return this.sitesManager.areThereMoreLoadableSlides();
    },

    getNextSlidesForThumbnails: function () {
        return this.sitesManager.getNextSlidesForThumbnails();
    },

    getSelectedSitesToSearch: function () {
        var selectedSitesToSearch = [];

        for (var siteToSearch in this.sitesToSearch)
        {
            if (this.sitesToSearch[siteToSearch])
            {
                selectedSitesToSearch.push(siteToSearch);
            }
        }

        return selectedSitesToSearch;
    },

    areMaxWithAndHeightEnabled: function () {
        return !this.autoFitSlide;
    },

    setSitesToSearch: function (sitesToSearch) {
        this.sitesToSearch = sitesToSearch;

        this.saveSitesToSearch();

        this.sitesToSearchUpdatedEvent.notify();
    },

    setSiteToSearch: function (site, checked) {
        this.sitesToSearch[site] = checked;

        this.saveSitesToSearch();

        this.sitesToSearchUpdatedEvent.notify();
    },
	
    setSecondsPerSlide: function (secondsPerSlide) {
        this.secondsPerSlide = secondsPerSlide;

        this.saveSecondsPerSlide();

        this.secondsPerSlideUpdatedEvent.notify();
    },
	
	setSecondsPerSlideIfValid: function (secondsPerSlide) {
		if (secondsPerSlide == '')
            return;

        if (isNaN(secondsPerSlide))
            return;

        if (secondsPerSlide < 1)
            return;

        this.setSecondsPerSlide(secondsPerSlide);
	},

    setMaxWidth: function (maxWidth) {
        this.maxWidth = maxWidth;

        this.saveMaxWidth();

        this.maxWidthUpdatedEvent.notify();
    },

    setMaxHeight: function (maxHeight) {
        this.maxHeight = maxHeight;

        this.saveMaxHeight();

        this.maxHeightUpdatedEvent.notify();
    },

    setAutoFitSlide: function (onOrOff) {
        this.autoFitSlide = onOrOff;

        this.saveAutoFitSlide();

        this.autoFitSlideUpdatedEvent.notify();
    },
	
	setIncludeWebm: function (onOrOff) {
        this.includeWebm = onOrOff;

        this.saveIncludeWebm();

        this.includeWebmUpdatedEvent.notify();
    },

    loadUserSettings: function () {
        var _this = this;

        chrome.storage.sync.get(['sitesToSearch', 'secondsPerSlide', 'maxWidth', 'maxHeight', 'autoFitSlide', 'includeWebm'], function (obj) {
            if (obj != null)
            {
                var sitesToSearch = obj['sitesToSearch'];
                var secondsPerSlide = obj['secondsPerSlide'];
                var maxWidth = obj['maxWidth'];
                var maxHeight = obj['maxHeight'];
                var autoFitSlide = obj['autoFitSlide'];
                var includeWebm = obj['includeWebm'];
			    
                if (sitesToSearch != null)
                {
                    if (sitesToSearch.hasOwnProperty(SITE_DANBOORU) &&
						sitesToSearch.hasOwnProperty(SITE_DERPIBOORU) &&
                        sitesToSearch.hasOwnProperty(SITE_E621) &&
                        sitesToSearch.hasOwnProperty(SITE_GELBOORU) &&
                        sitesToSearch.hasOwnProperty(SITE_IBSEARCH) &&
                        sitesToSearch.hasOwnProperty(SITE_KONACHAN) &&
                        sitesToSearch.hasOwnProperty(SITE_RULE34) &&
                        sitesToSearch.hasOwnProperty(SITE_SAFEBOORU) &&
						sitesToSearch.hasOwnProperty(SITE_YANDERE))
                    {
                        _this.setSitesToSearch(sitesToSearch);
                    }
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
				
				if (includeWebm != null)
                {
                    if (_this.includeWebm != includeWebm)
                    {
                        _this.setIncludeWebm(includeWebm);
                    }
                }
            }
        });
    },

    saveSitesToSearch: function () {
        chrome.storage.sync.set({'sitesToSearch': this.sitesToSearch});
    },

    saveSecondsPerSlide: function () {
        chrome.storage.sync.set({'secondsPerSlide': this.secondsPerSlide});
    },

    saveMaxWidth: function () {
        chrome.storage.sync.set({'maxWidth': this.maxWidth});
    },

    saveMaxHeight: function () {
        chrome.storage.sync.set({'maxHeight': this.maxHeight});
    },

    saveAutoFitSlide: function () {
        chrome.storage.sync.set({'autoFitSlide': this.autoFitSlide});
    },
	
	saveIncludeWebm: function () {
        chrome.storage.sync.set({'includeWebm': this.includeWebm});
    }
};