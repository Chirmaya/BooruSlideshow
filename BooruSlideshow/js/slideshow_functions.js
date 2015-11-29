// User actions
function userPressedFirstButton()
{
	moveToFirstImage();
	restartSlideshowIfOn();
}

function userPressedPreviousButton()
{
	moveToPreviousImage();
	restartSlideshowIfOn();
}

function userPressedNextButton()
{
	moveToNextImage();
	restartSlideshowIfOn();
}

function userPressedLastButton()
{
	moveToLastImage(function(){
		restartSlideshowIfOn();
	});
}

function userPressedPlayButton()
{
	attemptToStartSlideshow();
}

function userPressedPauseButton()
{
	pauseSlideshow();
}

function userPressedSearchButton()
{
	attemptToDoSearch();
}

function userPressedLeftKey()
{
	moveToPreviousImage();
	restartSlideshowIfOn();
}

function userPressedRightKey()
{
	moveToNextImage();
	restartSlideshowIfOn();
}

function userPressedEnterKey()
{
	tryToPlayOrPause();
}

function userClickedOnCurrentImage()
{
	pauseSlideshow();
	openCurrentPostInNewWindow();
}

// Slideshow actions
function moveToFirstImage()
{
	setCurrentImageNumberToFirst();
	updateImages();
	updateNavigation();
}

function moveToPreviousImage()
{
	decreaseCurrentImageNumber();
	updateImages()
	updateNavigation();
}

function moveToNextImage()
{
	increaseCurrentImageNumber();
	updateImages();
	updateNavigation();
}

function moveToLastImage(callback)
{
	setCurrentImageNumberToLast(function(){
		updateNavigation();
		updateImages();
		callback.call();
	});
}

function tryToPlayOrPause()
{
	if (hasImagesToDisplay())
	{
		if (isPlaying)
			userPressedPauseButton();
		else
			userPressedPlayButton();
	}
}

function restartSlideshowIfOn()
{
	if (isPlaying)
	{
		clearTimeout(timer);
		sitesManager.clearCallbacksForPreloadingImages();
		
		userPressedPlayButton();
	}
}

function attemptToStartSlideshow()
{
	var secondsPerImage = getSecondsPerImage();
	
	if (secondsPerImage != null && secondsPerImage > 0)
	{
		startSlideshow(secondsPerImage);
	}
}

function startSlideshow(secondsPerImage)
{
	tryToStartCountdown(secondsPerImage);
	
	isPlaying = true;
	updatePlayPauseButtons();
}

function tryToStartCountdown(secondsPerImage)
{
	if (sitesManager.isCurrentImageLoaded())
	{
		startCountdown(secondsPerImage);
	}
	else
	{
		sitesManager.runCodeWhenCurrentImageFinishesLoading(function(){
			startCountdown(secondsPerImage);
		});
	}
}

function startCountdown(secondsPerImage)
{
	var millisecondsPerImage = secondsPerImage * MILLISECONDS_PER_SECOND;
	
	timer = setTimeout(function() {
		if (hasNextImage())
		{
			moveToNextImage();
			tryToStartCountdown(secondsPerImage);
		}
		else if (isTryingToLoadMoreImages())
		{
			sitesManager.runCodeWhenFinishGettingMoreImages(function(){
				tryToStartCountdown(secondsPerImage);
			});
		}
		else
		{
			moveToFirstImage();
			tryToStartCountdown(secondsPerImage);
		}
		
	}, millisecondsPerImage);
}

function pauseSlideshow()
{
	clearTimeout(timer);
	sitesManager.clearCallbacksForPreloadingImages();
	sitesManager.clearCallbacksForLoadingImages();
	
	isPlaying = false;
	updatePlayPauseButtons()
}

function attemptToDoSearch()
{
	sitesManager.resetConnections();
	clearUI();
	userPressedPauseButton();
	updateNavigation();
	performSearch();
	saveUserSettings();
}

function performSearch()
{
	searchText = getSearchText();
	
	if (searchText == null)
	{
		return;
	}
	
	var selectedSites = getSelectedSites();
	
	if (selectedSites == null)
	{
		return;
	}
	
	sitesManager.enableSites(selectedSites);
	sitesManager.performSearch(searchText, function() {
		updateImages();
		updateNavigation();
	});
}

function setCurrentImageNumberToFirst()
{
	sitesManager.moveToFirstImage();
}

function setCurrentImageNumberToLast(callback)
{
	sitesManager.moveToLastImage(callback);
}

function increaseCurrentImageNumber()
{
	sitesManager.increaseCurrentImageNumber(function() {
		updateNavigation();
	});
}

function decreaseCurrentImageNumber()
{
	sitesManager.decreaseCurrentImageNumber();
	updateNavigation();
}

function getCurrentImageNumber()
{
	return sitesManager.currentImageNumber;
}

function updateImages()
{
	showCurrentImage();
	showThumbnails();
}

function showCurrentImage()
{
	if (sitesManager.getNumberOfSortedPosts() > 0)
	{
		var currentPost = sitesManager.getCurrentPost();
		
		displayImage(currentPost.fileUrl, currentPost.id);
	}
	else
	{
		displayWarningMessage('No images were found.');
	}
}

function showThumbnails()
{
	clearThumbnails();
	
	if (sitesManager.getNumberOfSortedPosts() > 1)
	{
		var nextPosts = sitesManager.getNextPostsForThumbnails();
		
		for (var i = 0; i < nextPosts.length; i++)
		{
			var post = nextPosts[i];
			
			var showGreyedOut = !post.isPreloaded
			displayThumbnail(post.previewFileUrl, post.id, showGreyedOut);
			
			post.clearCallback();
			post.addCallback(function(){
				var post = this;
				removeThumbnailGreyness(post.id);
				sitesManager.preloadNextUnpreloadedImageAfterThisOneIfInRange(post);
			});
		}
	}
}

function updateNavigation()
{
	if (hasImagesToDisplay())
	{
		updateNavigationButtonsAndDisplay();
		showNavigationBar();
	}
	else
	{
		hideNavigationBar();
	}
}

function updateNavigationButtonsAndDisplay()
{
	updateCurrentNumberDisplay();
	updateTotalNumberDisplay();
	
	updateFirstPreviousButtons();
	updatePlayPauseButtons();
	updateNextLastButtons();
}

function updateCurrentNumberDisplay()
{
	setCurrentNumberDisplay(getCurrentImageNumber());
}

function updateTotalNumberDisplay()
{
	var totalNumberElement = document.getElementById('total-image-number');
	totalNumberElement.innerHTML = totalImageNumber();
	
	// Add star to show more to be loaded
	if (sitesManager.areThereMoreLoadableImages())
	{
		totalNumberElement.innerHTML += '+';
	}
}

function updateFirstPreviousButtons()
{
	var firstButton = document.getElementById('first-button');
	var previousButton = document.getElementById('previous-button');
	
	if (getCurrentImageNumber() > 1)
	{
		firstButton.disabled = false;
		previousButton.disabled = false;
	}
	else
	{
		firstButton.disabled = true;
		previousButton.disabled = true;
	}
}

function updatePlayPauseButtons()
{
	var playButton = document.getElementById('play-button');
	var pauseButton = document.getElementById('pause-button');
	
	if (isPlaying)
	{
		playButton.style.display = 'none';
		pauseButton.style.display = 'inline';
	}
	else
	{
		playButton.style.display = 'inline';
		pauseButton.style.display = 'none';
	}
}

function updateNextLastButtons()
{
	var nextButton = document.getElementById('next-button');
	var lastButton = document.getElementById('last-button');
	
	if (getCurrentImageNumber() < totalImageNumber())
	{
		nextButton.disabled = false;
		lastButton.disabled = false;
	}
	else
	{
		nextButton.disabled = true;
		lastButton.disabled = true;
	}
}

// Support methods
function totalImageNumber()
{
	return sitesManager.getTotalImageNumber();
}

function numberOfImagesLeftToDisplay()
{
	return (totalImageNumber() - getCurrentImageNumber());
}

function hasImagesToDisplay()
{
	return (totalImageNumber() > 0);
}

function hasNextImage()
{
	return (totalImageNumber() >= getCurrentImageNumber() + 1);
}

function isTryingToLoadMoreImages()
{
	return (sitesManager.isTryingToLoadMoreImages);
}

function setupLoadingAnimation()
{
	var currentImage = document.getElementById('current-image');
	
	currentImage.onload = function() {
		hideLoadingAnimation();
	}
}

function openCurrentPostInNewWindow()
{
	var currentPost = sitesManager.getCurrentPost();
	
	window.open(currentPost.postOnSiteUrl, '_blank');
}

// User settings
function loadUserSettings()
{
	chrome.storage.sync.get(['secondsPerImage', 'maxWidth', 'maxHeight', 'sitesToSearch'], function (obj) {
		if (obj != null)
		{
			var secondsPerImage = obj['secondsPerImage'];
			var maxWidth = obj['maxWidth'];
			var maxHeight = obj['maxHeight'];
			var sitesToSearch = obj['sitesToSearch'];
			
			if (secondsPerImage != null)
			{
				setSecondsPerImage(secondsPerImage);
			}
			
			if (maxWidth != null)
			{
				setMaxWidth(maxWidth);
			}
			
			if (maxHeight != null)
			{
				setMaxHeight(maxHeight);
			}
			
			if (sitesToSearch != null)
			{
				setSelectedSites(sitesToSearch);
			}
		}
	});
}

function saveUserSettings()
{
	saveSecondsPerImage();
	chrome.storage.sync.set({'maxWidth': getMaxWidth()});
	chrome.storage.sync.set({'maxHeight': getMaxHeight()});
	chrome.storage.sync.set({'sitesToSearch': getSelectedSites()});
}

function saveSecondsPerImage()
{
	var secondsPerImage = getSecondsPerImage();
	
	if (secondsPerImage == null || secondsPerImage <= 0)
	{
		secondsPerImage = 6;
	}
	
	chrome.storage.sync.set({'secondsPerImage': secondsPerImage});
}