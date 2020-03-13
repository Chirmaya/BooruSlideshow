class SlideshowController
{
    constructor(uiElements)
    {
        this._model = new SlideshowModel();
        this._view = new SlideshowView(this._model, uiElements);
        this._model.view = this._view;

        this._view.updateSitesToSearch();
        this._view.updateOptions();

        var _this = this;

        // Attach view listeners
        this._view.currentImageClickedEvent.attach(function() {
            _this.currentSlideClicked();
        });
        
        this._view.currentVideoClickedEvent.attach(function() {
            _this.currentSlideClicked();
        });
        
        this._view.currentVideoVolumeChangedEvent.attach(function() {
            _this.videoVolumeChanged();
        });

        this._view.firstNavButtonClickedEvent.attach(function () {
            _this.firstNavButtonClicked();
        });

        this._view.previousNavButtonClickedEvent.attach(function () {
            _this.previousNavButtonClicked();
        });

        this._view.nextNavButtonClickedEvent.attach(function () {
            _this.nextNavButtonClicked();
        });

        this._view.lastNavButtonClickedEvent.attach(function () {
            _this.lastNavButtonClicked();
        });
        
        this._view.goBackTenImagesPressedEvent.attach(function () {
            _this.goBackTenImagesPressed();
        });
        
        this._view.goForwardTenImagesPressedEvent.attach(function () {
            _this.goForwardTenImagesPressed();
        });

        this._view.playButtonClickedEvent.attach(function () {
            _this.playButtonClicked();
        });

        this._view.pauseButtonClickedEvent.attach(function () {
            _this.pauseButtonClicked();
        });

        this._view.enterKeyPressedOutsideOfSearchTextBoxEvent.attach(function () {
            _this.enterKeyPressedOutsideOfSearchTextBox();
        });

        this._view.searchTextChangedEvent.attach(function () {
            _this.searchTextChanged();
        });

        this._view.enterKeyPressedInSearchTextBoxEvent.attach(function () {
            _this.enterKeyPressedInSearchTextBox();
        });

        this._view.searchButtonClickedEvent.attach(function () {
            _this.searchButtonClicked();
        });

        this._view.sitesToSearchChangedEvent.attach(function (args) {
            _this.sitesToSearchChanged(args.checked, args.site);
        });

        this._view.secondsPerSlideChangedEvent.attach(function () {
            _this.secondsPerSlideChanged();
        });

        this._view.maxWidthChangedEvent.attach(function () {
            _this.maxWidthChanged();
        });

        this._view.maxHeightChangedEvent.attach(function () {
            _this.maxHeightChanged();
        });

        this._view.autoFitSlideChangedEvent.attach(function () {
            _this.autoFitSlideChanged();
        });
        
        this._view.includeImagesChangedEvent.attach(function () {
            _this.includeImagesChanged();
        });
        
        this._view.includeGifsChangedEvent.attach(function () {
            _this.includeGifsChanged();
        });
        
        this._view.includeWebmsChangedEvent.attach(function () {
            _this.includeWebmsChanged();
        });

        this._view.includeExplicitChangedEvent.attach(function () {
            _this.includeExplicitChanged();
        });

        this._view.includeQuestionableChangedEvent.attach(function () {
            _this.includeQuestionableChanged();
        });

        this._view.includeSafeChangedEvent.attach(function () {
            _this.includeSafeChanged();
        });

        this._view.includeDupesChangedEvent.attach(function () {
            _this.includeDupesChanged();
        });
        
        this._view.hideBlacklistChangedEvent.attach(function () {
            _this.hideBlacklistChanged();
        });

        this._view.blacklistChangedEvent.attach(function () {
            _this.blacklistChanged();
        });
        
        this._view.derpibooruApiKeyChangedEvent.attach(function () {
            _this.derpibooruApiKeyChanged();
        });

        this._view.e621LoginChangedEvent.attach(function () {
            _this.e621LoginChanged();
        });

        this._view.e621ApiKeyChangedEvent.attach(function () {
            _this.e621ApiKeyChanged();
        });

        this._view.storeHistoryChangedEvent.attach(function () {
            _this.storeHistoryChanged();
        });

        this._view.clearHistoryClickedEvent.attach(function () {
            _this.clearHistoryClicked();
        });

        this._view.favoriteKeyPressedEvent.attach(function () {
            _this.favoriteButtonClicked();
        });

        this._view.favoriteButtonClickedEvent.attach(function () {
            _this.favoriteButtonClicked();
        });

        this._model.loadUserSettings();
        
        this._model.pingSites();
    }

    currentSlideClicked()
    {
        var currentSlide = this._model.getCurrentSlide();

        if (currentSlide == null)
            return;

        this._view.openUrlInNewWindow(currentSlide.viewableWebsitePostUrl);

        this._model.pauseSlideshow();
    }
	
    videoVolumeChanged()
    {
        var videoVolume = this._view.getVideoVolume();
        var videoMuted = this._view.getVideoMuted();
		
        this._model.setVideoVolume(videoVolume);
        this._model.setVideoMuted(videoMuted);
    }

    firstNavButtonClicked()
    {
        this._model.setSlideNumberToFirst();
    }

    previousNavButtonClicked()
    {
        this._model.decreaseCurrentSlideNumber();
    }

    nextNavButtonClicked()
    {
        this._model.increaseCurrentSlideNumber();
    }

    lastNavButtonClicked()
    {
        this._model.setSlideNumberToLast();
    }
	
    goBackTenImagesPressed()
    {
        this._model.decreaseCurrentSlideNumberByTen();
    }
	
    goForwardTenImagesPressed()
    {
        this._model.increaseCurrentSlideNumberByTen();
    }

    playButtonClicked()
    {
        this._model.startSlideshow();
    }

    pauseButtonClicked()
    {
        this._model.pauseSlideshow();
    }

    enterKeyPressedOutsideOfSearchTextBox()
    {
        this._model.tryToPlayOrPause();
    }

    searchTextChanged()
    {
        this._model.searchText = this._view.getSearchText();
    }

    enterKeyPressedInSearchTextBox()
    {
        this._model.searchText = this._view.getSearchText();
		this._view.removeFocusFromSearchTextBox();
        this.searchButtonClicked();
    }

    searchButtonClicked()
    {
        this._view.clearUI();
        this._view.removeFocusFromSearchButton();

        var searchText = this._model.searchText;

        if (searchText == '')
        {
            this._view.displayWarningMessage('The search query is blank.');
            return;
        }

        if (!this._model.hasAtLeastOneOnlineSiteSelected())
        {
            this._view.displayWarningMessage('No online sites were selected to be searched.');
            return;
        }
		
		var includingImagesOrGifs = (this._model.includeImages || this._model.includeGifs);
		
		if (!includingImagesOrGifs && !this._model.includeWebms)
		{
			this._view.displayWarningMessage('You must select at least one of: Images, GIFs, and WEBMs.');
            return;
		}
		
		var message = '';
		
		if (includingImagesOrGifs && this._model.includeWebms)
			message = 'Searching for images and videos...';
		else if (includingImagesOrGifs && !this._model.includeWebms)
			message = 'Searching for images...';
		else if (!includingImagesOrGifs && this._model.includeWebms)
			message = 'Searching for videos...';
		
		this._view.displayInfoMessage(message);
		
        this._model.performSearch(searchText);
    }

    sitesToSearchChanged(checked, site)
    {
        this._model.setSiteToSearch(site, checked);
    }

    secondsPerSlideChanged()
    {
        var secondsPerSlideText = this._view.getSecondsPerSlide();

        this._model.setSecondsPerSlideIfValid(secondsPerSlideText);
    }

    maxWidthChanged()
    {
        var maxWidthText = this._view.getMaxWidth();

        if (maxWidthText == '')
        {
			maxWidthText = null;
            //this._model.maxWidth = null;
            //return;
				
        }
		else if (isNaN(maxWidthText))
			return;
		else if (maxWidthText < 1)
            return;
        
        this._model.setMaxWidth(maxWidthText);
    }

    maxHeightChanged()
    {
        var maxHeightText = this._view.getMaxHeight();
        
        if (maxHeightText == '') {
            maxHeight = null;
        }
        else if (isNaN(maxHeightText))
            return;
        else if (maxHeightText < 1)
            return;
        
        this._model.setMaxHeight(maxHeightText);
    }

    autoFitSlideChanged()
    {
        var autoFitSlide = this._view.getAutoFitSlide();

        this._model.setAutoFitSlide(autoFitSlide);
    }
	
    includeImagesChanged()
    {
        var includeImages = this._view.getIncludeImages();

        this._model.setIncludeImages(includeImages);
    }
	
    includeGifsChanged()
    {
        var includeGifs = this._view.getIncludeGifs();

        this._model.setIncludeGifs(includeGifs);
    }
	
    includeWebmsChanged()
    {
        var includeWebms = this._view.getIncludeWebms();

        this._model.setIncludeWebms(includeWebms);
    }

    includeExplicitChanged()
    {
        var includeExplicit = this._view.getIncludeExplicit();

        this._model.setIncludeExplicit(includeExplicit);
    }

    includeQuestionableChanged()
    {
        var includeQuestionable = this._view.getIncludeQuestionable();

        this._model.setIncludeQuestionable(includeQuestionable);
    }

    includeSafeChanged()
    {
        var includeSafe = this._view.getIncludeSafe();

        this._model.setIncludeSafe(includeSafe);
    }

    includeDupesChanged()
    {
        var includeDupes = this._view.getIncludeDupes();

        this._model.setIncludeDupes(includeDupes);
    }
	
    hideBlacklistChanged()
    {
        var hideBlacklist = this._view.getHideBlacklist();

        this._model.setHideBlacklist(hideBlacklist);
    }

    blacklistChanged()
    {
        var blacklist = this._view.getBlacklist();

        this._model.setBlacklist(blacklist);
    }
	
    derpibooruApiKeyChanged()
    {
        var derpibooruApiKey = this._view.getDerpibooruApiKey();

        this._model.setDerpibooruApiKey(derpibooruApiKey);
    }

    e621LoginChanged()
    {
        var e621Login = this._view.getE621Login();

        this._model.setE621Login(e621Login);
    }

    e621ApiKeyChanged()
    {
        var e621ApiKey = this._view.getE621ApiKey();

        this._model.setE621ApiKey(e621ApiKey);
    }

    storeHistoryChanged()
    {
        var storeHistory = this._view.getStoreHistory();

        this._model.setStoreHistory(storeHistory);
    }

    clearHistoryClicked()
    {
        var searchHistory = [];

        this._model.setSearchHistory(searchHistory);
    }

    favoriteButtonClicked()
    {
        this._model.toggleSlideFave();
    }
}