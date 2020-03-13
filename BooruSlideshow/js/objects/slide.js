class Slide
{
	constructor(siteId, id, fileUrl, previewFileUrl, viewableWebsitePostUrl, width, height, date, score, mediaType, md5, tags)
	{
		this.siteId = siteId;
		this.id = id;
		this.fileUrl = fileUrl;
		this.previewFileUrl = previewFileUrl;
		this.viewableWebsitePostUrl = viewableWebsitePostUrl;
		this.width = width;
		this.height = height;
		this.date = date;
		this.score = score;
		this.mediaType = mediaType;
		this.md5 = md5;
		this.tags = tags;
		this.isPreloaded = false;
		this.isPreloading = false;
		this.preloadingImage = null;
		this.preloadingVideo = null;
		this.callbackToRunAfterPreloadingFinishes = null;
	}

	clone()
	{
		return new Slide(
			this.siteId,
			this.id,
			this.fileUrl,
			this.previewFileUrl,
			this.viewableWebsitePostUrl,
			this.width,
			this.height,
			this.date,
			this.score,
			this.mediaType,
			this.md5,
			this.tags
		);
	}

	preload()
	{
		if (!this.isPreloaded && !this.isPreloading)
		{
			this.isPreloading = true;
			
			if (this.isImageOrGif())
				this.preloadImage();
			else if (this.isVideo())
				this.preloadVideo();
			else
			{
				console.log("Couldn't determine type of media to preload.");
				console.log(this);
			}
		}
	}

	preloadImage()
	{
		this.preloadingImage = new Image();
		
		var slide = this;
		
		this.preloadingImage.onload = function(){
			slide.isPreloaded = true;
			slide.isPreloading = false;
			
			if (slide.callbackToRunAfterPreloadingFinishes != null)
			{
				slide.callbackToRunAfterPreloadingFinishes.call(slide);
			}
		}
		
		this.preloadingImage.onerror = function(){
			this.isPreloading = false;
		}
		
		this.preloadingImage.src = this.fileUrl;
	}

	preloadVideo()
	{
		this.preloadingVideo = document.createElement('video');
		
		var slide = this;
		
		this.preloadingVideo.addEventListener('loadeddata', function() {
			slide.isPreloaded = true;
			slide.isPreloading = false;
			
			if (slide.callbackToRunAfterPreloadingFinishes != null)
			{
				slide.callbackToRunAfterPreloadingFinishes.call(slide);
			}
		}, false);
		
		this.preloadingVideo.addEventListener('error', function() {
			this.isPreloading = false;
		}, true);
		
		this.preloadingVideo.src = this.fileUrl;
		this.preloadingVideo.load();
	}

	addCallback(callback)
	{
		this.callbackToRunAfterPreloadingFinishes = callback;
	}

	clearCallback()
	{
		this.callbackToRunAfterPreloadingFinishes = null;
	}

	isImageOrGif()
	{
		return this.mediaType == MEDIA_TYPE_IMAGE || this.mediaType == MEDIA_TYPE_GIF;
	}

	isVideo()
	{
		return this.mediaType == MEDIA_TYPE_VIDEO;
	}

	toString()
	{
		return 'Slide ' + this.id + ' ' + this.fileUrl + ' ' + this.fileUrl + ' ' + this.previewFileUrl + ' ' + this.width + ' ' + this.height;
	}
}