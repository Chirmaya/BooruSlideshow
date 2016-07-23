function SlideshowModel() {
    this.searchText = "";

    this.sitesToSearch = {
        [SITE_DANBOORU]: false,
        [SITE_E621]: false,
        [SITE_GELBOORU]: false,
        [SITE_IBSEARCH]: false,
        [SITE_KONACHAN]: false,
		[SITE_RULE34]: false,
        [SITE_SAFEBOORU]: true,
        [SITE_YANDERE]: false
    };

    this.secondsPerImage = 6;
    this.maxWidth = null;
    this.maxHeight = null;
    this.autoFitImage = false;

    this.isPlaying = false;
    this.timer = null;
    this.timerMs = 0;

    this.sitesManager = null;

    this.currentImageChangedEvent = new Event(this);
    this.playingChangedEvent = new Event(this);
    this.sitesToSearchUpdatedEvent = new Event(this);
    this.secondsPerImageUpdatedEvent = new Event(this);
    this.maxWidthUpdatedEvent = new Event(this);
    this.maxHeightUpdatedEvent = new Event(this);
    this.autoFitImageUpdatedEvent = new Event(this);

    this.initialize();
}

SlideshowModel.prototype = {
    initialize: function () {
        var numberOfImagesToAlwaysHaveReadyToDisplay = 20;
        var maxNumberOfThumbnails = 10;

        this.sitesManager = new SitesManager(numberOfImagesToAlwaysHaveReadyToDisplay, maxNumberOfThumbnails);
		
		var pageLimit = 100;
		
        this.sitesManager.addSite(SITE_DANBOORU, 'https://danbooru.donmai.us', pageLimit);
        this.sitesManager.addSite(SITE_E621, 'https://e621.net', pageLimit);
        this.sitesManager.addSite(SITE_GELBOORU, 'http://gelbooru.com', pageLimit);
        this.sitesManager.addSite(SITE_IBSEARCH, 'https://ibsearch.xxx', pageLimit);
        this.sitesManager.addSite(SITE_KONACHAN, 'https://konachan.com', pageLimit);
        this.sitesManager.addSite(SITE_RULE34, 'http://rule34.xxx', pageLimit);
        this.sitesManager.addSite(SITE_SAFEBOORU, 'http://safebooru.org', pageLimit);
        this.sitesManager.addSite(SITE_YANDERE, 'https://yande.re', pageLimit);
    },

    performSearch: function (searchText) {
        this.sitesManager.resetConnections();

        var selectedSites = this.getSelectedSitesToSearch();
        this.sitesManager.enableSites(selectedSites);

        var _this = this;

        this.sitesManager.performSearch(searchText, function () {
            _this.currentImageChangedEvent.notify();
        });
    },

    setImageNumberToFirst: function () {
        this.sitesManager.moveToFirstImage();
        this.currentImageChangedEvent.notify();

        this.restartSlideshowIfOn();
    },

    decreaseCurrentImageNumber: function () {
        this.sitesManager.decreaseCurrentImageNumber();
        this.currentImageChangedEvent.notify();

        this.restartSlideshowIfOn();
    },

    increaseCurrentImageNumber: function () {
        var _this = this;

        this.sitesManager.increaseCurrentImageNumber(function () {
            _this.currentImageChangedEvent.notify();
        });

        this.restartSlideshowIfOn();
    },

    setImageNumberToLast: function () {
        var _this = this;

        this.sitesManager.moveToLastImage(function () {
            _this.currentImageChangedEvent.notify();
        });

        this.restartSlideshowIfOn();
    },

    moveToImage: function (id) {
        if (this.sitesManager.moveToImage(id))
        {
            this.currentImageChangedEvent.notify();
            //restartSlideshowIfOn();
        }
    },

    preloadNextUnpreloadedImageAfterThisOneIfInRange: function (post) {
        this.sitesManager.preloadNextUnpreloadedImageAfterThisOneIfInRange(post);
    },

    tryToPlayOrPause: function () {
        if (this.hasImagesToDisplay())
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
        if (this.sitesManager.isCurrentImageLoaded())
        {
            this.startCountdown();
        }
        else
        {
            var _this = this;

            this.sitesManager.runCodeWhenCurrentImageFinishesLoading(function(){
                _this.startCountdown();
            });
        }
    },

    startCountdown: function () {
        var millisecondsPerImage = this.secondsPerImage * 1000;
	    
        var _this = this;

        this.timer = setTimeout(function() {
            if (_this.hasNextImage())
            {
                // Continue slideshow
                _this.increaseCurrentImageNumber();
            }
            else if (_this.isTryingToLoadMoreImages())
            {
                // Wait for loading images to finish
                _this.sitesManager.runCodeWhenFinishGettingMoreImages(function(){
                    _this.tryToStartCountdown();
                });
            }
            else
            {
                // Loop when out of images
                _this.setImageNumberToFirst();
            }
		
        }, millisecondsPerImage);
    },

    restartSlideshowIfOn: function () {
        
        if (this.isPlaying)
        {
            clearTimeout(this.timer);
            this.sitesManager.clearCallbacksForPreloadingImages();
		
            this.tryToStartCountdown();
        }
    },

    pauseSlideshow: function () {
        clearTimeout(this.timer);
        this.sitesManager.clearCallbacksForPreloadingImages();
        this.sitesManager.clearCallbacksForLoadingImages();

        this.isPlaying = false;

        this.playingChangedEvent.notify();
    },

    getImageCount: function () {
        return this.sitesManager.getTotalImageNumber();
    },

    hasImagesToDisplay: function () {
        return (this.getImageCount() > 0);
    },

    hasNextImage: function () {
        return (this.getImageCount() > this.getCurrentImageNumber());
    },

    isTryingToLoadMoreImages: function () {
        return this.sitesManager.isTryingToLoadMoreImages;
    },

    getCurrentPost: function() {
        return this.sitesManager.getCurrentPost();
    },

    getCurrentImageNumber: function () {
        return this.sitesManager.currentImageNumber;
    },

    areThereMoreLoadableImages: function () {
        return this.sitesManager.areThereMoreLoadableImages();
    },

    getNextPostsForThumbnails: function () {
        return this.sitesManager.getNextPostsForThumbnails();
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
        return !this.autoFitImage;
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
	
    setSecondsPerImage: function (secondsPerImage) {
        this.secondsPerImage = secondsPerImage;

        this.saveSecondsPerImage();

        this.secondsPerImageUpdatedEvent.notify();
    },
	
	setSecondsPerImageIfValid: function (secondsPerImage) {
		if (secondsPerImage == '')
            return;

        if (isNaN(secondsPerImage))
            return;

        if (secondsPerImage < 1)
            return;

        this.setSecondsPerImage(secondsPerImage);
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

    setAutoFitImage: function (onOrOff) {
        this.autoFitImage = onOrOff;

        this.saveAutoFitImage();

        this.autoFitImageUpdatedEvent.notify();
    },

    loadUserSettings: function () {
        var _this = this;

        chrome.storage.sync.get(['sitesToSearch', 'secondsPerImage', 'maxWidth', 'maxHeight', 'autoFitImage'], function (obj) {
            if (obj != null)
            {
                var sitesToSearch = obj['sitesToSearch'];
                var secondsPerImage = obj['secondsPerImage'];
                var maxWidth = obj['maxWidth'];
                var maxHeight = obj['maxHeight'];
                var autoFitImage = obj['autoFitImage'];
			    
                if (sitesToSearch != null)
                {
                    if (sitesToSearch.hasOwnProperty(SITE_DANBOORU) &&
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
				
                if (_this.secondsPerImage != secondsPerImage)
                {
                    _this.setSecondsPerImageIfValid(secondsPerImage);
                }

                if (_this.maxWidth != maxWidth)
                {
                    _this.setMaxWidth(maxWidth);
                }

                if (_this.maxHeight != maxHeight)
                {
                    _this.setMaxHeight(maxHeight);
                }
                
                if (autoFitImage != null)
                {
                    if (_this.autoFitImage != autoFitImage)
                    {
                        _this.setAutoFitImage(autoFitImage);
                    }
                }
            }
        });
    },

    saveSitesToSearch: function () {
        chrome.storage.sync.set({'sitesToSearch': this.sitesToSearch});
    },

    saveSecondsPerImage: function () {
        chrome.storage.sync.set({'secondsPerImage': this.secondsPerImage});
    },

    saveMaxWidth: function () {
        chrome.storage.sync.set({'maxWidth': this.maxWidth});
    },

    saveMaxHeight: function () {
        chrome.storage.sync.set({'maxHeight': this.maxHeight});
    },

    saveAutoFitImage: function () {
        chrome.storage.sync.set({'autoFitImage': this.autoFitImage});
    }
};