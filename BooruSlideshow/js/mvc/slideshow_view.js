class SlideshowView
{
    constructor (slideshowModel, uiElements) {
        this._model = slideshowModel;
        this.uiElements = uiElements;
        
        this.currentImageClickedEvent = new Event(this);
        this.currentVideoClickedEvent = new Event(this);
        this.currentVideoVolumeChangedEvent = new Event(this);
        this.searchButtonClickedEvent = new Event(this);
        this.firstNavButtonClickedEvent = new Event(this);
        this.previousNavButtonClickedEvent = new Event(this);
        this.nextNavButtonClickedEvent = new Event(this);
        this.lastNavButtonClickedEvent = new Event(this);
        this.goBackTenImagesPressedEvent = new Event(this);
        this.goForwardTenImagesPressedEvent = new Event(this);
        this.playButtonClickedEvent = new Event(this);
        this.pauseButtonClickedEvent = new Event(this);
        this.enterKeyPressedOutsideOfSearchTextBoxEvent = new Event(this);
        this.searchTextChangedEvent = new Event(this);
        this.enterKeyPressedInSearchTextBoxEvent = new Event(this);
        this.sitesToSearchChangedEvent = new Event(this);
        this.secondsPerSlideChangedEvent = new Event(this);
        this.maxWidthChangedEvent = new Event(this);
        this.maxHeightChangedEvent = new Event(this);
        this.autoFitSlideChangedEvent = new Event(this);
        this.includeImagesChangedEvent = new Event(this);
        this.includeGifsChangedEvent = new Event(this);
        this.includeWebmsChangedEvent = new Event(this);
        this.includeExplicitChangedEvent = new Event(this);
        this.includeQuestionableChangedEvent = new Event(this);
        this.includeSafeChangedEvent = new Event(this);
        this.includeDupesChangedEvent = new Event(this);
        this.hideBlacklistChangedEvent = new Event(this);
        this.blacklistChangedEvent = new Event(this);
        this.derpibooruApiKeyChangedEvent = new Event(this);
        this.e621LoginChangedEvent = new Event(this);
        this.e621ApiKeyChangedEvent = new Event(this);
        this.storeHistoryChangedEvent = new Event(this);
        this.clearHistoryClickedEvent = new Event(this);
        this.favoriteKeyPressedEvent = new Event(this);
        this.favoriteButtonClickedEvent = new Event(this);
        
        this.isSettingVolume = false;
        this.isSettingMute = false;
    
        var _this = this;
        
        this.attachModelListeners();
        
        this.attachUiElementListeners();
    
        this.setupLoadingAnimation();

        this.setFocusToSearchBox();
    }

    attachModelListeners()
    {
        var _this = this;

        // Attach model listeners
        this._model.videoVolumeUpdatedEvent.attach(function () {
            _this.updateVideoVolume();
            _this.updateVideoMuted();
        });
        
        this._model.currentSlideChangedEvent.attach(function () {
            _this.updateSlidesAndNavigation();
        });
    
        this._model.playingChangedEvent.attach(function () {
            _this.updatePlayPauseButtons();
        });
    
        this._model.sitesToSearchUpdatedEvent.attach(function () {
            _this.updateSitesToSearch();
        });
    
        this._model.secondsPerSlideUpdatedEvent.attach(function () {
            _this.updateSecondsPerSlide();
        });
    
        this._model.maxWidthUpdatedEvent.attach(function () {
            _this.updateMaxWidth();
        });
    
        this._model.maxHeightUpdatedEvent.attach(function () {
            _this.updateMaxHeight();
        });
    
        this._model.autoFitSlideUpdatedEvent.attach(function () {
            _this.updateAutoFitSlide();
        });
        
        this._model.includeImagesUpdatedEvent.attach(function () {
            _this.updateIncludeImages();
        });
        
        this._model.includeGifsUpdatedEvent.attach(function () {
            _this.updateIncludeGifs();
        });
        
        this._model.includeWebmsUpdatedEvent.attach(function () {
            _this.updateIncludeWebms();
        });

        this._model.includeExplicitUpdatedEvent.attach(function () {
            _this.updateIncludeExplicit();
        });

        this._model.includeQuestionableUpdatedEvent.attach(function () {
            _this.updateIncludeQuestionable();
        });

        this._model.includeSafeUpdatedEvent.attach(function () {
            _this.updateIncludeSafe();
        });

        this._model.includeDupesUpdatedEvent.attach(function () {
            _this.updateIncludeDupes();
        });
        
        this._model.hideBlacklistUpdatedEvent.attach(function () {
            _this.updateHideBlacklist();
        });

        this._model.blacklistUpdatedEvent.attach(function () {
            _this.updateBlacklist();
        });
        
        this._model.derpibooruApiKeyUpdatedEvent.attach(function () {
            _this.updateDerpibooruApiKey();
        });

        this._model.e621LoginUpdatedEvent.attach(function () {
            _this.updateE621Login();
        });

        this._model.e621ApiKeyUpdatedEvent.attach(function () {
            _this.updateE621ApiKey();
        });

        this._model.storeHistoryUpdatedEvent.attach(function () {
            _this.updateStoreHistory();
        });

        this._model.searchHistoryUpdatedEvent.attach(function () {
            _this.updateSearchHistory();
        });

        this._model.favoriteButtonUpdatedEvent.attach(function (){
            _this.updateFavoriteButton();
        });
    }

    attachUiElementListeners()
    {
        var _this = this;

        window.addEventListener('resize', function () {
            _this.windowResized();
        });
    
        this.uiElements.currentImage.addEventListener('click', function() {
            _this.currentImageClickedEvent.notify();
        });
        
        this.uiElements.currentVideo.addEventListener('click', function() {
            _this.currentVideoClickedEvent.notify();
        });
        
        this.uiElements.currentVideo.addEventListener('volumechange', function() {
            /*if (_this.isSettingVolume)
            {
                _this.isSettingVolume = false;
                return;
            }
            
            if (_this.isSettingMute)
            {
                _this.isSettingMute = false;
                return;
            }*/
            
            if (_this.isSettingVolume)
            {
                return;
            }
            
            _this.currentVideoVolumeChangedEvent.notify();
        });
        
        this.uiElements.firstNavButton.addEventListener('click', function() {
            _this.firstNavButtonClickedEvent.notify();
        });
    
        this.uiElements.previousNavButton.addEventListener('click', function() {
            _this.previousNavButtonClickedEvent.notify();
        });
    
        this.uiElements.nextNavButton.addEventListener('click', function() {
            _this.nextNavButtonClickedEvent.notify();
        });
    
        this.uiElements.lastNavButton.addEventListener('click', function() {
            _this.lastNavButtonClickedEvent.notify();
        });
    
        this.uiElements.playButton.addEventListener('click', function() {
            _this.playButtonClickedEvent.notify();
        });
    
        this.uiElements.pauseButton.addEventListener('click', function() {
            _this.pauseButtonClickedEvent.notify();
        });
    
        document.addEventListener('keydown', function (e) {
            var key = e.which || e.keyCode;
            
            if (!(
                key == ENTER_KEY_ID ||
                key == SPACE_KEY_ID ||
                key == LEFT_ARROW_KEY_ID ||
                key == RIGHT_ARROW_KEY_ID ||
                key == A_KEY_ID ||
                key == W_KEY_ID ||
                key == S_KEY_ID ||
                key == D_KEY_ID ||
                key == F_KEY_ID ||
                key == L_KEY_ID ||
                key == G_KEY_ID ||
                key == E_KEY_ID ||
                key == R_KEY_ID))
            {
                return;
            }
    
            if (document.activeElement !== _this.uiElements.searchTextBox &&
                document.activeElement !== _this.uiElements.secondsPerSlideTextBox &&
                document.activeElement !== _this.uiElements.maxWidthTextBox &&
                document.activeElement !== _this.uiElements.maxHeightTextBox &&
                document.activeElement !== _this.uiElements.blacklist &&
                document.activeElement !== _this.uiElements.derpibooruApiKey &&
                document.activeElement !== _this.uiElements.e621ApiKey &&
                document.activeElement !== _this.uiElements.e621Login) {
                
                if (key == LEFT_ARROW_KEY_ID || key == A_KEY_ID)
                    _this.previousNavButtonClickedEvent.notify();
                if (key == RIGHT_ARROW_KEY_ID || key == D_KEY_ID)
                    _this.nextNavButtonClickedEvent.notify();
                if (key == W_KEY_ID)
                    _this.goBackTenImagesPressedEvent.notify();
                if (key == S_KEY_ID)
                    _this.goForwardTenImagesPressedEvent.notify();
                if (key == ENTER_KEY_ID || key == SPACE_KEY_ID)
                {
                    if (document.activeElement !== _this.uiElements.searchButton)
                        _this.enterKeyPressedOutsideOfSearchTextBoxEvent.notify();
                }
                if (key == SPACE_KEY_ID)
                {
                    e.preventDefault();
                }
                if (key == F_KEY_ID)
                {
                    _this._model.setAutoFitSlide(!_this._model.autoFitSlide);
                }
                if (key == L_KEY_ID)
                {
                    _this.downloadCurrentSlide();
                }
                if (key == G_KEY_ID)
                {
                    _this.favoriteKeyPressedEvent.notify();
                }
                if (key == E_KEY_ID)
                {
                    _this.openCurrentSlide();
                }
                if (key == R_KEY_ID)
                {
                    _this._model.toggleTags();
                }
            }
        });
    
        this.uiElements.searchTextBox.addEventListener('change', function () {
            _this.searchTextChangedEvent.notify();
        });
    
        this.uiElements.searchTextBox.addEventListener('keypress', function (e) {
            var key = e.which || e.keyCode;
    
            if (key == ENTER_KEY_ID) {
                _this.enterKeyPressedInSearchTextBoxEvent.notify();
            }
        });
    
        this.uiElements.searchButton.addEventListener('click', function () {
            _this.searchButtonClickedEvent.notify();
        });
    
        var sitesToSearchElements = this.uiElements.sitesToSearch;
    
        for (var i = 0; i < sitesToSearchElements.length; i++)
        {
            var siteToSearch = sitesToSearchElements[i];
    
            siteToSearch.addEventListener('change', function (e) {
                _this.sitesToSearchChangedEvent.notify({
                    checked: e.target.checked,
                    site: e.target.value
                });
            });
        }
    
        this.uiElements.secondsPerSlideTextBox.addEventListener('change', function () {
            _this.secondsPerSlideChangedEvent.notify();
        });
    
        this.uiElements.maxWidthTextBox.addEventListener('change', function () {
            _this.maxWidthChangedEvent.notify();
        });
    
        this.uiElements.maxHeightTextBox.addEventListener('change', function() {
            _this.maxHeightChangedEvent.notify();
        });
    
        this.uiElements.autoFitSlideCheckBox.addEventListener('change', function () {
            _this.autoFitSlideChangedEvent.notify();
        });
        
        this.uiElements.includeImagesCheckBox.addEventListener('change', function () {
            _this.includeImagesChangedEvent.notify();
        });
        
        this.uiElements.includeGifsCheckBox.addEventListener('change', function () {
            _this.includeGifsChangedEvent.notify();
        });
        
        this.uiElements.includeWebmsCheckBox.addEventListener('change', function () {
            _this.includeWebmsChangedEvent.notify();
        });

        this.uiElements.includeExplicitCheckBox.addEventListener('change', function () {
            _this.includeExplicitChangedEvent.notify();
        });

        this.uiElements.includeQuestionableCheckBox.addEventListener('change', function () {
            _this.includeQuestionableChangedEvent.notify();
        });

        this.uiElements.includeSafeCheckBox.addEventListener('change', function () {
            _this.includeSafeChangedEvent.notify();
        });

        this.uiElements.includeDupesCheckBox.addEventListener('change', function () {
            _this.includeDupesChangedEvent.notify();
        });
        
        this.uiElements.blacklist.addEventListener('change', function () {
            _this.blacklistChangedEvent.notify();
        });
    
        this.uiElements.hideBlacklist.addEventListener('change', function () {
            _this.hideBlacklistChangedEvent.notify();
        });
        
        this.uiElements.derpibooruApiKey.addEventListener('change', function () {
            _this.derpibooruApiKeyChangedEvent.notify();
        });

        this.uiElements.e621Login.addEventListener('change', function () {
            _this.e621LoginChangedEvent.notify();
        });

        this.uiElements.e621ApiKey.addEventListener('change', function () {
            _this.e621ApiKeyChangedEvent.notify();
        });

        this.uiElements.storeHistoryCheckBox.addEventListener('change', function () {
            _this.storeHistoryChangedEvent.notify();
        });

        this.uiElements.clearHistoryButton.addEventListener('click', function () {
            _this.clearHistoryClickedEvent.notify();
        });

        this.uiElements.favoriteButton.addEventListener('click', function() {
            _this.favoriteButtonClickedEvent.notify();
        });
    }

    clearUI() {
        this.clearWarningMessage();
        this.clearInfoMessage();
        this.clearImage();
        this.clearVideo();
        this.hideNavigation();
        this.clearThumbnails();
    }

    windowResized() {
        if (this._model.autoFitSlide)
        {
            this.tryToUpdateSlideSize();
        }
    }
	
	isDisplayingWarningMessage() {
		return this.uiElements.warningMessage.style.display == 'block';
	}
	
    displayWarningMessage(message) {
        this.uiElements.warningMessage.innerHTML = message;
        this.uiElements.warningMessage.style.display = 'block';
    }

    clearWarningMessage() {
        this.uiElements.warningMessage.innerHTML = '';
        this.uiElements.warningMessage.style.display = 'none';
    }
	
	displayInfoMessage(message) {
        this.uiElements.infoMessage.innerHTML = message;
        this.uiElements.infoMessage.style.display = 'block';
    }

    clearInfoMessage() {
        this.uiElements.infoMessage.innerHTML = '';
        this.uiElements.infoMessage.style.display = 'none';
    }

    updateSlidesAndNavigation() {
        this.updateSlides();
        this.updateNavigation();
        this.toggleTags(true);
    }

    updateSlides() {
        this.displayCurrentSlide();
        this.updateFavoriteButton();
        this.showThumbnails();
    }

    setupLoadingAnimation() {
        var _this = this;

        this.uiElements.currentImage.onload = function () {
            _this.hideLoadingAnimation();
        }
		
		this.uiElements.currentVideo.addEventListener('loadeddata', function() {
			_this.hideLoadingAnimation();
		}, false);
    }

    displayCurrentSlide() {
        if (this._model.hasSlidesToDisplay())
		{
            this.displaySlide();
        }
		else if (this.isDisplayingWarningMessage())
		{
			// Current warning message more important
		}
        else
		{
			var message = '';
		
            var includingImagesOrGifs = (this._model.includeImages || this._model.includeGifs);

            var {explicit, questionable, safe} = {
                "explicit": this._model.includeExplicit,
                "questionable": this._model.includeQuestionable,
                "safe": this._model.includeSafe
            };

            let messageStart = `No ${explicit && questionable && safe ? "explicit," :
                explicit && (questionable || safe) ? "explicit or" :
                explicit ? "explicit" :
                ""} ${questionable && safe ? "questionable or" :
                questionable ? "questionable" :
                ""} ${safe ? "safe" :
                ""}`;
			
			if (includingImagesOrGifs && this._model.includeWebms)
                message = messageStart + ' images were found.';
            else if (includingImagesOrGifs && !this._model.includeWebms)
                message = messageStart + ' images or videos were found.';
            else if (!includingImagesOrGifs && this._model.includeWebms)
                message = messageStart + ' videos were found.';
			
            this.displayWarningMessage(message);
        }
    }

    displaySlide() {
        this.showLoadingAnimation();

        var currentSlide = this._model.getCurrentSlide();

        if (currentSlide == null)
            return;
		
		if (currentSlide.isImageOrGif())
		{
			this.displayImage(currentSlide);
		}
		else if (currentSlide.isVideo())
		{
			this.displayVideo(currentSlide);
		}
		else
		{
			console.log("Trying to display slide that isn't an image or video.")
		}
    }
	
	displayImage(currentSlide) {
        var currentImage = this.uiElements.currentImage;

        currentImage.src = currentSlide.fileUrl;
        currentImage.setAttribute('alt', currentSlide.id);
        currentImage.style.display = 'inline';
		
		this.clearVideo();
        this.updateSlideSize();
    }
	
	displayVideo(currentSlide) {
        var currentVideo = this.uiElements.currentVideo;

        currentVideo.src = currentSlide.fileUrl;
        currentVideo.style.display = 'inline';

		this.clearImage();
        this.updateSlideSize();
		this.updateVideoVolume();
		this.updateVideoMuted();
    }
	
	getVideoVolume() {
		return this.uiElements.currentVideo.volume;
    }
	
	getVideoMuted() {
        return this.uiElements.currentVideo.muted;
    }

    tryToUpdateSlideSize() {
        if (this._model.hasSlidesToDisplay())
        {
			this.updateSlideSize();
		}
    }
	
    updateSlideSize() {
        var currentSlide = this._model.getCurrentSlide();

        if (currentSlide == null)
            return;

        var currentImage = this.uiElements.currentImage;
        var currentVideo = this.uiElements.currentVideo;
        
        var autoFitSlide = this._model.autoFitSlide;

        currentImage.style.width = null;
        currentImage.style.height = null;
        currentImage.style.maxWidth = null;
        currentImage.style.maxHeight = null;
		
		currentVideo.style.width = null;
        currentVideo.style.height = null;
        currentVideo.style.maxWidth = null;
        currentVideo.style.maxHeight = null;
        
        if (autoFitSlide)
        {
            var viewWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            var viewHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

            var newWidth = currentSlide.width;
            var newHeight = currentSlide.height;

            var viewRatio = viewWidth / viewHeight;
            var newRatio = newWidth / newHeight;
            
            if (newRatio > viewRatio)
            {
                newWidth = viewWidth;
                newHeight = viewWidth / newRatio;
            }
            else
            {
                newWidth = viewHeight * newRatio;
                newHeight = viewHeight;
            }
            
			if (currentSlide.isImageOrGif())
			{
				currentImage.style.width = newWidth + 'px';
				currentImage.style.height = newHeight + 'px';
			}
			else if (currentSlide.isVideo())
			{
				currentVideo.style.width = newWidth + 'px';
				currentVideo.style.height = newHeight + 'px';
			}
			else
			{
				console.log("Couldn't update slide size because slide isn't image or video.");
			}
        }
        else
        {
            if (this._model.maxWidth != null)
			{
                var maxWidth = parseInt(this._model.maxWidth);
                
				if (currentSlide.isImageOrGif())
				{
					currentImage.style.maxWidth = maxWidth + 'px';
				}
				else if (currentSlide.isVideo())
				{
					currentVideo.style.maxWidth = maxWidth + 'px';
				}
				else
				{
					console.log("Couldn't update slide max width because slide isn't image or video.");
				}
			}
			
            if (this._model.maxHeight != null)
			{
                var maxHeight = parseInt(this._model.maxHeight);
                
				if (currentSlide.isImageOrGif())
				{
					currentImage.style.maxHeight = maxHeight + 'px';
				}
				else if (currentSlide.isVideo())
				{
					currentVideo.style.maxHeight = maxHeight + 'px';
				}
				else
				{
					console.log("Couldn't update slide max height because slide isn't image or video.");
				}
            }
        }
    }

    clearImage() {
        var currentImage = this.uiElements.currentImage;

        currentImage.src = '';
        currentImage.removeAttribute('alt');
        currentImage.style.display = 'none';
    }
	
	clearVideo() {
        var currentVideo = this.uiElements.currentVideo;

        currentVideo.src = '';
        currentVideo.style.display = 'none';
    }
	
	updateVideoVolume() {
		this.isSettingVolume = true;
        this.uiElements.currentVideo.volume = this._model.videoVolume;
		this.isSettingVolume = false;
    }
	
	updateVideoMuted() {
		this.isSettingMute = true;
        this.uiElements.currentVideo.muted = this._model.videoMuted;
		this.isSettingMute = false;
    }

    showLoadingAnimation() {
        this.uiElements.loadingAnimation.style.display = 'inline';
    }

    hideLoadingAnimation() {
        this.uiElements.loadingAnimation.style.display = 'none';
    }

    showNavigation() {
        this.uiElements.navigation.style.display = 'block';
    }

    updateNavigation() {
        if (this._model.hasSlidesToDisplay())
        {
            this.updateNavigationButtonsAndDisplay();
            this.showNavigation();
        }
        else
        {
            this.hideNavigation();
        }
    }

    updateNavigationButtonsAndDisplay() {
        this.updateCurrentNumberDisplay();
        this.updateTotalNumberDisplay();

        this.updateFirstPreviousButtons();
        this.updatePlayPauseButtons();
        this.updateNextLastButtons();
    }

    updateCurrentNumberDisplay() {
        this.uiElements.currentSlideNumber.innerHTML = this._model.getCurrentSlideNumber();
    }

    updateTotalNumberDisplay() {
        var totalNumberText = this._model.getSlideCount();

        if (this._model.areThereMoreLoadableSlides()) {
            totalNumberText += '+';
        }

        this.uiElements.totalSlideNumber.innerHTML = totalNumberText;
    }

    updateFirstPreviousButtons() {
        var currentlyOnFirstSlide = (this._model.getCurrentSlideNumber() == 1);

        this.uiElements.firstNavButton.disabled = currentlyOnFirstSlide;
        this.uiElements.previousNavButton.disabled = currentlyOnFirstSlide;
    }

    updatePlayPauseButtons() {
        if (this._model.isPlaying) {
            this.uiElements.playButton.style.display = 'none';
            this.uiElements.pauseButton.style.display = 'inline';
        }
        else {
            this.uiElements.playButton.style.display = 'inline';
            this.uiElements.pauseButton.style.display = 'none';
        }
    }

    updateNextLastButtons() {
        var currentlyOnLastSlide = (this._model.getCurrentSlideNumber() == this._model.getSlideCount());

        this.uiElements.nextNavButton.disabled = currentlyOnLastSlide;
        this.uiElements.lastNavButton.disabled = currentlyOnLastSlide;
    }

    hideNavigation() {
        this.uiElements.navigation.style.display = 'none';
    }

    showThumbnails() {
        this.clearThumbnails();

        if (this._model.getSlideCount() <= 0)
            return;
        
        var nextSlides = this._model.getNextSlidesForThumbnails();

        if (nextSlides == null)
            return;

        var _this = this;

        for (var i = 0; i < nextSlides.length; i++) {
            var slide = nextSlides[i];

            var showGreyedOut = !slide.isPreloaded
            this.displayThumbnail(slide.previewFileUrl, slide.id, showGreyedOut);

            slide.clearCallback();
            slide.addCallback(function () {
                var callbackSlide = this;
                _this.removeThumbnailGreyness(callbackSlide.id);
                _this._model.preloadNextUnpreloadedSlideAfterThisOneIfInRange(callbackSlide);
            });
        }
    }

    displayThumbnail(thumbnailImageUrl, thumbnailSlideId, showGreyedOut) {
        var thumbnailList = this.uiElements.thumbnailList;

        var newThumbnail = document.createElement("div");
        newThumbnail.classList.add("thumbnail");
        newThumbnail.setAttribute('title', thumbnailSlideId);

        var _this = this;
        newThumbnail.onclick = function () {
            _this._model.moveToThumbnailSlide(thumbnailSlideId);
        };

        var newThumbnailImage = document.createElement("img");
        newThumbnailImage.id = 'thumbnail-image-' + thumbnailSlideId;
        newThumbnailImage.classList.add("thumbnail-image");
        newThumbnailImage.src = thumbnailImageUrl;

        if (showGreyedOut) {
            newThumbnailImage.classList.add("thumbnail-image-greyed-out");
        }

        newThumbnail.appendChild(newThumbnailImage);
        thumbnailList.appendChild(newThumbnail);
    }

    removeThumbnailGreyness(thumbnailSlideId) {
        var thumbnail = document.getElementById('thumbnail-image-' + thumbnailSlideId);

        if (thumbnail != null) {
            this.removeClass(thumbnail, 'thumbnail-image-greyed-out');
        }
    }

    removeClass(element, classToRemove) {
        var regex = new RegExp('(?:^|\\s)' + classToRemove + '(?!\\S)')
        element.className = element.className.replace(regex, '');
    }

    clearThumbnails() {
        var thumbnailList = this.uiElements.thumbnailList;

        while (thumbnailList.firstChild) {
            thumbnailList.removeChild(thumbnailList.firstChild);
        }
    }

    getSearchText() {
        return this.uiElements.searchTextBox.value;
    }

    setFocusToSearchBox() {
        this.uiElements.searchTextBox.focus();
    }
	
	removeFocusFromSearchTextBox() {
        this.uiElements.searchTextBox.blur();
    }

    removeFocusFromSearchButton() {
        this.uiElements.searchButton.blur();
    }

    updateSitesToSearch() {
        var sitesToSearchElements = this.uiElements.sitesToSearch;

        for (var i = 0; i < sitesToSearchElements.length; i++) {
            var siteToSearch = sitesToSearchElements[i];

            var site = siteToSearch.value;
            var checked = this._model.sitesToSearch[site];

            siteToSearch.checked = checked;
			
			if (site == SITE_DERPIBOORU)
			{
				this.uiElements.derpibooruApiKeyContainer.style.display = checked ? 'inline' : 'none';
            }
            
            if (site == SITE_E621)
			{
                this.uiElements.e621LoginContainer.style.display = checked ? 'inline' : 'none';
				this.uiElements.e621ApiKeyContainer.style.display = checked ? 'inline' : 'none';
			}
        }
    }

    updateOptions() {
        this.updateSecondsPerSlide();
        this.updateMaxWidth();
        this.updateMaxHeight();
    }

    getSecondsPerSlide() {
        return this.uiElements.secondsPerSlideTextBox.value;
    }

    updateSecondsPerSlide() {
        this.uiElements.secondsPerSlideTextBox.value = this._model.secondsPerSlide;
    }

    enableOrDisableMaxWidthAndHeight() {
        var textBoxesDisabled = !this._model.areMaxWithAndHeightEnabled();

        this.uiElements.maxWidthTextBox.disabled = textBoxesDisabled;
        this.uiElements.maxHeightTextBox.disabled = textBoxesDisabled;
    }

    getMaxWidth() {
        return this.uiElements.maxWidthTextBox.value;
    }

    updateMaxWidth() {
        var maxWidth = this._model.maxWidth;

        if (maxWidth == null)
        {
            maxWidth = "";
        }
        
        this.uiElements.maxWidthTextBox.value = maxWidth;
        this.tryToUpdateSlideSize();
    }

    getMaxHeight() {
        return this.uiElements.maxHeightTextBox.value;
    }

    updateMaxHeight() {
        var maxHeight = this._model.maxHeight;

        if (maxHeight == null) {
            maxHeight = "";
        }

        this.uiElements.maxHeightTextBox.value = maxHeight;
        this.tryToUpdateSlideSize();
    }

    getAutoFitSlide() {
        return this.uiElements.autoFitSlideCheckBox.checked;
    }
	
	getIncludeImages() {
        return this.uiElements.includeImagesCheckBox.checked;
    }
	
	getIncludeGifs() {
        return this.uiElements.includeGifsCheckBox.checked;
    }
	
	getIncludeWebms() {
        return this.uiElements.includeWebmsCheckBox.checked;
    }

    getIncludeExplicit() {
        return this.uiElements.includeExplicitCheckBox.checked;
    }

    getIncludeQuestionable() {
        return this.uiElements.includeQuestionableCheckBox.checked;
    }

    getIncludeSafe() {
        return this.uiElements.includeSafeCheckBox.checked;
    }

    getIncludeDupes() {
        return this.uiElements.includeDupesCheckBox.checked;
    }

    getStoreHistory() {
        return this.uiElements.storeHistoryCheckBox.checked;
    }

    updateAutoFitSlide() {
        this.uiElements.autoFitSlideCheckBox.checked = this._model.autoFitSlide;

        this.enableOrDisableMaxWidthAndHeight();

        this.tryToUpdateSlideSize();
    }
	
	updateIncludeImages() {
        this.uiElements.includeImagesCheckBox.checked = this._model.includeImages;
    }
	
	updateIncludeGifs() {
        this.uiElements.includeGifsCheckBox.checked = this._model.includeGifs;
    }
	
	updateIncludeWebms() {
        this.uiElements.includeWebmsCheckBox.checked = this._model.includeWebms;
    }

    updateIncludeExplicit() {
        this.uiElements.includeExplicitCheckBox.checked = this._model.includeExplicit;
    }

    updateIncludeQuestionable() {
        this.uiElements.includeQuestionableCheckBox.checked = this._model.includeQuestionable;
    }

    updateIncludeSafe() {
        this.uiElements.includeSafeCheckBox.checked = this._model.includeSafe;
    }

    updateIncludeDupes() {
        this.uiElements.includeDupesCheckBox.checked = this._model.includeDupes;
    }

    updateStoreHistory() {
        this.uiElements.storeHistoryCheckBox.checked = this._model.storeHistory;
    }

    updateSearchHistory() {
        var searchHistory = this.uiElements.searchHistory;

        while (searchHistory.hasChildNodes())
        {
            searchHistory.removeChild(searchHistory.lastChild);
        }

        for (let i = 0; i < this._model.searchHistory.length; i++)
        {
            
            var searchHistoryItem = this._model.searchHistory[i];
            
            var optionElement = document.createElement("option");
            optionElement.value = searchHistoryItem;

            searchHistory.appendChild(optionElement);
        }
    }
	
	getHideBlacklist() {
        return this.uiElements.hideBlacklist.checked;
    }

    getBlacklist() {
        return this.uiElements.blacklist.value;
    }

    updateHideBlacklist() {
        this.uiElements.hideBlacklist.checked = this._model.hideBlacklist;

        this.hideOrShowBlacklist();
    }

    updateBlacklist() {
        this.uiElements.blacklist.value = this._model.blacklist.trim();
		//this.validateBlacklist();
    }
	
	/*validateBlacklist() {
        var blacklist = this.uiElements.blacklist.value;
		
		var pattern = new RegExp(/[^\s]+/i);
		console.log(pattern.test(blacklist));
    }*/
	
	getDerpibooruApiKey() {
        return this.uiElements.derpibooruApiKey.value.trim();
    }

    updateDerpibooruApiKey() {
        this.uiElements.derpibooruApiKey.value = this._model.derpibooruApiKey;
    }

    getE621Login() {
        return this.uiElements.e621Login.value.trim();
    }

    updateE621Login() {
        this.uiElements.e621Login.value = this._model.e621Login;
    }

    getE621ApiKey() {
        return this.uiElements.e621ApiKey.value.trim();
    }

    updateE621ApiKey() {
        this.uiElements.e621ApiKey.value = this._model.e621ApiKey;
    }

    openUrlInNewWindow(url) {
        window.open(url, '_blank');
    }
	
	showSiteOffline(site) {
		var sitesToSearchElements = this.uiElements.sitesToSearch;
		
		for (var i = 0; i < sitesToSearchElements.length; i++)
		{
			var siteToSearch = sitesToSearchElements[i];
			
			if (siteToSearch.value == site)
			{
				siteToSearch.parentElement.classList.add("siteOffline");
				return;
			}			
		}
    }
    
    hideOrShowBlacklist()
    {
        this.uiElements.blacklistContainer.style.display = this._model.hideBlacklist ? "none" : "block";
    }

    downloadCurrentSlide()
    {
        let currentSlide = this._model.getCurrentSlide();

        if (currentSlide == null)
            return;
        
        let url = currentSlide.fileUrl;
        
        let filename = "bs/" + url.substring(url.lastIndexOf('/')+1);
        
        chrome.downloads.download({
            url: currentSlide.fileUrl,
            filename: filename,
            conflictAction: "overwrite"
        });
    }

    openCurrentSlide()
    {
        let currentSlide = this._model.getCurrentSlide();
        
        if (currentSlide == null)
            return;

        window.open(currentSlide.viewableWebsitePostUrl, "_blank");
    }

    updateFavoriteButton() {
        if (this._model.isCurrentSlideFaved())
        {
            this.uiElements.favoriteButton.classList.add("faved");
        }
        else
        {
            this.uiElements.favoriteButton.classList.remove("faved");
        }
    }

    toggleTags(update)
    {
        if(this.uiElements.tags.style.display == "none" && !update)
        {
            this.uiElements.tags.style.display = "block";
            this.uiElements.tags.innerHTML = this._model.getCurrentSlide().tags;
        }
        else if (this.uiElements.tags.style.display == "block" && update)
        {
            this.uiElements.tags.innerHTML = this._model.getCurrentSlide().tags;
        }
        else
        {
            this.uiElements.tags.style.display = "none";
            this.uiElements.tags.innerHTML = "";
        }
    }
}