class SiteManagerIbSearch extends SiteManager
{
    constructor(sitesManager, pageLimit)
    {
		super(sitesManager, SITE_IBSEARCH, 'https://ibsearch.xxx', pageLimit);
    }
    
    buildPingRequestUrl()
	{
		return this.url + '/api/v1/images.json?limit=1';
    }
    
    buildRequestUrl(searchText, pageNumber)
	{
		var query = this.buildSiteSpecificQuery(searchText);
		
		return this.url + '/api/v1/images.json?q=' + query + '&page=' + pageNumber + '&limit=' + this.pageLimit + '&sources=1';
	}

	doesResponseTextIndicateOnline(responseText)
	{
		var jsonPosts;
		
		try
		{
			jsonPosts = JSON.parse(responseText);
		}
		catch(e)
		{
			console.log("JSON failed to parse.");
			console.log(e);
			return false;
		}
		
		if (jsonPosts == null)
			return false;
		
		return (jsonPosts.length > 0);
	}

	addSlides(responseText)
	{
		this.addJsonSlides(responseText);
	}

	addSlide(jsonPost)
	{
		if (!jsonPost.hasOwnProperty('path'))
			return;

		if (!this.isPathForSupportedMediaType(jsonPost.path))
			return;
		
		if (this.areSomeTagsAreBlacklisted(jsonPost.tags))
			return;
		
		var date;
		
		if (jsonPost.site_uploaded != null)
			date = new Date(this.convertSDateToDate(jsonPost.site_uploaded));
		else
			date = new Date(this.convertSDateToDate(jsonPost.found));
		
		var newSlide = new Slide(
			SITE_IBSEARCH,
			jsonPost.id,
			'https://im1.ibsearch.xxx/' + jsonPost.path,
			'https://im1.ibsearch.xxx/t' + jsonPost.path,
			this.url + '/images/' + jsonPost.id,
			jsonPost.width,
			jsonPost.height,
			date,
			0,// No score
			this.getMediaTypeFromPath(jsonPost.path),
			jsonPost.md5
		);
		
		this.allUnsortedSlides.push(newSlide);
	}
}