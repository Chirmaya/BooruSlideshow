class DataLoader
{
    constructor(model)
    {
        this._model = model;
    }

    async loadUserSettings()
    {
        //console.log("DataLoader.loadUserSettings");

        var _this = this;

        // rework to promises?
        let obj = await this.getUserSettingsFromBrowser();

        if (obj == null)
        {
            return;
        }
    
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
        var includeExplicit = obj['includeExplicit'];
        var includeQuestionable = obj['includeQuestionable'];
        var includeSafe = obj['includeSafe'];
        var hideBlacklist = obj['hideBlacklist'];
        var blacklist = obj['blacklist'];
        var derpibooruApiKey = obj['derpibooruApiKey'];
        var e621Login = obj['e621Login'];
        var e621ApiKey = obj['e621ApiKey'];
        var gelbUserId = obj['gelbUserId'];
        var gelbApiKey = obj['gelbApiKey'];
        var storeHistory = obj['storeHistory'];
        var searchHistory = obj['searchHistory'];
        var includeDupes = obj['includeDupes'];
        var personalListItems = obj['personalListItems'];
        
        if (videoVolume == null)
        {
            _this._model.setVideoVolume(_this._model.videoVolume);
        }
        else
        {
            if (_this._model.videoVolume != videoVolume)
            {
                _this._model.setVideoVolume(videoVolume);
            }
        }
        
        if (videoMuted == null)
        {
            _this._model.setVideoMuted(_this._model.videoMuted);
        }
        else
        {
            if (_this._model.videoMuted != videoMuted)
            {
                _this._model.setVideoMuted(videoMuted);
            }
        }
        
        if (_this._model.secondsPerSlide != secondsPerSlide)
        {
            _this._model.setSecondsPerSlideIfValid(secondsPerSlide);
        }

        if (_this._model.maxWidth != maxWidth)
        {
            _this._model.setMaxWidth(maxWidth);
        }

        if (_this._model.maxHeight != maxHeight)
        {
            _this._model.setMaxHeight(maxHeight);
        }
        
        if (autoFitSlide != null)
        {
            if (_this._model.autoFitSlide != autoFitSlide)
            {
                _this._model.setAutoFitSlide(autoFitSlide);
            }
        }
        
        if (_this._model instanceof SlideshowModel)
        {
            if (sitesToSearch != null)
            {
                let cleanSitesToSearch = Object.assign({}, _this.sitesToSearch);

                _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_DANBOORU);
                _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_DERPIBOORU);
                _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_E621);
                _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_GELBOORU);
                _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_KONACHAN);
                _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_RULE34);
                _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_SAFEBOORU);
                _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_XBOORU);
                _this.addPropertyIfExists(sitesToSearch, cleanSitesToSearch, SITE_YANDERE);

                _this._model.setSitesToSearch(cleanSitesToSearch);
            }

            if (includeImages == null)
            {
                _this._model.setIncludeImages(_this._model.includeImages);
            }
            else
            {
                _this._model.setIncludeImages(includeImages);
            }
            
            if (includeGifs == null)
            {
                _this._model.setIncludeGifs(_this._model.includeGifs);
            }
            else
            {
                _this._model.setIncludeGifs(includeGifs);
            }
            
            if (includeWebms != null)
            {
                _this._model.setIncludeWebms(includeWebms);
            }

            if (includeExplicit != null)
            {
                _this._model.setIncludeExplicit(includeExplicit);
            }

            if (includeQuestionable != null)
            {
                _this._model.setIncludeQuestionable(includeQuestionable);
            }

            if (includeSafe != null)
            {
                _this._model.setIncludeSafe(includeSafe);
            }

            if (includeDupes != null)
            {
                _this._model.setIncludeDupes(includeDupes);
            }
            
            if (hideBlacklist != null)
            {
                _this._model.setHideBlacklist(hideBlacklist);
            }
            
            if (blacklist != null && _this._model.blacklist != blacklist)
            {
                _this._model.setBlacklist(blacklist);
            }
            
            if (derpibooruApiKey != null && _this._model.derpibooruApiKey != derpibooruApiKey)
            {
                _this._model.setDerpibooruApiKey(derpibooruApiKey);
            }

            if (e621Login != null && _this._model.e621Login != e621Login)
            {
                _this._model.setE621Login(e621Login);
            }

            if (e621ApiKey != null && _this._model.e621ApiKey != e621ApiKey)
            {
                _this._model.setE621ApiKey(e621ApiKey);
            }

            if (gelbUserId != null && _this._model.gelbUserId != gelbUserId)
            {
                _this._model.setGelbUserId(gelbUserId);
            }

            if (gelbApiKey != null && _this._model.gelbApiKey != gelbApiKey)
            {
                _this._model.setGelbApiKey(gelbApiKey);
            }
            
            if (storeHistory != null)
            {
                _this._model.setStoreHistory(storeHistory);
            }

            if (searchHistory != null)
            {
                _this._model.setSearchHistory(searchHistory);
            }

            if (personalListItems == null)
            {
                _this._model.setPersonalList(_this._model.personalList);
            }
            else
            {
                var personalList = new PersonalList(personalListItems, _this);

                if (_this._model.personalList != personalList)
                {
                    var personalList = 
                    _this._model.setPersonalList(personalList);
                }
            }
        }
    }

    async getUserSettingsFromBrowser()
    {
        let storageKeys = [
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
            'includeExplicit',
            'includeQuestionable',
            'includeSafe',
			'hideBlacklist',
			'blacklist',
            'derpibooruApiKey',
            'e621Login',
            'e621ApiKey',
            'gelbUserId',
            'gelbApiKey',
            'storeHistory',
            'searchHistory',
            'includeDupes',
            'personalListItems'
        ];

        return new Promise(
            function (resolve, reject)
            {
                chrome.storage.sync.get(
                    storageKeys,
                    (result) => {
                        if (chrome.runtime.lastError)
                        {
                            reject(chrome.runtime.lastError);
                        } else {
                            console.log("Finished obtaining slideshow settings from browser data.");
                            resolve(result);
                        }
                    }
                );
            }
        )
    }

    addPropertyIfExists(sitesToSearch, cleanSitesToSearch, siteEnum)
    {
        if (sitesToSearch.hasOwnProperty(siteEnum))
        {
            cleanSitesToSearch[siteEnum] = sitesToSearch[siteEnum];
        }
    }
	
    saveVideoVolume()
    {
        chrome.storage.sync.set({'videoVolume': this._model.videoVolume});
    }
	
    saveVideoMuted()
    {
        chrome.storage.sync.set({'videoMuted': this._model.videoMuted});
    }

    saveSitesToSearch()
    {
        chrome.storage.sync.set({'sitesToSearch': this._model.sitesToSearch});
    }

    saveSecondsPerSlide()
    {
        chrome.storage.sync.set({'secondsPerSlide': this._model.secondsPerSlide});
    }

    saveMaxWidth()
    {
        chrome.storage.sync.set({'maxWidth': this._model.maxWidth});
    }

    saveMaxHeight()
    {
        chrome.storage.sync.set({'maxHeight': this._model.maxHeight});
    }

    saveAutoFitSlide()
    {
        chrome.storage.sync.set({'autoFitSlide': this._model.autoFitSlide});
    }

	
    saveIncludeImages()
    {
        chrome.storage.sync.set({'includeImages': this._model.includeImages});
    }
	
    saveIncludeGifs()
    {
        chrome.storage.sync.set({'includeGifs': this._model.includeGifs});
    }
	
    saveIncludeWebms()
    {
        chrome.storage.sync.set({'includeWebms': this._model.includeWebms});
    }

    saveIncludeExplicit()
    {
        chrome.storage.sync.set({'includeExplicit': this._model.includeExplicit});
    }

    saveIncludeQuestionable()
    {
        chrome.storage.sync.set({'includeQuestionable': this._model.includeQuestionable});
    }

    saveIncludeSafe()
    {
        chrome.storage.sync.set({'includeSafe': this._model.includeSafe});
    }
	
    saveHideBlacklist()
    {
        chrome.storage.sync.set({'hideBlacklist': this._model.hideBlacklist});
    }

    saveBlacklist()
    {
        chrome.storage.sync.set({'blacklist': this._model.blacklist});
    }
	
    saveDerpibooruApiKey()
    {
        chrome.storage.sync.set({'derpibooruApiKey': this._model.derpibooruApiKey});
    }

    saveE621Login()
    {
        chrome.storage.sync.set({'e621Login': this._model.e621Login});
    }

    saveE621ApiKey()
    {
        chrome.storage.sync.set({'e621ApiKey': this._model.e621ApiKey});
    }

    saveGelbUserId()
    {
        chrome.storage.sync.set({'gelbUserId': this._model.gelbUserId});
    }

    saveGelbApiKey()
    {
        chrome.storage.sync.set({'gelbApiKey': this._model.gelbApiKey});
    }

    saveStoreHistory()
    {
        chrome.storage.sync.set({'storeHistory': this._model.storeHistory});
    }

    saveSearchHistory()
    {
        chrome.storage.sync.set({'searchHistory': this._model.searchHistory});
    }

    saveIncludeDupes()
    {
        chrome.storage.sync.set({'includeDupes': this._model.includeDupes});
    }

    savePersonalList(items)
    {
        chrome.storage.local.set({'personalListItems': items ? items : this._model.personalList.personalListItems});
    }
}