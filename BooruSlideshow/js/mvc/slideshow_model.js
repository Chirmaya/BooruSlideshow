function SlideshowModel() {
    this.searchText = "";

    this.sitesToSearch = {
        [SITE_DANBOORU]: false,
        [SITE_E621]: false,
        [SITE_GELBOORU]: false,
        [SITE_RULE34]: false,
        [SITE_SAFEBOORU]: true,
    };

    this.secondsPerImage = 2;
    this.maxWidth = null;
    this.maxHeight = 500;

    this.isPlaying = false;
    this.timer = null;
    this.timerMs = 0;

    this.sitesManager = null;

    this.currentImageChangedEvent = new Event(this);
    this.playingChangedEvent = new Event(this);

    this.initialize();
}

SlideshowModel.prototype = {
    initialize: function () {
        var numberOfImagesToAlwaysHaveReadyToDisplay = 20;
        var maxNumberOfThumbnails = 10;

        this.sitesManager = new SitesManager(numberOfImagesToAlwaysHaveReadyToDisplay, maxNumberOfThumbnails);

        this.sitesManager.addSite(SITE_DANBOORU, 'https://danbooru.donmai.us', 100);
        this.sitesManager.addSite(SITE_E621, 'https://e621.net', 100);
        this.sitesManager.addSite(SITE_GELBOORU, 'http://gelbooru.com', 100);
        this.sitesManager.addSite(SITE_RULE34, 'http://rule34.xxx', 100);
        this.sitesManager.addSite(SITE_SAFEBOORU, 'http://safebooru.org', 100);
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

    startSlideshow: function () {
        this.tryToStartCountdown();

        this.isPlaying = true;

        this.playingChangedEvent.notify();
    },

    tryToStartCountdown: function () {
        console.log('tryToStartCountdown')
        if (this.sitesManager.isCurrentImageLoaded())
        {
            this.startCountdown();
        }
        else
        {
            this.sitesManager.runCodeWhenCurrentImageFinishesLoading(function(){
                this.startCountdown();
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
    }
};