class PersonalListModel{
    constructor()
    {
        this.view = null;
        
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

        this.personalList = new PersonalList();
        this.filtered = false;
        this.filteredPersonalList = null;

        this.currentSlideChangedEvent = new Event(this);
        this.playingChangedEvent = new Event(this);
        this.videoVolumeUpdatedEvent = new Event(this);
        this.secondsPerSlideUpdatedEvent = new Event(this);
        this.maxWidthUpdatedEvent = new Event(this);
        this.maxHeightUpdatedEvent = new Event(this);
        this.autoFitSlideUpdatedEvent = new Event(this);
        this.personalListLoadedEvent = new Event(this);

        this.dataLoader = new DataLoader(this);

        this.currentListItem = 0;
    }

    loadUserSettings()
    {
        this.dataLoader.loadUserSettings();
    }

    performFilter(filterText)
    {
        var filterWordsAsArray = filterText.split(" ");

        var orTags = filterWordsAsArray.filter(tag => tag.startsWith("~"));
        var orRegex = new RegExp("\\s" + orTags.join("\\s|\\s"));
        orRegex = new RegExp(orRegex.toString().replace(/~/g, "").slice(1, -1) + "\\s", "gi");
        
        var notTags = filterWordsAsArray.filter(tag => tag.startsWith("-"));
        var notRegex = new RegExp("\\s" + notTags.join("\\s|\\s"));
        notRegex = new RegExp(notRegex.toString().replace(/-/g, "").slice(1, -1) + "\\s", "gi");
        
        this.filtered = true;

        var items = this.personalList.personalListItems.filter((item) => {
            var passedOr = true;
            var passedWild = true;

            if (!item.tags ||
                typeof item.tags != "string" ||
                item.tags == "")
                return false;
            
            let tags = " " + item.tags.split(" ").join("  ") + " ";
            
            for(let i = 0; i < filterWordsAsArray.length; i++){
                let filterWord = filterWordsAsArray[i];

                if (filterWord.startsWith("-") && !filterWord.endsWith("*"))
                {
                    let matched = tags.match(notRegex);
                    if (matched)
                        return false;
                }
                else if (filterWord.startsWith("-") && filterWord.endsWith("*") && item.tags.includes(" " + filterWord.slice(1, -1)))
                {
                    return false;
                }
                else if (filterWord.startsWith("~"))
                {
                    let matched = tags.match(orRegex);
                    
                    passedOr = matched && matched.length > 0;
                }
                else if (filterWord.endsWith("*") && !filterWord.startsWith("-"))
                {
                    passedWild = item.tags.includes(filterWord.slice(0, -1));
                }
            }

            let noOrNotWildTags = filterWordsAsArray.filter(tag => !tag.startsWith("-") && !tag.startsWith("~") && !tag.endsWith("*"));
            let noOrNotWildRegex = new RegExp("\\s" + noOrNotWildTags.join("\\s|\\s"));
            noOrNotWildRegex = new RegExp(noOrNotWildRegex.toString().slice(1, -1) + "\\s", "gi");
            
            let matched = tags.match(noOrNotWildRegex);
            
            return (noOrNotWildTags.length == 0 || (matched != null && matched.length == noOrNotWildTags.length)) &&
                passedOr &&
                passedWild;
        });

        this.filteredPersonalList = new PersonalList(items)
        this.currentListItem = 1
        this.currentSlideChangedEvent.notify()
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
        let listItemCount = this.filtered ? this.filteredPersonalList.count() : this.personalList.count();

        if (this.currentListItem < listItemCount)
        {
            this.currentListItem++;
            this.currentSlideChangedEvent.notify();
            this.restartSlideshowIfOn();
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
        let listItemCount = this.filtered ? this.filteredPersonalList.count() : this.personalList.count();
        
        if (this.currentListItem < listItemCount)
        {
            this.currentListItem += 10;

            if (this.currentListItem > listItemCount)
                this.currentListItem = listItemCount;

            this.currentSlideChangedEvent.notify();
            this.restartSlideshowIfOn();
        }
    }

    setSlideNumberToLast()
    {
        let listItemCount = this.filtered ? this.filteredPersonalList.count() : this.personalList.count();

        if (this.currentListItem != listItemCount)
        {
            this.currentListItem = listItemCount;
            this.currentSlideChangedEvent.notify();
            this.restartSlideshowIfOn();
        }
    }

    moveToThumbnailSlide(id)
    {
        var index = this.filtered ? this.filteredPersonalList.getIndexById(id) : this.personalList.getIndexById(id);

        if (index > -1)
        {
            this.currentListItem = index + 1;
            this.currentSlideChangedEvent.notify();
        }
    }

    preloadNextUnpreloadedSlideAfterThisOneIfInRange(slide)
    {
        //this.sitesManager.preloadNextUnpreloadedSlideAfterThisOneIfInRange(slide);
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

    /*startCountdown()
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
    }*/

    restartSlideshowIfOn()
    {
        
        if (this.isPlaying)
        {
            clearTimeout(this.timer);
            //this.sitesManager.clearCallbacksForPreloadingSlides();
		
            this.tryToStartCountdown();
        }
    }

    pauseSlideshow()
    {
        clearTimeout(this.timer);
        //this.sitesManager.clearCallbacksForPreloadingSlides();
        //this.sitesManager.clearCallbacksForLoadingSlides();

        this.isPlaying = false;

        this.playingChangedEvent.notify();
    }

    getPersonalListItemCount()
    {
        return this.filtered ? this.filteredPersonalList.count() : this.personalList.count();
    }

    hasPersonalListItems()
    {
        return (this.filtered ? this.filteredPersonalList.count() : this.personalList.count()) > 0;
    }

    hasNextSlide()
    {
        return (this.filtered ? this.filteredPersonalList.count() : this.personalList.count()) > this.getCurrentSlideNumber();
    }

    getCurrentSlide()
    {
        if (this.currentListItem == 0)
            return null;
        
        return this.filtered ? this.filteredPersonalList.get(this.currentListItem - 1) : this.personalList.get(this.currentListItem - 1);
    }

    getCurrentSlideNumber()
    {
        return this.currentListItem;
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
}