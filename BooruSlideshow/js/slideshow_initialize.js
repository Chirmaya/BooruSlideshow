var slideshowController = null;

document.addEventListener('DOMContentLoaded', function () {
    slideshowController = new SlideshowController({
        'warningMessage': document.getElementById('warning-message'),
        'currentImage': document.getElementById('current-image'),
        'loadingAnimation': document.getElementById('loading-animation'),
        'navigation': document.getElementById('navigation'),
        'currentImageNumber': document.getElementById('current-image-number'),
        'totalImageNumber': document.getElementById('total-image-number'),
        'thumbnailList': document.getElementById('thumbnail-list'),
        'searchTextBox': document.getElementById('search-text'),
        'searchButton': document.getElementById('search-button'),
        'firstNavButton': document.getElementById('first-button'),
        'previousNavButton': document.getElementById('previous-button'),
        'nextNavButton': document.getElementById('next-button'),
        'lastNavButton': document.getElementById('last-button'),
        'playButton': document.getElementById('play-button'),
        'pauseButton': document.getElementById('pause-button'),
        'sitesToSearch': document.getElementsByName('sites-to-search'),
        'secondsPerImageTextBox': document.getElementById('seconds-per-image'),
        'maxWidthTextBox': document.getElementById('max-width'),
        'maxHeightTextBox': document.getElementById('max-height')
    });
});

function startup()
{
	//setupEventListeners();
	
	//setupLoadingAnimation();
	
	//loadUserSettings();
	
	//setFocusToSearchBox();
	
	// Init
	
}

function setupEventListeners()
{
	setupSearchEventListeners();
	setupImageEventListeners();
	setupNavigationEventListeners();
	setupKeyboardButtonEventListeners();
}

function setupSearchEventListeners()
{
	document.getElementById('search-button').addEventListener('click', function() {
		userPressedSearchButton();
	});
	
	document.getElementById('search-text').addEventListener('keypress', function (e) {
		var key = e.which || e.keyCode;
		if (key == 13) {
			userPressedSearchButton();
		}
	});
}

function setupImageEventListeners()
{
	document.getElementById('current-image').addEventListener('click', function() {
		userClickedOnCurrentImage();
	});
}

function setupNavigationEventListeners()
{
	document.getElementById('first-button').addEventListener('click', function() {
		userPressedFirstButton();
	});
	
	document.getElementById('previous-button').addEventListener('click', function() {
		userPressedPreviousButton();
	});
	
	document.getElementById('play-button').addEventListener('click', function() {
		userPressedPlayButton();
	});
	
	document.getElementById('pause-button').addEventListener('click', function() {
		userPressedPauseButton();
	});
	
	document.getElementById('next-button').addEventListener('click', function() {
		userPressedNextButton();
	});
	
	document.getElementById('last-button').addEventListener('click', function() {
		userPressedLastButton();
	});
}

function setupKeyboardButtonEventListeners()
{
	document.addEventListener('keydown', function (e) {
		if (document.activeElement !== document.getElementById('search-text') &&
			document.activeElement !== document.getElementById('seconds-per-image') &&
			document.activeElement !== document.getElementById('max-width') &&
			document.activeElement !== document.getElementById('max-height'))
		{
			var key = e.which || e.keyCode;
			if (key == 37)
				userPressedLeftKey();
			if (key == 39)
				userPressedRightKey();
			if (key == 13)
				userPressedEnterKey();
		}
	});
}