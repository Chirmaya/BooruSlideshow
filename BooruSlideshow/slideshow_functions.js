var IS_DEBUG_ON = false;
var MILLISECONDS_PER_SECOND = 1000;

var numberOfImagesToAlwaysHaveReadyToDisplay = 20;
var isPlaying = false;
var timer = null;
var searchText = "";

var SITE_DANBOORU = 'DANB';
var SITE_E621 = 'E621';

var sitesManager = new SitesManager(20);
sitesManager.addSite(SITE_DANBOORU, 'https://danbooru.donmai.us', 100);
sitesManager.addSite(SITE_E621, 'https://e621.net', 100);

function userPressedSearchButton()
{
	sitesManager.resetConnections();
	clearUI();
	updateNavigation();
	performSearch();
}

function userPressedFirstButton()
{
	setCurrentImageNumberToFirst();
	
	showCurrentImage()
	
	updateNavigation();
}

function userPressedPreviousButton()
{
	decreaseCurrentImageNumber();
	
	showCurrentImage()
	
	updateNavigation();
}

function userPressedPlayButton()
{
	var secondsPerImage = getSecondsPerImage();
	
	if (secondsPerImage != null)
	{
		startSlideshow(secondsPerImage);
	}
}

function startSlideshow(secondsPerImage)
{
	var millisecondsPerImage = secondsPerImage * MILLISECONDS_PER_SECOND;
	
	timer = setInterval(function() {
		if (hasNextImage())
		{
			userPressedNextButton();
		}
		else
		{
			userPressedFirstButton();
		}
	}, millisecondsPerImage);
	
	isPlaying = true;
	updatePlayPauseButtons()
}

function userPressedPauseButton()
{
	clearInterval(timer);
	
	isPlaying = false;
	updatePlayPauseButtons()
}

function userPressedNextButton()
{
	increaseCurrentImageNumber();
	
	showCurrentImage()
	
	updateNavigation();
}

function userPressedLastButton()
{
	setCurrentImageNumberToLast();
	
	showCurrentImage()
	
	updateNavigation();
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
		
		showCurrentImage();
		updateNavigation();
	});
}

function setCurrentImageNumberToFirst()
{
	sitesManager.setCurrentImageNumberToFirst();
	updateNavigation();
}

function setCurrentImageNumberToLast()
{
	sitesManager.setCurrentImageNumberToLast(function() {
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
	sitesManager.decreaseCurrentImageNumber();
	updateNavigation();
}

function getCurrentImageNumber()
{
	return sitesManager.currentImageNumber;
}

function showCurrentImage()
{
	var currentPost = sitesManager.getCurrentPost();
	
	displayImage(currentPost.fileUrl, currentPost.id);
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