function SlideshowView(slideshowModel, uiElements) {
    this._model = slideshowModel;
    this.uiElements = uiElements;

    this.currentImageClickedEvent = new Event(this);
    this.searchTextChangedEvent = new Event(this);
    this.searchButtonClickedEvent = new Event(this);
    this.firstNavButtonClickedEvent = new Event(this);
    this.previousNavButtonClickedEvent = new Event(this);
    this.nextNavButtonClickedEvent = new Event(this);
    this.lastNavButtonClickedEvent = new Event(this);
    this.playButtonClickedEvent = new Event(this);
    this.pauseButtonClickedEvent = new Event(this);
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

    // Attach UI element listeners
    this.uiElements.currentImage.addEventListener('click', function() {
        _this.currentImageClickedEvent.notify();
    });

    this.uiElements.searchTextBox.addEventListener('change', function () {
        _this.searchTextChangedEvent.notify();
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

    var sitesToSearchElements = this.uiElements.sitesToSearch;

    for (var i = 0; i < sitesToSearchElements.length; i++)
    {
        var siteToSearch = sitesToSearchElements[i];

        siteToSearch.addEventListener('change', function (element) {
            _this.sitesToSearchChangedEvent.notify({
                checked: element.target.checked,
                site: element.target.value
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
}

SlideshowView.prototype = {
    displayWarningMessage: function (message) {
        //this.hideLoadingAnimation();
        this.uiElements.warningMessage.innerHTML = message;
        this.uiElements.warningMessage.style.display = 'block';
    },

    updateImagesAndNavigation: function () {
        this.updateImages();
        this.updateNavigation();
    },

    updateImages: function () {
        this.displayCurrentImage();
        this.showThumbnails();
    },

    showThumbnails: function () {
        this.clearThumbnails();

        if (this._model.getImageCount() > 1)
        {
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

    displayThumbnail: function(thumbnailImageUrl, id, showGreyedOut) {
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
        newThumbnailImage.src  = thumbnailImageUrl;
	
        if (showGreyedOut)
        {
            newThumbnailImage.classList.add("thumbnail-image-greyed-out");
        }
	
        newThumbnail.appendChild(newThumbnailImage);
        thumbnailList.appendChild(newThumbnail);
    },

    removeThumbnailGreyness: function (id) {
	    var thumbnail = document.getElementById('thumbnail-image-' + id);
	
        if (thumbnail != null)
        {
            removeClass(thumbnail, 'thumbnail-image-greyed-out');
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

    showLoadingAnimation: function () {
        this.uiElements.loadingAnimation.style.display = 'inline';
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

    updateSecondsPerImage: function () {
        this.uiElements.secondsPerImageTextBox.value = this._model.secondsPerImage;
    },

    updateMaxWidth: function () {
        var maxWidth = this._model.maxWidth;

        if (maxWidth == null)
        {
            maxWidth = "";
        }
        
        this.uiElements.maxWidthTextBox.value = maxWidth;
    },

    updateMaxHeight: function () {
        var maxHeight = this._model.maxHeight;

        if (maxHeight == null) {
            maxHeight = "";
        }

        this.uiElements.maxHeightTextBox.value = maxHeight;
    },

    clearUI: function () {
        this.clearWarningMessage();
        this.clearImage();
        this.clearThumbnails();
    },

    clearWarningMessage: function() {
        this.uiElements.warningMessage.innerHTML = '';
        this.uiElements.warningMessage.style.display = 'none';
    },

    clearImage: function () {
        var currentImage = this.uiElements.currentImage;
        
        currentImage.src = '';
        currentImage.removeAttribute('alt');
        currentImage.style.display = 'none';
    },

    hideLoadingAnimation: function () {
        this.uiElements.loadingAnimation.style.display = 'none';
    },

    clearThumbnails: function () {
        var thumbnailList = this.uiElements.thumbnailList;

        while (thumbnailList.firstChild)
        {
            thumbnailList.removeChild(thumbnailList.firstChild);
        }
    },

    hideNavigation: function () {
        this.uiElements.navigation.style.display = 'none';
    },

    openUrlInNewWindow: function (url) {
        window.open(url, '_blank');
    },

    getSearchText: function () {
        return this.uiElements.searchTextBox.value;
    },

    getSecondsPerImage: function () {
        return this.uiElements.secondsPerImageTextBox.value;
    },

    getMaxWidth: function () {
        return this.uiElements.maxWidthTextBox.value;
    },

    getMaxHeight: function () {
        return this.uiElements.maxHeightTextBox.value;
    }
};