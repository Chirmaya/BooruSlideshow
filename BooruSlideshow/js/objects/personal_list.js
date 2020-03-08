class PersonalList
{
    constructor(personalListItems = [], dataLoader)
    {
        this.personalListItems = personalListItems;
        this.currentListItemIndex = null;
        this.dataLoader = dataLoader
        this.indexed = false
        if(personalListItems.length > 0){ 
            if(this.allTagged()){ 
                this.indexed = true
                return
            }
            this.getTags()
        }else{
            this.indexed = true
        }
    }

    allTagged(){
        var items = this.personalListItems.filter(item => (item.tags != "" && !item.tags) || typeof item.tags != "string")
        // console.log(items)
        return items.length == 0
    }

    getTags(){
        // console.log(this.personalListItems)
        var items = this.personalListItems
        // if(items[0].tags) return
        chrome.storage.sync.get(["savedIndex"], (obj) => {
            window.index = obj.savedIndex || 0
            // console.log(window.index)
        })
        var i = window.index
        var webRequester = new WebRequester()
        var _this = this
        // console.log(this)
        var getInterval = setInterval(async () => {
            // console.log(_this.indexed)
            if(!i) i = window.index
            if(items[i] && items[i].tags && typeof items[i].tags == "string"){ 
                i++
                console.log("return")
                _this.dataLoader.savePersonalList(items)
                return
            }
            if(i >= items.length){ 
                clearInterval(getInterval)
                console.log("Cleared")
                console.log(items)
                _this.dataLoader.savePersonalList(items)
                _this.indexed = true
                return
            }
            if(i % 10 == 0){
                console.log("Saved")
                chrome.storage.sync.set({'savedIndex': i});
                _this.dataLoader.savePersonalList(items)
            }
            if(items[i].siteId == SITE_E621){
                items[i].tags = await _this.getImageTagsE621(items[i].id, webRequester)
            }else if(items[i].siteId == SITE_RULE34){
                items[i].tags = await _this.getImageTagsRule34(items[i].id, webRequester)
            }else if(items[i].siteId == SITE_ATFBOORU){
                items[i].tags = await _this.getImageTagsATF(items[i].id, webRequester)
            }else if(items[i].siteId == SITE_DANBOORU){
                items[i].tags = await _this.getImageTagsDB(items[i].id, webRequester)
            }else if(items[i].siteId == SITE_DERPIBOORU){
                items[i].tags = await _this.getImageTagsDerp(items[i].id, webRequester)
            }else if(items[i].siteId == SITE_KONACHAN){
                items[i].tags = await _this.getImageTagsKona(items[i].id, webRequester)
            }else if(items[i].siteId == SITE_REALBOORU){
                items[i].tags = await _this.getImageTagsReal(items[i].id, webRequester)
            }else if(items[i].siteId == SITE_SAFEBOORU){
                items[i].tags = await _this.getImageTagsSafe(items[i].id, webRequester)
            }else if(items[i].siteId == SITE_XBOORU){
                items[i].tags = await _this.getImageTagsXB(items[i].id, webRequester)
            }else if(items[i].siteId == SITE_YANDERE){
                items[i].tags = await _this.getImageTagsYand(items[i].id, webRequester)
            }

// let SITE_YANDERE = 'YAND';
            i++
        }, 1000)
        // console.log(items)
    }

    condenseE621Tags(tags){
        var arr = []
		for(var prop in tags){
			arr = arr.concat(tags[prop])
        }
        // console.log(arr)
		return arr.join(" ")
    }

    getImageTagsE621(id, webRequester){
        return new Promise((resolve) => {
            webRequester.makeWebsiteRequest(`https://e621.net/posts.json?tags=id%3A${id}`, () => {
                var data = JSON.parse(arguments[1].xhr.responseText).posts[0]
                if(!data){ 
                    resolve("")
                    return
                }
                resolve(this.condenseE621Tags(data.tags))
            })
        })
    }

    // This is inefficient, but I'm lazy
    getImageTagsATF(id, webRequester){
        return new Promise((resolve) => {
            webRequester.makeWebsiteRequest(`https://booru.allthefallen.moe/posts.json?tags=id%3A${id}`, () => {
                var data = JSON.parse(arguments[1].xhr.responseText)[0]
                if(!data){ 
                    resolve("")
                    return
                }
                resolve(data.tag_string)
            })
        })
    }

    getImageTagsYand(id, webRequester){
        return new Promise((resolve) => {
            webRequester.makeWebsiteRequest(`https://yande.re/post.json?tags=id%3A${id}`, () => {
                var data = JSON.parse(arguments[1].xhr.responseText)[0]
                if(!data){ 
                    resolve("")
                    return
                }
                resolve(data.tags)
            })
        })
    }
    

    getImageTagsKona(id, webRequester){
        return new Promise((resolve) => {
            webRequester.makeWebsiteRequest(`https://konachan.com/post.json?tags=id%3A${id}`, () => {
                var data = JSON.parse(arguments[1].xhr.responseText)[0]
                if(!data){ 
                    resolve("")
                    return
                }
                resolve(data.tags)
            })
        })
    }

    getImageTagsReal(id, webRequester){
        return new Promise((resolve) => {
            webRequester.makeWebsiteRequest(`https://realbooru.com/index.php?page=dapi&s=post&q=index&tags=id%3A${id}`, () => {
                var parser = new DOMParser()
                var data = parser.parseFromString(arguments[1].xhr.responseText, "text/xml")
                if(!data){ 
                    resolve("")
                    return
                }
                resolve(data.getElementsByTagName("post")[0].getAttribute("tags"))
            })
        })
    }

    getImageTagsXB(id, webRequester){
        return new Promise((resolve) => {
            webRequester.makeWebsiteRequest(`https://xbooru.com/index.php?page=dapi&s=post&q=index&tags=id%3A${id}`, () => {
                var parser = new DOMParser()
                var data = parser.parseFromString(arguments[1].xhr.responseText, "text/xml")
                if(!data){ 
                    resolve("")
                    return
                }
                resolve(data.getElementsByTagName("post")[0].getAttribute("tags"))
            })
        })
    }

    getImageTagsSafe(id, webRequester){
        return new Promise((resolve) => {
            webRequester.makeWebsiteRequest(`https://safebooru.org/index.php?page=dapi&s=post&q=index&tags=id%3A${id}`, () => {
                var parser = new DOMParser()
                var data = parser.parseFromString(arguments[1].xhr.responseText, "text/xml")
                if(!data){ 
                    resolve("")
                    return
                }
                resolve(data.getElementsByTagName("post")[0].getAttribute("tags"))
            })
        })
    }

    getImageTagsDerp(id, webRequester){
        return new Promise((resolve) => {
            var possibleAddedKey
            chrome.storage.sync.get(["derpibooruApiKey"], (obj) => {possibleAddedKey = obj.derpibooruApiKey ? '&key=' + obj.derpibooruApiKey : ''})
            
            webRequester.makeWebsiteRequest(`https://derpibooru.org/search.json?q=id%3A${id}${possibleAddedKey}`, () => {
                var data = JSON.parse(arguments[1].xhr.responseText).search[0]
                var tags = data.tags
				tags = tags.replace(/,\s/gm,",")
				tags = tags.replace(/\s/gm,"_")
                tags = tags.replace(/,/gm," ")
                
                if(!data){ 
                    resolve("")
                    return
                }
                resolve(tags)
            })
        })
    }

    getImageTagsDB(id, webRequester){
        return new Promise((resolve) => {
            webRequester.makeWebsiteRequest(`https://danbooru.donmai.us/posts.json?tags=id%3A${id}`, () => {
                var data = JSON.parse(arguments[1].xhr.responseText)[0]
                if(!data){ 
                    resolve("")
                    return
                }
                resolve(data.tag_string)
            })
        })
    }

    getImageTagsRule34(id, webRequester){
        return new Promise((resolve) => {
            webRequester.makeWebsiteRequest(`https://rule34.xxx/index.php?page=dapi&s=post&q=index&tags=id%3A${id}`, () => {
                // console.log(arguments)
                var parser = new DOMParser()
                var data = parser.parseFromString(arguments[1].xhr.responseText, "text/xml")
                if(!data){ 
                    resolve("")
                    return
                }
                resolve(data.getElementsByTagName("post")[0].getAttribute("tags"))
            })
        })
    }

    tryToAdd(slide)
    {
        let match = this.personalListItems.find(function(item){
            if (item.siteId == slide.siteId && item.id == slide.id)
            {
                console.log("Can't add post to personal list because: match on siteId and postId");
                return true;
            }

            if (item.md5 == slide.md5)
            {
                console.log("Can't add post to personal list because: match on md5");
                return true;
            }
        });

        if (match)
        {
            console.log("Flicker or something, showing already in list.");
            return;
        }

        this.add(slide);
    }

    add(slide)
    {
        let newItem = slide.clone();
        // console.log(newItem)
        this.personalListItems.push(newItem);
    }

    tryToRemove(slide)
    {
        if (this.contains(slide))
        {
            this.remove(slide);
        }
    }

    remove(slide)
    {
        this.personalListItems = this.personalListItems.filter(function(item, index, array){
            if (item.siteId == slide.siteId && item.id == slide.id)
            {
                return false;
            }

            if (item.md5 == slide.md5)
            {
                return false;
            }

            return true;
        });
    }

    count()
    {
        return this.personalListItems.length;
    }

    getNextItemsForThumbnails()
    {
        if (this.currentListItem == null)
        {
            return [];
        }

        return personalListItems.slice(this.currentListItemIndex+1, this.currentListItemIndex + 10);
    }

    contains(slide)
    {
        let match = this.personalListItems.find(function(item){
            if (item.siteId == slide.siteId && item.id == slide.id)
            {
                return true;
            }

            if (item.md5 == slide.md5)
            {
                return true;
            }
        });

        return match;
    }

    get(index)
    {
        let li = this.personalListItems[index];
        let slide = new Slide(li.siteId, li.id, li.fileUrl, li.previewFileUrl, li.viewableWebsitePostUrl, li.width, li.height, li.date, li.score, li.mediaType, li.md5, li.tags);
        return slide;
    }

    getIndexById(id)
    {
        return this.personalListItems.findIndex(function(item){
            return item.id == id;
        });
    }
}