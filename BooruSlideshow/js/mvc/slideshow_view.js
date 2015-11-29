function SlideshowView(slideshowModel, uiElements) {
    this._model = slideshowModel;
    this.uiElements = uiElements;

    this.currentImageClickedEvent = new Event(this);
    this.searchButtonClickedEvent = new Event(this);
    this.firstNavButtonClickedEvent = new Event(this);
    this.previousNavButtonClickedEvent = new Event(this);
    this.nextNavButtonClickedEvent = new Event(this);
    this.lastNavButtonClickedEvent = new Event(this);
    this.playButtonClickedEvent = new Event(this);
    this.pauseButtonClickedEvent = new Event(this);
    this.enterKeyPressedOutsideOfSearchTextBoxEvent = new Event(this);
    this.searchTextChangedEvent = new Event(this);
    this.enterKeyPressedInSearchTextBoxEvent = new Event(this);
    this.sitesToSearchChangedEvent = new Event(this);
    this.secondsPerImageChangedEvent = new Event(this);
    this.maxWidthChangedEvent = new Event(this);
    this.maxHeightChangedEvent = new Event(this);

    var _this = this;

    // Attach model listeners
    this._model.currentImageChangedEvent.attach(function () {
        _this.updateImagesAndNavigation();
    });

    this._model.playingChangedEvent.attach(function () {
        _this.updatePlayPauseButtons();
    });

    this._model.sitesToSearchUpdatedEvent.attach(function () {
        _this.updateSitesToSearch();
    });

    this._model.secondsPerImageUpdatedEvent.attach(function () {
        _this.updateSecondsPerImage();
    });

    this._model.maxWidthUpdatedEvent.attach(function () {
        _this.updateMaxWidth();
    });

    this._model.maxHeightUpdatedEvent.attach(function () {
        _this.updateMaxHeight();
    });

    // Attach UI element listeners
    this.uiElements.currentImage.addEventListener('click', function() {
        _this.currentImageClickedEvent.notify();
    });

    this.uiElements.searchTextBox.addEventListener('change', function () {
        _this.searchTextChangedEvent.notify();
    });

    this.uiElements.searchTextBox.addEventListener('keypress', function (e) {
        var key = e.which || e.keyCode;

        if (key == 13) {
            _this.enterKeyPressedInSearchTextBoxEvent.notify();
        }
    });

    this.uiElements.searchButton.addEventListener('click', function() {
        _this.searchButtonClickedEvent.notify();
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

        if (!(key == 37 || key == 39 || key == 13))
        {
            return;
        }

        if (document.activeElement !== _this.uiElements.searchTextBox &&
            document.activeElement !== _this.uiElements.searchButton &&
			document.activeElement !== _this.uiElements.secondsPerImageTextBox &&
			document.activeElement !== _this.uiElements.maxWidthTextBox &&
			document.activeElement !== _this.uiElements.maxHeightTextBox) {

            if (key == 37)
                _this.previousNavButtonClickedEvent.notify();
            if (key == 39)
                _this.nextNavButtonClickedEvent.notify();
            if (key == 13)
                _this.enterKeyPressedOutsideOfSearchTextBoxEvent.notify();
        }
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

    this.uiElements.secondsPerImageTextBox.addEventListener('change', function () {
        _this.secondsPerImageChangedEvent.notify();
    });

    this.uiElements.maxWidthTextBox.addEventListener('change', function () {
        _this.maxWidthChangedEvent.notify();
    });

    this.uiElements.maxHeightTextBox.addEventListener('change', function() {
        _this.maxHeightChangedEvent.notify();
    });

    this.initialize();
}

SlideshowView.prototype = {
    initialize: function () {
        this.setupLoadingAnimation();

        this.setFocusToSearchBox();
    },

    clearUI: function () {
        this.clearWarningMessage();
        this.clearImage();
        this.hideNavigation();
        this.clearThumbnails();
    },

    displayWarningMessage: function (message) {
        this.uiElements.warningMessage.innerHTML = message;
        this.uiElements.warningMessage.style.display = 'block';
    },

    clearWarningMessage: function () {
        this.uiElements.warningMessage.innerHTML = '';
        this.uiElements.warningMessage.style.display = 'none';
    },

    updateImagesAndNavigation: function () {
        this.updateImages();
        this.updateNavigation();
    },

    updateImages: function () {
        this.displayCurrentImage();
        this.showThumbnails();
    },

    setupLoadingAnimation: function () {
        var _this = this;

        this.uiElements.currentImage.onload = function () {
            _this.hideLoadingAnimation();
        }
    },

    displayCurrentImage: function () {
        if (this._model.hasImagesToDisplay()) {
            var currentPost = this._model.getCurrentPost();

            this.displayImage(currentPost.fileUrl, currentPost.id);
        }
        else {
            this.displayWarningMessage('No images were found.');
        }
    },

    displayImage: function (imageUrl, postId) {
        this.showLoadingAnimation();

        var currentImage = this.uiElements.currentImage;

        currentImage.src = imageUrl;
        currentImage.setAttribute('alt', postId);
        currentImage.style.display = 'inline';

        if (this._model.maxWidth != null)
        {
            var maxWidth = parseInt(this._model.maxWidth);
            currentImage.style.maxWidth = maxWidth + 'px';
        }
        else
        {
            currentImage.style.maxWidth = null;
        }

        if (this._model.maxHeight != null) {
            var maxHeight = parseInt(this._model.maxHeight);
            currentImage.style.maxHeight = maxHeight + 'px';
        }
        else {
            currentImage.style.maxHeight = null;
        }
    },

    clearImage: function () {
        var currentImage = this.uiElements.currentImage;

        currentImage.src = '';
        currentImage.removeAttribute('alt');
        currentImage.style.display = 'none';
    },

    showLoadingAnimation: function () {
        this.uiElements.loadingAnimation.style.display = 'inline';
    },

    hideLoadingAnimation: function () {
        this.uiElements.loadingAnimation.style.display = 'none';
    },

    showNavigation: function () {
        this.uiElements.navigation.style.display = 'block';
    },

    updateNavigation: function () {
        if (this._model.hasImagesToDisplay())
        {
            this.updateNavigationButtonsAndDisplay();
            this.showNavigation();
        }
        else
        {
            this.hideNavigation();
        }
    },

    updateNavigationButtonsAndDisplay: function () {
        this.updateCurrentNumberDisplay();
        this.updateTotalNumberDisplay();

        this.updateFirstPreviousButtons();
        this.updatePlayPauseButtons();
        this.updateNextLastButtons();
    },

    updateCurrentNumberDisplay: function () {
        this.uiElements.currentImageNumber.innerHTML = this._model.getCurrentImageNumber();
    },

    updateTotalNumberDisplay: function () {
        var totalNumberText = this._model.getImageCount();

        if (this._model.areThereMoreLoadableImages()) {
            totalNumberText += '+';
        }

        this.uiElements.totalImageNumber.innerHTML = totalNumberText;
    },

    updateFirstPreviousButtons: function () {
        var currentlyOnFirstImage = (this._model.getCurrentImageNumber() == 1);

        this.uiElements.firstNavButton.disabled = currentlyOnFirstImage;
        this.uiElements.previousNavButton.disabled = currentlyOnFirstImage;
    },

    updatePlayPauseButtons: function () {
        if (this._model.isPlaying) {
            this.uiElements.playButton.style.display = 'none';
            this.uiElements.pauseButton.style.display = 'inline';
        }
        else {
            this.uiElements.playButton.style.display = 'inline';
            this.uiElements.pauseButton.style.display = 'none';
        }
    },

    updateNextLastButtons: function () {
        var currentlyOnLastImage = (this._model.getCurrentImageNumber() == this._model.getImageCount());

        this.uiElements.nextNavButton.disabled = currentlyOnLastImage;
        this.uiElements.lastNavButton.disabled = currentlyOnLastImage;
    },

    hideNavigation: function () {
        this.uiElements.navigation.style.display = 'none';
    },

    showThumbnails: function () {
        this.clearThumbnails();

        if (this._model.getImageCount() > 1) {
            var nextPosts = this._model.getNextPostsForThumbnails();
            var _this = this;

            for (var i = 0; i < nextPosts.length; i++) {
                var post = nextPosts[i];

                var showGreyedOut = !post.isPreloaded
                this.displayThumbnail(post.previewFileUrl, post.id, showGreyedOut);

                post.clearCallback();
                post.addCallback(function () {
                    var post = this;
                    _this.removeThumbnailGreyness(post.id);
                    _this._model.preloadNextUnpreloadedImageAfterThisOneIfInRange(post);
                });
            }
        }
    },

    displayThumbnail: function (thumbnailImageUrl, id, showGreyedOut) {
        var thumbnailList = this.uiElements.thumbnailList;

        var newThumbnail = document.createElement("div");
        newThumbnail.classList.add("thumbnail");
        newThumbnail.setAttribute('title', id);

        var _this = this;
        newThumbnail.onclick = function () {

            _this._model.moveToImage(id);
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
    },

    removeThumbnailGreyness: function (id) {
        var thumbnail = document.getElementById('thumbnail-image-' + id);

        if (thumbnail != null) {
            this.removeClass(thumbnail, 'thumbnail-image-greyed-out');
        }
    },

    removeClass: function(element, classToRemove) {
        var regex = new RegExp('(?:^|\\s)' + classToRemove + '(?!\\S)')
        element.className = element.className.replace(regex, '');
    },

    clearThumbnails: function () {
        var thumbnailList = this.uiElements.thumbnailList;

        while (thumbnailList.firstChild) {
            thumbnailList.removeChild(thumbnailList.firstChild);
        }
    },

    getSearchText: function () {
        return this.uiElements.searchTextBox.value;
    },

    setFocusToSearchBox: function() {
        this.uiElements.searchTextBox.focus();
    },

    updateSitesToSearch: function () {
        var sitesToSearchElements = this.uiElements.sitesToSearch;

        for (var i = 0; i < sitesToSearchElements.length; i++) {
            var siteToSearch = sitesToSearchElements[i];

            var site = siteToSearch.value;
            var checked = this._model.sitesToSearch[site];

            siteToSearch.checked = checked;
        }
    },

    updateOptions: function () {
        this.updateSecondsPerImage();
        this.updateMaxWidth();
        this.updateMaxHeight();
    },

    getSecondsPerImage: function () {
        return this.uiElements.secondsPerImageTextBox.value;
    },

    updateSecondsPerImage: function () {
        this.uiElements.secondsPerImageTextBox.value = this._model.secondsPerImage;
    },

    getMaxWidth: function () {
        return this.uiElements.maxWidthTextBox.value;
    },

    updateMaxWidth: function () {
        var maxWidth = this._model.maxWidth;

        if (maxWidth == null)
        {
            maxWidth = "";
        }
        
        this.uiElements.maxWidthTextBox.value = maxWidth;
    },

    getMaxHeight: function () {
        return this.uiElements.maxHeightTextBox.value;
    },

    updateMaxHeight: function () {
        var maxHeight = this._model.maxHeight;

        if (maxHeight == null) {
            maxHeight = "";
        }

        this.uiElements.maxHeightTextBox.value = maxHeight;
    },

    openUrlInNewWindow: function (url) {
        window.open(url, '_blank');
    }
};