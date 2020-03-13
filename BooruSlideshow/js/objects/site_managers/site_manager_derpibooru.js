class SiteManagerDerpibooru extends SiteManager
{
    constructor(sitesManager, pageLimit)
    {
		super(sitesManager, SITE_DERPIBOORU, 'https://derpibooru.org', pageLimit);
    }
    
    buildPingRequestUrl()
	{
		return this.url + '/images.json';
    }
    
    buildRequestUrl(searchText, pageNumber)
	{
		var query = this.buildSiteSpecificQuery(searchText);
		
		var possibleAddedKey = this.sitesManager.model.derpibooruApiKey ? '&key=' + this.sitesManager.model.derpibooruApiKey : '';
		
		return this.url + '/search.json?q=' + this.prepareQueryForDerpibooru(query) + '&page=' + pageNumber + '&limit=' + this.pageLimit + possibleAddedKey;
	}

	prepareQueryForDerpibooru(searchQuery)
    {
        searchQuery = this.addCommasToSearchQuery(searchQuery);
        return this.replaceUnderscoresWithSpaces(searchQuery);
	}
	
	addCommasToSearchQuery(searchQuery)
	{
		return searchQuery.replace(" ", ",");
	}

	replaceUnderscoresWithSpaces(searchQuery)
	{
		let queryItems = searchQuery.split(",");

		for (let i = 0; i < queryItems.length; i++)
		{
			let queryItem = queryItems[i];

			if (this.startWith(queryItem, 'aspect_ratio'))
				continue;
			if (this.startWith(queryItem, 'comment_count'))
				continue;
			if (this.startWith(queryItem, 'created_at'))
				continue;
			if (this.startWith(queryItem, 'faved_by'))
				continue;
			if (this.startWith(queryItem, 'orig_sha512_hash'))
				continue;
			if (this.startWith(queryItem, 'sha512_hash'))
				continue;
			if (this.startWith(queryItem, 'source_url'))
				continue;

			queryItems[i] = queryItem.replace("_", " ");
		}
		
		return queryItems.join(',');
	}

	startWith(text, term)
	{
		return (text.substring(0,term.length) == term);
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
		
		// Derpibooru-only line
		jsonPosts = jsonPosts["images"];
		
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
		if (jsonPost.hasOwnProperty('image') &&
			jsonPost.hasOwnProperty('representations'))
		{
			if (this.isPathForSupportedMediaType(jsonPost.image))
			{
				var tags = jsonPost.tags;
				
				tags = tags.replace(/,\s/gm,",");
				tags = tags.replace(/\s/gm,"_");
				tags = tags.replace(/,/gm," ");
				
				if (this.areSomeTagsAreBlacklisted(tags))
					return;
				
				jsonPost.rating =
					jsonPost.tags.includes("explicit") ? "e" :
					jsonPost.tags.includes("suggestive") || jsonPost.tags.includes("questionable") ? "q" :
					"s";
				
				if (!this.isRatingAllowed(jsonPost.rating))
					return;
				
				var newSlide = new Slide(
					SITE_DERPIBOORU,
					jsonPost.id,
					"https://" + jsonPost.image,
					"https://" + jsonPost.representations["thumb"],
					this.url + '/' + jsonPost.id,
					jsonPost.width,
					jsonPost.height,
					new Date(jsonPost.created_at),
					jsonPost.score,
					this.getMediaTypeFromPath(jsonPost.image),
					jsonPost.sha512_hash,
					tags
				);
				
				this.allUnsortedSlides.push(newSlide);
			}
		}
	}
}