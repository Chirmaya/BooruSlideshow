class SiteManagerE621 extends SiteManager
{
    constructor(sitesManager, pageLimit)
    {
		super(sitesManager, SITE_E621, 'https://e621.net', pageLimit);
    }
    
    buildPingRequestUrl()
	{
		return this.url + '/posts.json?limit=1';
    }
    
    buildRequestUrl(searchText, pageNumber)
	{
		var query = this.buildSiteSpecificQuery(searchText);
		let possibleLogin = this.sitesManager.model.e621ApiKey && this.sitesManager.model.e621Login ? '&login=' + this.sitesManager.model.e621Login + '&api_key=' + this.sitesManager.model.e621ApiKey : '';
		return this.url + '/posts.json?tags=' + query + '&page=' + pageNumber + '&limit=' + this.pageLimit + possibleLogin;
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
		
		return (jsonPosts.posts.length > 0);
	}

	addSlides(responseText)
	{
		this.addJsonSlides(responseText);
	}

	condenseTags(jsonPostTags)
	{
		var condensedTagArray = [];

		for(var prop in jsonPostTags)
		{
			condensedTagArray = condensedTagArray.concat(jsonPostTags[prop]);
		}

		return condensedTagArray.join(" ");
	}

	addSlide(jsonPost)
	{
		if (!jsonPost.hasOwnProperty('id') ||
			!jsonPost.hasOwnProperty('file') ||
			!jsonPost.hasOwnProperty('preview') ||
			!jsonPost.hasOwnProperty('created_at') ||
			!jsonPost.hasOwnProperty('score') ||
			!jsonPost.hasOwnProperty('tags') ||
			!jsonPost.file.hasOwnProperty('url'))
			return;
		
		if (!this.isPathForSupportedMediaType(jsonPost.file.url))
			return;
		
		if (!this.isRatingAllowed(jsonPost.rating))
			return;

		jsonPost.tags = this.condenseTags(jsonPost.tags);
		
		if (this.areSomeTagsAreBlacklisted(jsonPost.tags))
			return;
		
		var postUrl = this.url + '/post/show/' + jsonPost.id;
		
		var urlPrefix = '';
		
		if (postUrl.substring(0, 4) != 'http')
			urlPrefix = 'https://';
		
		var newSlide = new Slide(
			SITE_E621,
			jsonPost.id,
			urlPrefix + jsonPost.file.url,
			urlPrefix + jsonPost.preview.url,
			postUrl,
			jsonPost.file.width,
			jsonPost.file.height,
			new Date(jsonPost.created_at),
			jsonPost.score,
			this.getMediaTypeFromPath(jsonPost.file.url),
			jsonPost.file.md5,
			jsonPost.tags
		);

		this.allUnsortedSlides.push(newSlide);
	}
}