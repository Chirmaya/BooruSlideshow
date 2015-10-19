var IS_DEBUG_ON = false;
var MILLISECONDS_PER_SECOND = 1000;

var numberOfImagesToAlwaysHaveReadyToDisplay = 20;
var isPlaying = false;
var timer = null;
var timerMs = 0;
var searchText = "";


var SITE_DANBOORU = 'DANB';
var SITE_E621 = 'E621';
var SITE_GELBOORU = 'GELB';
var SITE_RULE34 = 'RULE';
var SITE_SAFEBOORU = 'SAFE';

var sitesManager = new SitesManager(20, 10);

sitesManager.addSite(SITE_DANBOORU, 'https://danbooru.donmai.us', 100);
sitesManager.addSite(SITE_E621, 'https://e621.net', 100);
sitesManager.addSite(SITE_GELBOORU, 'http://gelbooru.com', 100);
sitesManager.addSite(SITE_RULE34, 'http://rule34.xxx', 100);
sitesManager.addSite(SITE_SAFEBOORU, 'http://safebooru.org', 100);

function userPressedSearchButton()
{
	sitesManager.resetConnections();
	clearUI();
	userPressedPauseButton();
	updateNavigation();
	performSearch();
	saveUserSettings();
}

function userPressedFirstButton()
{
	restartSlideshowIfOn();
	moveToFirstImage();
}

function moveToFirstImage()
{
	setCurrentImageNumberToFirst();
	updateImages();
	updateNavigation();
}

function userPressedPreviousButton()
{
	restartSlideshowIfOn();
	moveToPreviousImage();
}

function moveToPreviousImage()
{
	decreaseCurrentImageNumber();
	updateImages()
	updateNavigation();
}

function userPressedNextButton()
{
	restartSlideshowIfOn();
	moveToNextImage();
}

function moveToNextImage()
{
	increaseCurrentImageNumber();
	updateImages();
	updateNavigation();
}

function userPressedLastButton()
{
	restartSlideshowIfOn();
	moveToLastImage();
}

function moveToLastImage()
{
	setCurrentImageNumberToLast();
	updateImages();
	updateNavigation();
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

function userPressedPlayButton()
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
		}
		else
		{
			moveToFirstImage();
		}
		
		tryToStartCountdown(secondsPerImage);
	}, millisecondsPerImage);
}

function userPressedPauseButton()
{
	clearTimeout(timer);
	sitesManager.clearCallbacksForPreloadingImages();
	
	isPlaying = false;
	updatePlayPauseButtons()
}

function userPressedLeft()
{
	userPressedPreviousButton();
}

function userPressedRight()
{
	userPressedNextButton();
}

function userPressedEnter()
{
	if (hasImagesToDisplay())
	{
		if (isPlaying)
			userPressedPauseButton();
		else
			userPressedPlayButton();
	}
}

function userPressedCurrentImage()
{
	var currentPost = sitesManager.getCurrentPost();
	
	window.open(currentPost.postOnSiteUrl, '_blank');
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
		displayDebugText('Finished searching all sites.');
		displayDebugText(sitesManager.getTotalImageNumber() + ' images are ready to be displayed.');
		
		updateImages();
		updateNavigation();
	});
}

function setCurrentImageNumberToFirst()
{
	sitesManager.moveToFirstImage();
	updateNavigation();
}

function setCurrentImageNumberToLast()
{
	sitesManager.moveToLastImage(function() {
		updateNavigation();
	});
}

function increaseCurrentImageNumber()
{
	sitesManager.increaseCurrentImageNumber(function() {
		updateNavigation();
	});
}

function decreaseCurrentImageNumber()
{
	sitesManager.moveToPreviousImage();
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

function setupLoadingAnimation()
{
	var currentImage = document.getElementById('current-image');
	
	currentImage.onload = function() {
		hideLoadingAnimation();
	}
}

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