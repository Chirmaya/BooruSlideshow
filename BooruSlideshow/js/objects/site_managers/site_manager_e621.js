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

		if (jsonPost.file.url == null)
		{
			// TODO: Make this into an option (though will need to figure out all the cases in which it happens to get a proper name for it)
			console.log("The file.url was null for post " + jsonPost.id + ". (This is caused by a global blacklist perhaps from not being logged in. Trying to recreate from md5.");
			
			jsonPost.file.url = this.RecreateUrlFromMd5(jsonPost.file);

			if (jsonPost.file.url == null)
			{
				return;
			}
			else
			{
				console.log("New URL is: " + jsonPost.file.url);
			}
		}
		
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

	RecreateUrlFromMd5(file)
	{
		// Ref: Discord > e621.net > Donovan DMC
		// Take the file.md5 (as an example: AABBCCCCCCCCCCCCCCCCCCCCCCCCCCCC)
		// and convert it to
		// https://static1.e621.net/data/AA/BB/AABBCCCCCCCCCCCCCCCCCCCCCCCCCCCC.{file.ext}
		
		const BASE_PATH = 'https://static1.e621.net/data/';

		if (file.md5 == null || file.md5.length < 4 || file.ext == null)
		{
			return null;
		}

		let firstTwoCharacters = file.md5.substring(0, 2);
		let secondTwoCharacters = file.md5.substring(2, 4);

		return `${BASE_PATH}/${firstTwoCharacters}/${secondTwoCharacters}/${file.md5}.${file.ext}`
	}
}