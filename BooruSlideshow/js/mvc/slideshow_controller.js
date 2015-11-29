function SlideshowController(uiElements) {
    this._model = new SlideshowModel();
    this._view = new SlideshowView(this._model, uiElements);

    this._view.updateSitesToSearch();
    this._view.updateOptions();

    var _this = this;

    // Attach view listeners
    this._view.currentImageClickedEvent.attach(function() {
        _this.currentImageClicked();
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

    this._view.secondsPerImageChangedEvent.attach(function () {
        _this.secondsPerImageChanged();
    });

    this._view.maxWidthChangedEvent.attach(function () {
        _this.maxWidthChanged();
    });

    this._view.maxHeightChangedEvent.attach(function () {
        _this.maxHeightChanged();
    });

    this._model.loadUserSettings();
}

SlideshowController.prototype = {
    currentImageClicked: function () {
        var currentPost = this._model.getCurrentPost();

        this._view.openUrlInNewWindow(currentPost.postOnSiteUrl);
    },

    firstNavButtonClicked: function () {
        this._model.setImageNumberToFirst();
    },

    previousNavButtonClicked: function () {
        this._model.decreaseCurrentImageNumber();
    },

    nextNavButtonClicked: function () {
        this._model.increaseCurrentImageNumber();
    },

    lastNavButtonClicked: function () {
        this._model.setImageNumberToLast();
    },

    playButtonClicked: function () {
        this._model.startSlideshow();
    },

    pauseButtonClicked: function () {
        this._model.pauseSlideshow();
    },

    enterKeyPressedOutsideOfSearchTextBox: function () {
        this._model.tryToPlayOrPause();
    },

    searchTextChanged: function () {
        this._model.searchText = this._view.getSearchText();
    },

    enterKeyPressedInSearchTextBox: function () {
        this._model.searchText = this._view.getSearchText();
        this.searchButtonClicked();
    },

    searchButtonClicked: function () {
        this._view.clearUI();

        var searchText = this._model.searchText;

        if (searchText == '')
        {
            this._view.displayWarningMessage('The search query is blank.');
            return;
        }

        var selectedSitesToSearch = this._model.getSelectedSitesToSearch();

        if (selectedSitesToSearch.length == 0)
        {
            this._view.displayWarningMessage('No sites were selected to be searched.');
            return;
        }

        this._model.performSearch(searchText);
    },

    sitesToSearchChanged: function(checked, site) {
        this._model.sitesToSearch[site] = checked;
        this._model.saveSitesToSearch();
    },

    secondsPerImageChanged: function () {
        var secondsPerImageText = this._view.getSecondsPerImage();

        if (secondsPerImageText == '')
            return;

        if (isNaN(secondsPerImageText))
            return;

        if (secondsPerImageText < 1)
            return;

        this._model.secondsPerImage = secondsPerImageText;
        this._model.saveSecondsPerImage();
    },

    maxWidthChanged: function () {
        var maxWidthText = this._view.getMaxWidth();

        if (maxWidthText == '')
        {
            this._model.maxWidth = null;
            return;
        }

        if (isNaN(maxWidthText))
            return;

        if (maxWidthText < 1)
            return;
        
        this._model.maxWidth = maxWidthText;
        this._model.saveMaxWidth();
    },

    maxHeightChanged: function () {
        var maxHeightText = this._view.getMaxHeight();
        
        if (maxHeightText == '') {
            this._model.maxHeight = null;
            return;
        }
        
        if (isNaN(maxHeightText))
            return;
        
        if (maxHeightText < 1)
            return;
        
        this._model.maxHeight = maxHeightText;
        this._model.saveMaxHeight();
    }
};