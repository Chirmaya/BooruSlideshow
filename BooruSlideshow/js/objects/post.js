var Post = function (id, fileUrl, previewFileUrl, postOnSiteUrl, imageWidth, imageHeight, date, score)
{
	this.id = id;
	this.fileUrl = fileUrl;
	this.previewFileUrl = previewFileUrl;
	this.postOnSiteUrl = postOnSiteUrl;
	this.imageWidth = imageWidth;
	this.imageHeight = imageHeight;
	this.date = date;
	this.score = score;
	this.isPreloaded = false;
	this.isPreloading = false;
	this.preloadImage = null;
	this.callbackToRunAfterPreloadingFinishes = null;
}

Post.prototype.preload = function()
{
	if (!this.isPreloaded && !this.isPreloading)
	{
		this.isPreloading = true;
		
		this.preloadImage = new Image();
		
		var post = this;
		
		this.preloadImage.onload = function() {
			post.isPreloaded = true;
			post.isPreloading = false;
			
			if (post.callbackToRunAfterPreloadingFinishes != null)
			{
				post.callbackToRunAfterPreloadingFinishes.call(post);
			}
		}
		
		this.preloadImage.onerror = function() {
			this.isPreloading = false;
		}
		
		this.preloadImage.src = this.fileUrl;
	}
}

Post.prototype.addCallback = function(callback)
{
	this.callbackToRunAfterPreloadingFinishes = callback;
}

Post.prototype.clearCallback = function()
{
	this.callbackToRunAfterPreloadingFinishes = null;
}

Post.prototype.toString = function postToString()
{
	return 'Post ' + this.id + ' ' + this.fileUrl + ' ' + this.fileUrl + ' ' + this.previewFileUrl + ' ' + this.imageWidth + ' ' + this.imageHeight;
}