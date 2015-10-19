document.addEventListener('DOMContentLoaded', function() {
	startup();
});

function startup()
{
	setupEventListeners();
	
	setupLoadingAnimation();
	
	loadUserSettings();
	
	setFocusToSearchBox();
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
		userPressedCurrentImage();
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
				userPressedLeft();
			if (key == 39)
				userPressedRight();
			if (key == 13)
				userPressedEnter();
		}
	});
}