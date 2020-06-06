class PersonalListModel{
    constructor()
    {
        this.view = null;

        this.loadedSlides = []
        
        this.videoVolume = 0;
        this.videoMuted = false;
        
        this.filterText = "";

        this.secondsPerSlide = 6;
        this.maxWidth = null;
        this.maxHeight = null;
        this.autoFitSlide = false;

        this.isPlaying = false;
        this.timer = null;
        this.timerMs = 0;

        this.sitesManager = null;

        this.dataLoader = new DataLoader(this);

        this.personalList = new PersonalList([], this.dataLoader, this);
        this.filtered = false
        this.filteredPersonalList = null

        this.currentSlideChangedEvent = new Event(this);
        this.playingChangedEvent = new Event(this);
        this.videoVolumeUpdatedEvent = new Event(this);
        this.secondsPerSlideUpdatedEvent = new Event(this);
        this.maxWidthUpdatedEvent = new Event(this);
        this.maxHeightUpdatedEvent = new Event(this);
        this.autoFitSlideUpdatedEvent = new Event(this);
        this.personalListLoadedEvent = new Event(this);


        this.currentListItem = 0;

        this.initialize();
    }

    initialize()
    {
        var numberOfSlidesToAlwaysHaveReadyToDisplay = 20;
        var maxNumberOfThumbnails = 10;

        /*this.sitesManager = new SitesManager(this, numberOfSlidesToAlwaysHaveReadyToDisplay, maxNumberOfThumbnails);
		
		var pageLimit = 100;
		
        this.sitesManager.addSite(SITE_ATFBOORU, pageLimit);
        this.sitesManager.addSite(SITE_DANBOORU, pageLimit);
        this.sitesManager.addSite(SITE_DERPIBOORU, 10);
        this.sitesManager.addSite(SITE_E621, pageLimit);
        this.sitesManager.addSite(SITE_GELBOORU, pageLimit);
        this.sitesManager.addSite(SITE_KONACHAN, pageLimit);
        this.sitesManager.addSite(SITE_REALBOORU, pageLimit);
        this.sitesManager.addSite(SITE_RULE34, pageLimit);
        this.sitesManager.addSite(SITE_SAFEBOORU, pageLimit);
        this.sitesManager.addSite(SITE_XBOORU, pageLimit);
        this.sitesManager.addSite(SITE_YANDERE, pageLimit);*/
    }

    loadUserSettings()
    {
        this.dataLoader.loadUserSettings();
    }

    performFilter(filterText)
    {
        //this.sitesManager.resetConnections();

        var _this = this;
        var filterTextAsArray = filterText.split(" ")
        var orTags = filterTextAsArray.filter(tag => tag.startsWith("~"))
        var orRegex = new RegExp("\\s" + orTags.join("\\s|\\s"))
        orRegex = new RegExp(orRegex.toString().replace(/~/g, "").slice(1, -1) + "\\s", "gi")
        var notTags = filterTextAsArray.filter(tag => tag.startsWith("-"))
        var notRegex = new RegExp("\\s" + notTags.join("\\s|\\s"))
        notRegex = new RegExp(notRegex.toString().replace(/-/g, "").slice(1, -1) + "\\s", "gi")
        this.filtered = true
        var items = this.personalList.personalListItems.filter((item) => {
            var passedOr = true
            var passedWild = true
            if(!item.tags) return false
            if(item.tags == "") return false
            if(typeof item.tags != "string") return false
            for(let i = 0; i < filterTextAsArray.length; i++){
                if(filterTextAsArray[i].startsWith("-") && !filterTextAsArray[i].endsWith("*")){
                    let tags = (" " + item.tags.split(" ").join("  ") + " ")
                    let matched = tags.match(notRegex)
                    if(matched) return false
                }else if(filterTextAsArray[i].startsWith("-") && filterTextAsArray[i].endsWith("*") && item.tags.includes(" " + filterTextAsArray[i].slice(1, -1))){
                    return false
                }else if(filterTextAsArray[i].startsWith("~")){
                    let tags = (" " + item.tags.split(" ").join("  ") + " ")
                    let matched = tags.match(orRegex)
                    // console.log(tags, regex, matched)
                    passedOr = matched && matched.length > 0
                }else if(filterTextAsArray[i].endsWith("*") && !filterTextAsArray[i].startsWith("-")){
                    passedWild = item.tags.includes(filterTextAsArray[i].slice(0, -1))
                }
            }
            let noOrNotWildTags = filterTextAsArray.filter(tag => !tag.startsWith("-") && !tag.startsWith("~") && !tag.endsWith("*"))
            let regex = new RegExp("\\s" + noOrNotWildTags.join("\\s|\\s"))
            regex = new RegExp(regex.toString().slice(1, -1) + "\\s", "gi")
            let tags = (" " + item.tags.split(" ").join("  ") + " ")
            let matched = tags.match(regex)
            // console.log(passedOr, passedWild, matched !=  null && matched.length == noOrNotWildTags.length)
            return (noOrNotWildTags.length == 0 || matched !=  null && matched.length == noOrNotWildTags.length) && passedOr && passedWild
        })
        this.filteredPersonalList = new PersonalList(items, this.dataLoader, this)
        this.currentListItem = 1
        this.currentSlideChangedEvent.notify()
        // console.log(this.filteredPersonalList)

        /*this.sitesManager.performFilter(filterText, function () {
			_this.view.clearInfoMessage();
            _this.currentSlideChangedEvent.notify();
        });*/
    }

    setSlideNumberToFirst()
    {
        if (this.currentListItem != 1)
        {
            this.currentListItem = 1;
            this.currentSlideChangedEvent.notify();
            this.restartSlideshowIfOn();
        }
    }

    decreaseCurrentSlideNumber()
    {
        if (this.currentListItem > 1)
        {
            this.currentListItem--;
            this.currentSlideChangedEvent.notify();
            this.restartSlideshowIfOn();
        }
    }

    increaseCurrentSlideNumber()
    {
        if(!this.filtered){
            if (this.currentListItem < this.personalList.count())
            {
                this.currentListItem++;
                this.currentSlideChangedEvent.notify();
                this.restartSlideshowIfOn();
            }
        }else{
            if (this.currentListItem < this.filteredPersonalList.count()){
                this.currentListItem++;
                this.currentSlideChangedEvent.notify();
                this.restartSlideshowIfOn();
            }
        }
    }
	
    decreaseCurrentSlideNumberByTen()
    {
        if (this.currentListItem > 1)
        {
            this.currentListItem -= 10;

            if (this.currentListItem < 1)
                this.currentListItem = 1;

            this.currentSlideChangedEvent.notify();
            this.restartSlideshowIfOn();
        }
    }
	
    increaseCurrentSlideNumberByTen()
    {
        if(!this.filtered){
            if (this.currentListItem < this.personalList.count())
            {
                this.currentListItem += 10;

                if (this.currentListItem > this.personalList.count())
                    this.currentListItem = this.personalList.count();

                this.currentSlideChangedEvent.notify();
                this.restartSlideshowIfOn();
            }
        }else{
            if (this.currentListItem < this.filteredPersonalList.count()){
                this.currentListItem += 10;

                if (this.currentListItem > this.filteredPersonalList.count())
                    this.currentListItem = this.filteredPersonalList.count();

                this.currentSlideChangedEvent.notify();
                this.restartSlideshowIfOn();
            }
        }
    }

    setSlideNumberToLast()
    {
        if(!this.filtered){
            if (this.currentListItem != this.personalList.count())
            {
                this.currentListItem = this.personalList.count();
                this.currentSlideChangedEvent.notify();
                this.restartSlideshowIfOn();
            }
        }else{
            if (this.currentListItem != this.filteredPersonalList.count())
            {
                this.currentListItem = this.filteredPersonalList.count();
                this.currentSlideChangedEvent.notify();
                this.restartSlideshowIfOn();
            }
        }
    }

    moveToSlide(id)
    {
        var index = this.filtered ? this.filteredPersonalList.getIndexById(id) : this.personalList.getIndexById(id);

        if (index > -1)
        {
            this.currentListItem = index + 1;
            this.currentSlideChangedEvent.notify();
        }
    }

    tryToPlayOrPause()
    {
        if (this.hasPersonalListItems())
        {
            if (this.isPlaying)
                this.pauseSlideshow();
            else
                this.startSlideshow();
        }
    }

    startSlideshow()
    {
        this.tryToStartCountdown();

        this.isPlaying = true;

        this.playingChangedEvent.notify();
    }

    tryToStartCountdown()
    {
        this.startCountdown()
        /*if (this.sitesManager.isCurrentSlideLoaded())
        {
            this.startCountdown();
        }
        else
        {
            var _this = this;

            this.sitesManager.runCodeWhenCurrentSlideFinishesLoading(function(){
                _this.startCountdown();
            });
        }*/
    }

    startCountdown()
    {
        var millisecondsPerSlide = this.secondsPerSlide * 1000;
	    
        var _this = this;

        this.timer = setTimeout(function() {
            if (_this.hasNextSlide())
            {
                // Continue slideshow
                _this.increaseCurrentSlideNumber();
            }
            else
            {
                // Loop when out of images/videos
                _this.setSlideNumberToFirst();
            }
		
        }, millisecondsPerSlide);
    }

    restartSlideshowIfOn()
    {
        
        if (this.isPlaying)
        {
            clearTimeout(this.timer);
            this.clearCallbacksForPreloadingSlides();
		
            this.tryToStartCountdown();
        }
    }

    clearCallbacksForPreloadingSlides() {
		if (this.currentListItem > 0) {
			var currentSlide = this.getCurrentSlide();
			currentSlide.clearCallback();
		}
	}

    pauseSlideshow()
    {
        clearTimeout(this.timer);
        this.clearCallbacksForPreloadingSlides();

        this.isPlaying = false;

        this.playingChangedEvent.notify();
    }

    getPersonalListItemCount()
    {
        return this.filtered ? this.filteredPersonalList.count() : this.personalList.count();
    }

    hasPersonalListItems()
    {
        return (this.filtered ? this.filteredPersonalList.count() : this.personalList.count() > 0);
    }

    hasNextSlide()
    {
        return (this.filtered ? this.filteredPersonalList.count() : this.personalList.count() > this.getCurrentSlideNumber());
    }

    getCurrentSlide()
    {
        if (this.currentListItem == 0)
            return null;
        let loadedSlide = this.loadedSlides.find(t => t.id == this.getCurrentSlideID())
        if(loadedSlide){ 
            return loadedSlide
        }
        return this.filtered ? this.filteredPersonalList.get(this.currentListItem - 1) : this.personalList.get(this.currentListItem - 1);
    }

    getCurrentSlideNumber()
    {
        return this.currentListItem;
    }

    getCurrentSlideID(){
        return this.filtered ? this.filteredPersonalList.personalListItems[this.currentListItem - 1].id : this.personalList.personalListItems[this.currentListItem - 1].id;
    }

    getNextListItemsForThumbnails()
    {
        return this.filtered ? this.filteredPersonalList.getNextItemsForThumbnails() : this.personalList.getNextItemsForThumbnails();
    }

    areMaxWithAndHeightEnabled()
    {
        return !this.autoFitSlide;
    }

    removeCurrentImageFromFaves()
    {
        let currentSlide = this.getCurrentSlide();

        if (currentSlide == null)
            return;

        this.personalList.tryToRemove(currentSlide);

        this.dataLoader.savePersonalList();

        if (this.currentListItem > (this.filtered ? this.filteredPersonalList.count() : this.personalList.count()))
            this.currentListItem = this.filtered ? this.filteredPersonalList.count() : this.personalList.count();

        this.personalListLoadedEvent.notify();
    }
	
    setVideoVolume(volume)
    {
        this.videoVolume = volume;

        this.dataLoader.saveVideoVolume();

        this.videoVolumeUpdatedEvent.notify();
    }
	
    setVideoMuted(muted)
    {
        this.videoMuted = muted;

        this.dataLoader.saveVideoMuted();

        this.videoVolumeUpdatedEvent.notify();
    }

    setSiteToSearch(site, checked)
    {
        this.sitesToSearch[site] = checked;

        this.dataLoader.saveSitesToSearch();

        this.sitesToSearchUpdatedEvent.notify();
    }
	
    setSecondsPerSlide(secondsPerSlide)
    {
        this.secondsPerSlide = secondsPerSlide;

        this.dataLoader.saveSecondsPerSlide();

        this.secondsPerSlideUpdatedEvent.notify();
    }
	
    setSecondsPerSlideIfValid(secondsPerSlide)
    {
		if (secondsPerSlide == '')
            return;

        if (isNaN(secondsPerSlide))
            return;

        if (secondsPerSlide < 1)
            return;

        this.setSecondsPerSlide(secondsPerSlide);
	}

    setMaxWidth(maxWidth)
    {
        this.maxWidth = maxWidth;

        this.dataLoader.saveMaxWidth();

        this.maxWidthUpdatedEvent.notify();
    }

    setMaxHeight(maxHeight)
    {
        this.maxHeight = maxHeight;

        this.dataLoader.saveMaxHeight();

        this.maxHeightUpdatedEvent.notify();
    }

    setAutoFitSlide(onOrOff)
    {
        this.autoFitSlide = onOrOff;

        this.dataLoader.saveAutoFitSlide();

        this.autoFitSlideUpdatedEvent.notify();
    }
	
    setIncludeImages(onOrOff)
    {
        this.includeImages = onOrOff;

        this.dataLoader.saveIncludeImages();

        this.includeImagesUpdatedEvent.notify();
    }
	
    setIncludeGifs(onOrOff)
    {
        this.includeGifs = onOrOff;

        this.dataLoader.saveIncludeGifs();

        this.includeGifsUpdatedEvent.notify();
    }
	
    setIncludeWebms(onOrOff)
    {
        this.includeWebms = onOrOff;

        this.dataLoader.saveIncludeWebms();

        this.includeWebmsUpdatedEvent.notify();
    }
	
    setHideBlacklist(onOrOff)
    {
        this.hideBlacklist = onOrOff;

        this.dataLoader.saveHideBlacklist();

        this.hideBlacklistUpdatedEvent.notify();
    }

    setBlacklist(blacklist)
    {
        this.blacklist = blacklist;

        this.dataLoader.saveBlacklist();

        this.blacklistUpdatedEvent.notify();
    }
	
    setDerpibooruApiKey(derpibooruApiKey)
    {
        this.derpibooruApiKey = derpibooruApiKey;

        this.dataLoader.saveDerpibooruApiKey();

        this.derpibooruApiKeyUpdatedEvent.notify();
    }

    setPersonalList(personalList)
    {
        this.personalList = personalList;

        this.dataLoader.savePersonalList();

        if (this.hasPersonalListItems() && this.currentListItem == 0)
            this.currentListItem = 1;

        this.personalListLoadedEvent.notify();
    }

    preloadCurrentSlideIfNeeded() {
        var currentSlide = this.getCurrentSlide()
        if(!currentSlide) return
        let _this = this
        currentSlide.preload();
        this.addLoadedSlide(currentSlide)
    }
    
    addLoadedSlide(slide){
        if(this.loadedSlides.find(t => t.id == slide.id)) return
        this.loadedSlides.push(slide)
    }

	preloadNextSlideIfNeeded() {
		if (this.currentListItem < this.getPersonalListItemCount()) {
			var currentSlide = this.getCurrentSlide();
			this.preloadNextUnpreloadedSlideIfInRange();
		}
	}

	preloadNextUnpreloadedSlideIfInRange() {
		if (this.currentListItem < this.getPersonalListItemCount()) {
			var nextSlides = this.getNextListItemsForThumbnails();

			for (var i = 0; i < nextSlides.length; i++) {
				if (!nextSlides[i]) return
				var slide = nextSlides[i];

				if (!slide.isPreloaded) {
                    slide.preload();
                    this.addLoadedSlide(slide)
					break;
				}
			}
		}
	}

	preloadNextUnpreloadedSlideAfterThisOneIfInRange(startingSlide) {
		if (this.currentListItem < this.getPersonalListItemCount()) {
            var nextSlides = this.getNextListItemsForThumbnails();
			if (!nextSlides) return
			var foundStartingSlide = false;

			for (var i = 0; i < nextSlides.length; i++) {
                var slide = nextSlides[i];

				if (foundStartingSlide || (this.currentListItem == 1 && startingSlide.id == this.getCurrentSlide(1).id)) {
                    foundStartingSlide = true;
                    var _this = this
					if (!slide.isPreloaded) {
                        slide.preload();
                        this.addLoadedSlide(slide)
						break;
					}
				}

				if (startingSlide.id == slide.id) {
					foundStartingSlide = true;
				}
			}
		}
	}

	isCurrentSlideLoaded() {
		if (this.currentListItem > 0) {
			return this.getCurrentSlide().isPreloaded;
		}
	}
}