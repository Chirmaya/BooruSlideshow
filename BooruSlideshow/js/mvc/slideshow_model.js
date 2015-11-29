function SlideshowModel() {
    this.searchText = "";

    this.sitesToSearch = {
        [SITE_DANBOORU]: false,
        [SITE_E621]: false,
        [SITE_GELBOORU]: false,
        [SITE_RULE34]: false,
        [SITE_SAFEBOORU]: true,
    };

    this.secondsPerImage = 6;
    this.maxWidth = null;
    this.maxHeight = 500;

    this.isPlaying = false;
    this.timer = null;
    this.timerMs = 0;

    this.sitesManager = null;

    this.currentImageChangedEvent = new Event(this);

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
    },

    decreaseCurrentImageNumber: function () {
        this.sitesManager.decreaseCurrentImageNumber();
        this.currentImageChangedEvent.notify();
    },

    increaseCurrentImageNumber: function () {
        var _this = this;

        this.sitesManager.increaseCurrentImageNumber(function () {
            _this.currentImageChangedEvent.notify();
        });
    },

    preloadNextUnpreloadedImageAfterThisOneIfInRange: function (post) {
        this.sitesManager.preloadNextUnpreloadedImageAfterThisOneIfInRange(post);
    },

    setImageNumberToLast: function () {
        var _this = this;

        this.sitesManager.moveToLastImage(function () {
            _this.currentImageChangedEvent.notify();
        });
    },

    moveToImage: function (id) {
        if (this.sitesManager.moveToImage(id))
        {
            this.currentImageChangedEvent.notify();
            //restartSlideshowIfOn();
        }
    },

    pauseSlideshow: function () {
        console.log("PAUSE")
    },

    getImageCount: function () {
        return this.sitesManager.getTotalImageNumber();
    },

    hasImagesToDisplay: function () {
        return (this.getImageCount() > 0);
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