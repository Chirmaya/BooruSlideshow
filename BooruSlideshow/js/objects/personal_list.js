class PersonalList
{
    constructor(personalListItems = [], dataLoader)
    {
        this.personalListItems = personalListItems;
        this.currentListItemIndex = null;
        this.dataLoader = dataLoader;
        this.indexed = false;

        if (personalListItems.length > 0)
        { 
            if (this.areAllItemsTagged())
            { 
                this.indexed = true;
                return;
            }

            this.tagUntaggedItems();
        }
        else
        {
            this.indexed = true;
        }
    }

    areAllItemsTagged()
    {
        var items = this.personalListItems.filter(item => !item.tags || typeof item.tags != "string" || item.tags == "");
        
        return items.length == 0;
    }

    tagUntaggedItems()
    {
        var listItems = this.personalListItems

        chrome.storage.sync.get(["savedIndex"], (obj) => {
            window.index = obj.savedIndex || 0;
        });

        var listItemIndex = window.index;
        var webRequester = new WebRequester();
        var _this = this;
        
        var interval = setInterval(async () => {
            if (!listItemIndex)
                listItemIndex = window.index;

            if (!listItems[listItemIndex])
                return;

            let listItem = listItems[listItemIndex];
            
            if (listItems[listItemIndex] && listItems[listItemIndex].tags && typeof listItems[listItemIndex].tags == "string")
            { 
                listItemIndex++;
                console.log("Ignoring already-tagged item");
                _this.dataLoader.savePersonalList(listItems);
                
                return;
            }
            
            if(listItemIndex >= listItems.length - 1){ 
                clearInterval(interval);
                console.log("Done tagging personal item list");
                _this.dataLoader.savePersonalList(listItems);
                _this.indexed = true;

                return;
            }

            // Will need to handle items that fail. Perhaps the ID is for a deleted image.

            if (listItem.siteId == SITE_E621){
                listItem.tags = await _this.getImageTagsE621(listItem.id, webRequester);
            }else if (listItem.siteId == SITE_RULE34){
                listItem.tags = await _this.getImageTagsRule34(listItem.id, webRequester);
            }else if (listItem.siteId == SITE_ATFBOORU){
                listItem.tags = await _this.getImageTagsATF(listItem.id, webRequester);
            }else if (listItem.siteId == SITE_DANBOORU){
                listItem.tags = await _this.getImageTagsDB(listItem.id, webRequester);
            }else if (listItem.siteId == SITE_DERPIBOORU){
                listItem.tags = await _this.getImageTagsDerp(listItem.id, webRequester);
            }else if (listItem.siteId == SITE_KONACHAN){
                listItem.tags = await _this.getImageTagsKona(listItem.id, webRequester);
            }else if (listItem.siteId == SITE_REALBOORU){
                listItem.tags = await _this.getImageTagsReal(listItem.id, webRequester);
            }else if (listItem.siteId == SITE_SAFEBOORU){
                listItem.tags = await _this.getImageTagsSafe(listItem.id, webRequester);
            }else if (listItem.siteId == SITE_XBOORU){
                listItem.tags = await _this.getImageTagsXB(listItem.id, webRequester);
            }else if (listItem.siteId == SITE_YANDERE){
                listItem.tags = await _this.getImageTagsYand(listItem.id, webRequester);
            }

            if(listItemIndex % 10 == 0){
                console.log("Saved personal item list");
                chrome.storage.sync.set({'savedIndex': listItemIndex});
                _this.dataLoader.savePersonalList(listItems);

                console.log(listItems);
            }

            listItemIndex++;
        }, 1000)
    }

    condenseE621Tags(tags)
    {
        var condensedTagArray = [];

		for(var prop in tags)
		{
			condensedTagArray = condensedTagArray.concat(tags[prop]);
		}

		return condensedTagArray.join(" ");
    }

    getImageTagsE621(id, webRequester)
    {
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
    getImageTagsATF(id, webRequester)
    {
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

    getImageTagsYand(id, webRequester)
    {
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
    

    getImageTagsKona(id, webRequester)
    {
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

    getImageTagsReal(id, webRequester)
    {
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

    getImageTagsXB(id, webRequester)
    {
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

    getImageTagsSafe(id, webRequester)
    {
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

    getImageTagsDerp(id, webRequester)
    {
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

    getImageTagsDB(id, webRequester)
    {
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

    getImageTagsRule34(id, webRequester)
    {
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