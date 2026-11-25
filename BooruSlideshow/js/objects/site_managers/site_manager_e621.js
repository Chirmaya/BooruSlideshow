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

		return (jsonPosts.length > 0);
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
			!jsonPost.hasOwnProperty('files') ||
			!jsonPost.files.hasOwnProperty('meta') ||
			!jsonPost.files.hasOwnProperty('preview') ||
			!jsonPost.files.hasOwnProperty('original') ||
			!jsonPost.files.original.hasOwnProperty('url') ||
			!jsonPost.hasOwnProperty('created_at') ||
			!jsonPost.hasOwnProperty('stats') ||
			!jsonPost.stats.hasOwnProperty('score') ||
			!jsonPost.hasOwnProperty('tags'))
			return;

		if (jsonPost.files.original.url == null)
		{
			// TODO: Make this into an option (though will need to figure out all the cases in which it happens to get a proper name for it)
			console.log("The file.url was null for post " + jsonPost.id + ". (This is caused by a global blacklist perhaps from not being logged in. Trying to recreate from md5.");

			jsonPost.files.original.url = this.RecreateUrlFromMd5(jsonPost.files.meta);

			if (jsonPost.files.original.url == null)
			{
				return;
			}
			else
			{
				console.log("New URL is: " + jsonPost.files.original.url);
			}
		}

		if (!this.isPathForSupportedMediaType(jsonPost.files.original.url))
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

		logForDev(urlPrefix + jsonPost.files.original.url + " ; " + urlPrefix + jsonPost.files.preview.url + " ; " + postUrl)

		var newSlide = new Slide(
			SITE_E621,
			jsonPost.id,
			urlPrefix + jsonPost.files.original.url,
			urlPrefix + jsonPost.files.preview.jpg,
			postUrl,
			jsonPost.files.original.width,
			jsonPost.files.original.height,
			new Date(jsonPost.created_at),
			jsonPost.stats.score,
			this.getMediaTypeFromPath(jsonPost.files.original.url),
			jsonPost.files.meta.md5,
			jsonPost.tags
		);

		this.allUnsortedSlides.push(newSlide);
	}

	RecreateUrlFromMd5(meta) 
	{
		// Ref: Discord > e621.net > Donovan DMC
		// Take the file.md5 (as an example: AABBCCCCCCCCCCCCCCCCCCCCCCCCCCCC)
		// and convert it to
		// https://static1.e621.net/data/AA/BB/AABBCCCCCCCCCCCCCCCCCCCCCCCCCCCC.{meta.ext}

		const BASE_PATH = 'https://static1.e621.net/data/';

		if (meta.md5 == null || meta.md5.length < 4 || meta.ext == null)
		{
			return null;
		}

		let firstTwoCharacters = meta.md5.substring(0, 2);
		let secondTwoCharacters = meta.md5.substring(2, 4);

		return `${BASE_PATH}/${firstTwoCharacters}/${secondTwoCharacters}/${meta.md5}.${meta.ext}`
	}
}