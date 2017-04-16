var Slide = function (id, fileUrl, previewFileUrl, viewableWebsitePostUrl, width, height, date, score, mediaType)
{
	this.id = id;
	this.fileUrl = fileUrl;
	this.previewFileUrl = previewFileUrl;
	this.viewableWebsitePostUrl = viewableWebsitePostUrl;
	this.width = width;
	this.height = height;
	this.date = date;
	this.score = score;
	this.mediaType = mediaType;
	this.isPreloaded = false;
	this.isPreloading = false;
	this.preloadingImage = null;
	this.preloadingVideo = null;
	this.callbackToRunAfterPreloadingFinishes = null;
}

Slide.prototype.preload = function()
{
	if (!this.isPreloaded && !this.isPreloading)
	{
		this.isPreloading = true;
		
		if (this.isImage())
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

Slide.prototype.preloadImage = function()
{
	this.preloadingImage = new Image();
	
	var slide = this;
	
	this.preloadingImage.onload = function() {
		slide.isPreloaded = true;
		slide.isPreloading = false;
		
		if (slide.callbackToRunAfterPreloadingFinishes != null)
		{
			slide.callbackToRunAfterPreloadingFinishes.call(slide);
		}
	}
	
	this.preloadingImage.onerror = function() {
		this.isPreloading = false;
	}
	
	this.preloadingImage.src = this.fileUrl;
}

Slide.prototype.preloadVideo = function()
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

Slide.prototype.addCallback = function(callback)
{
	this.callbackToRunAfterPreloadingFinishes = callback;
}

Slide.prototype.clearCallback = function()
{
	this.callbackToRunAfterPreloadingFinishes = null;
}

Slide.prototype.isImage = function()
{
	return this.mediaType == MEDIA_TYPE_IMAGE;
}

Slide.prototype.isVideo = function()
{
	return this.mediaType == MEDIA_TYPE_VIDEO;
}

Slide.prototype.toString = function slideToString()
{
	return 'Slide ' + this.id + ' ' + this.fileUrl + ' ' + this.fileUrl + ' ' + this.previewFileUrl + ' ' + this.width + ' ' + this.height;
}