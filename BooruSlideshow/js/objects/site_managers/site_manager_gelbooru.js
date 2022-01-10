class SiteManagerGelbooru extends SiteManager
{
    constructor(sitesManager, pageLimit)
    {
		super(sitesManager, SITE_GELBOORU, 'https://gelbooru.com', pageLimit);
    }
    
    buildPingRequestUrl()
	{
		return this.url + '/index.php?page=dapi&s=post&q=index&limit=1';
    }
    
    buildRequestUrl(searchText, pageNumber)
	{
		var query = this.buildSiteSpecificQuery(searchText);
		
		return this.url + '/index.php?page=dapi&s=post&q=index&tags=' + query + '&pid=' + (pageNumber - 1) + '&limit=' + this.pageLimit;
	}

	doesResponseTextIndicateOnline(responseText)
	{
		var parser = new DOMParser();
		var xml = parser.parseFromString(responseText, "text/xml");
		
		var xmlPosts = xml.getElementsByTagName("post");
		
		return (xmlPosts.length > 0);
	}

	addSlides(responseText)
	{
		this.addXmlSlides(responseText);
	}

	addSlide(xmlPost)
	{

		if (xmlPost.getElementsByTagName("file_url").length > 0 &&
			xmlPost.getElementsByTagName('preview_url').length > 0)
		{
			if (this.isPathForSupportedMediaType(xmlPost.getElementsByTagName("file_url")[0].innerHTML))
			{
				if (this.areSomeTagsAreBlacklisted(xmlPost.getElementsByTagName('tags')[0].innerHTML))
					return;

				var newSlide = new Slide(
					SITE_GELBOORU,
					xmlPost.getElementsByTagName("id")[0].innerHTML,
					this.reformatFileUrl(xmlPost.getElementsByTagName("file_url")[0].innerHTML),
					this.reformatFileUrl(xmlPost.getElementsByTagName("preview_url")[0].innerHTML),
					this.url + '/index.php?page=post&s=view&id=' + xmlPost.getElementsByTagName("id")[0].innerHTML,
					xmlPost.getElementsByTagName("width")[0].innerHTML,
					xmlPost.getElementsByTagName("height")[0].innerHTML,
					new Date(xmlPost.getElementsByTagName("created_at")[0].innerHTML),
					xmlPost.getElementsByTagName("score")[0].innerHTML,
					this.getMediaTypeFromPath(xmlPost.getElementsByTagName("file_url")[0].innerHTML),
					xmlPost.getElementsByTagName("md5")[0].innerHTML,
					xmlPost.getElementsByTagName("tags")[0].innerHTML
				);

				this.allUnsortedSlides.push(newSlide);
			}
		}
	}
}
