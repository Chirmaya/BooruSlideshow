function SlideshowModel() {
    this.view = null;
	
	this.videoVolume = 0;
	this.videoMuted = false;
	
	this.searchText = "";
	
    this.sitesToSearch = {
        [SITE_DANBOORU]: false,
        [SITE_DERPIBOORU]: false,
        [SITE_E621]: false,
        [SITE_GELBOORU]: false,
        [SITE_IBSEARCH]: false,
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
        this.sitesManager.addSite(SITE_REALBOORU, 'https://realbooru.com', pageLimit);
        this.sitesManager.addSite(SITE_RULE34, 'https://rule34.xxx', pageLimit);
        this.sitesManager.addSite(SITE_SAFEBOORU, 'http://safebooru.org', pageLimit);
        this.sitesManager.addSite(SITE_YANDERE, 'https://yande.re', pageLimit);
    },
	
	pingSites: function () {
		var _this = this;
		this.sitesManager.pingSites(function(siteManager){
			if (!siteManager.isOnline)
				_this.view.showSiteOffline(siteManager.id);
		});
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
	
	areSomeTagsAreBlacklisted: function (tags) {
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
	},

    setSlideNumberToFirst: function () {
        this.sitesManager.moveToFirstSlide();
        this.currentSlideChangedEvent.notify();

        this.restartSlideshowIfOn();
    },

    decreaseCurrentSlideNumber: function () {
        if (!this.sitesManager.canDecreaseCurrentSlideNumber())
        {
            return;
        }

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
        if (!this.sitesManager.canDecreaseCurrentSlideNumber())
        {
            return;
        }
        
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
	
	setVideoVolume: function (volume) {
        this.videoVolume = volume;

        this.saveVideoVolume();

        this.videoVolumeUpdatedEvent.notify();
    },
	
	setVideoMuted: function (muted) {
        this.videoMuted = muted;

        this.saveVideoMuted();

        this.videoVolumeUpdatedEvent.notify();
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
	
	setIncludeImages: function (onOrOff) {
        this.includeImages = onOrOff;

        this.saveIncludeImages();

        this.includeImagesUpdatedEvent.notify();
    },
	
	setIncludeGifs: function (onOrOff) {
        this.includeGifs = onOrOff;

        this.saveIncludeGifs();

        this.includeGifsUpdatedEvent.notify();
    },
	
	setIncludeWebms: function (onOrOff) {
        this.includeWebms = onOrOff;

        this.saveIncludeWebms();

        this.includeWebmsUpdatedEvent.notify();
    },
	
	setHideBlacklist: function (onOrOff) {
        this.hideBlacklist = onOrOff;

        this.saveHideBlacklist();

        this.hideBlacklistUpdatedEvent.notify();
    },

    setBlacklist: function (blacklist) {
        this.blacklist = blacklist;

        this.saveBlacklist();

        this.blacklistUpdatedEvent.notify();
    },
	
	setDerpibooruApiKey: function (derpibooruApiKey) {
        this.derpibooruApiKey = derpibooruApiKey;

        this.saveDerpibooruApiKey();

        this.derpibooruApiKeyUpdatedEvent.notify();
    },

    loadUserSettings: function () {
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
						if (sitesToSearch.hasOwnProperty(SITE_DANBOORU) &&
							sitesToSearch.hasOwnProperty(SITE_DERPIBOORU) &&
							sitesToSearch.hasOwnProperty(SITE_E621) &&
							sitesToSearch.hasOwnProperty(SITE_GELBOORU) &&
							sitesToSearch.hasOwnProperty(SITE_IBSEARCH) &&
							sitesToSearch.hasOwnProperty(SITE_KONACHAN) &&
							sitesToSearch.hasOwnProperty(SITE_REALBOORU) &&
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
    },
	
	saveVideoVolume: function () {
        chrome.storage.sync.set({'videoVolume': this.videoVolume});
    },
	
	saveVideoMuted: function () {
        chrome.storage.sync.set({'videoMuted': this.videoMuted});
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
	
	saveIncludeImages: function () {
        chrome.storage.sync.set({'includeImages': this.includeImages});
    },
	
	saveIncludeGifs: function () {
        chrome.storage.sync.set({'includeGifs': this.includeGifs});
    },
	
	saveIncludeWebms: function () {
        chrome.storage.sync.set({'includeWebms': this.includeWebms});
    },
	
	saveHideBlacklist: function () {
        chrome.storage.sync.set({'hideBlacklist': this.hideBlacklist});
    },

    saveBlacklist: function () {
        chrome.storage.sync.set({'blacklist': this.blacklist});
    },
	
	saveDerpibooruApiKey: function () {
        chrome.storage.sync.set({'derpibooruApiKey': this.derpibooruApiKey});
    }
};