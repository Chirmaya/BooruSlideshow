class PersonalList
{
    constructor(personalListItems = [])
    {
        this.personalListItems = personalListItems;
        this.currentListItemIndex = null;
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
        console.log(newItem)
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