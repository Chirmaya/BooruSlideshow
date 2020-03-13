class PersonalListView
{
    constructor (personalListModel, uiElements) {
        this._model = personalListModel;
        this.uiElements = uiElements;
        
        this.currentImageClickedEvent = new Event(this);
        this.currentVideoClickedEvent = new Event(this);
        this.currentVideoVolumeChangedEvent = new Event(this);
        this.filterButtonClickedEvent = new Event(this);
        this.firstNavButtonClickedEvent = new Event(this);
        this.previousNavButtonClickedEvent = new Event(this);
        this.nextNavButtonClickedEvent = new Event(this);
        this.lastNavButtonClickedEvent = new Event(this);
        this.goBackTenImagesPressedEvent = new Event(this);
        this.goForwardTenImagesPressedEvent = new Event(this);
        this.playButtonClickedEvent = new Event(this);
        this.pauseButtonClickedEvent = new Event(this);
        this.enterKeyPressedOutsideOfFilterTextBoxEvent = new Event(this);
        this.filterTextChangedEvent = new Event(this);
        this.enterKeyPressedInFilterTextBoxEvent = new Event(this);
        this.secondsPerSlideChangedEvent = new Event(this);
        this.maxWidthChangedEvent = new Event(this);
        this.maxHeightChangedEvent = new Event(this);
        this.autoFitSlideChangedEvent = new Event(this);
        this.removeCurrentImageFromFavesPressedEvent = new Event(this);

        this.isSettingVolume = false;
        this.isSettingMute = false;
    
        var _this = this;
        
        this.attachModelListeners();
        
        this.attachUiElementListeners();
    
        this.setupLoadingAnimation();

        //this.setFocusToFilterBox();
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

        this._model.personalListLoadedEvent.attach(function () {
            _this.clearWarningMessage();
            _this.clearInfoMessage();
            _this.updateSlidesAndNavigation();
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
                key == E_KEY_ID))
            {
                return;
            }
    
            if (document.activeElement !== _this.uiElements.filterTextBox &&
                document.activeElement !== _this.uiElements.secondsPerSlideTextBox &&
                document.activeElement !== _this.uiElements.maxWidthTextBox &&
                document.activeElement !== _this.uiElements.maxHeightTextBox &&
                document.activeElement !== _this.uiElements.blacklist &&
                document.activeElement !== _this.uiElements.derpibooruApiKey) {
                
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
                    if (document.activeElement !== _this.uiElements.filterButton)
                        _this.enterKeyPressedOutsideOfFilterTextBoxEvent.notify();
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
                    _this.removeCurrentImageFromFavesPressedEvent.notify();
                }
                if (key == E_KEY_ID)
                {
                    _this.openCurrentSlide();
                }
            }
        });
    
        this.uiElements.filterTextBox.addEventListener('change', function () {
            _this.filterTextChangedEvent.notify();
        });
    
        this.uiElements.filterTextBox.addEventListener('keypress', function (e) {
            var key = e.which || e.keyCode;
    
            if (key == ENTER_KEY_ID) {
                _this.enterKeyPressedInFilterTextBoxEvent.notify();
            }
        });
    
        this.uiElements.filterButton.addEventListener('click', function () {
            _this.filterButtonClickedEvent.notify();
        });
    
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
    }

    openCurrentSlide()
    {
        let currentSlide = this._model.getCurrentSlide();

        if (currentSlide == null)
            return;

        window.open(currentSlide.viewableWebsitePostUrl, "_blank");
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
    }

    updateSlides() {
        this.displayCurrentSlide();
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
        if (this._model.hasPersonalListItems())
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
			
			if (includingImagesOrGifs && this._model.includeWebms)
				message = 'No images or videos were found.';
			else if (includingImagesOrGifs && !this._model.includeWebms)
				message = 'No images were found.';
			else if (!includingImagesOrGifs && this._model.includeWebms)
				message = 'No videos were found.';
			
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
        if (this._model.hasPersonalListItems())
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
        if (this._model.hasPersonalListItems())
        {
            this.updateNavigationButtonsAndDisplay();
            this.showNavigation();
        }
        else
        {
            this.hideNavigation();
            this.displayInfoMessage("No images have been faved yet.");
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
        var totalNumberText = this._model.getPersonalListItemCount();

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
        var currentlyOnLastSlide = (this._model.getCurrentSlideNumber() == this._model.getPersonalListItemCount());

        this.uiElements.nextNavButton.disabled = currentlyOnLastSlide;
        this.uiElements.lastNavButton.disabled = currentlyOnLastSlide;
    }

    hideNavigation() {
        this.uiElements.navigation.style.display = 'none';
    }

    showThumbnails() {
        this.clearThumbnails();

        if (this._model.getPersonalListItemCount() > 1) {
            var nextSlides = this._model.getNextListItemsForThumbnails();
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
    }

    displayThumbnail(thumbnailImageUrl, id, showGreyedOut) {
        var thumbnailList = this.uiElements.thumbnailList;

        var newThumbnail = document.createElement("div");
        newThumbnail.classList.add("thumbnail");
        newThumbnail.setAttribute('title', id);

        var _this = this;
        newThumbnail.onclick = function () {

            _this._model.moveToThumbnailSlide(id);
        };

        var newThumbnailImage = document.createElement("img");
        newThumbnailImage.id = 'thumbnail-image-' + id;
        newThumbnailImage.classList.add("thumbnail-image");
        newThumbnailImage.src = thumbnailImageUrl;

        if (showGreyedOut) {
            newThumbnailImage.classList.add("thumbnail-image-greyed-out");
        }

        newThumbnail.appendChild(newThumbnailImage);
        thumbnailList.appendChild(newThumbnail);
    }

    removeThumbnailGreyness(id) {
        var thumbnail = document.getElementById('thumbnail-image-' + id);

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

    getFilterText() {
        return this.uiElements.filterTextBox.value;
    }

    setFocusToFilterBox() {
        this.uiElements.filterTextBox.focus();
    }
	
	removeFocusFromFilterTextBox() {
        this.uiElements.filterTextBox.blur();
    }

    removeFocusFromFilterButton() {
        this.uiElements.filterButton.blur();
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

    updateAutoFitSlide() {
        this.uiElements.autoFitSlideCheckBox.checked = this._model.autoFitSlide;

        this.enableOrDisableMaxWidthAndHeight();

        this.tryToUpdateSlideSize();
    }

    openUrlInNewWindow(url) {
        window.open(url, '_blank');
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
}