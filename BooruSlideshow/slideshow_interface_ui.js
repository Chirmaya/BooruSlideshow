function setFocusToSearchBox()
{
	document.getElementById('search-text').focus();
}

// Displays
function displayWarningMessage(message)
{
	var warningMessageElement = document.getElementById('warning-message');
	warningMessageElement.innerHTML = message;
	warningMessageElement.style.display = 'block';
}

function displayImage(imgUrl, id)
{
	var currentImage = document.getElementById('current-image');
	currentImage.src  = imgUrl;
	currentImage.setAttribute('alt', id);
	currentImage.setAttribute('title', id);
	currentImage.style.display = 'inline';
	
	var maxWidthText = document.getElementById('max-width').value;
	
	if ((maxWidthText != '') &&
		(!isNaN(maxWidthText)))
	{
		var maxWidth = parseInt(maxWidthText);
		currentImage.style.maxWidth = maxWidth + 'px';
	}
	
	var maxHeightText = document.getElementById('max-height').value;
	
	if ((maxHeightText != '') &&
		(!isNaN(maxHeightText)))
	{
		var maxHeight = parseInt(maxHeightText);
		currentImage.style.maxHeight = maxHeight + 'px';
	}
}

function displayDebugText(text)
{
	if (IS_DEBUG_ON)
	{
		var testingArea = document.getElementById('testing-area-text');
		
		if (testingArea.innerHTML == '')
			testingArea.innerHTML = text;
		else
			testingArea.innerHTML = testingArea.innerHTML + "\n" + text;
		
		testingArea.style.display = 'block';
	}
}

function displayLink(text, url, imgUrl)
{
	var testingArea = document.getElementById('testing-area-links');
	
	testingArea.innerHTML += '<a href="' + url + '"><img src="' + imgUrl + '" alt="' + text + '"></img></a>';
}

// Clears
function clearUI()
{
	clearWarningMessage();
	clearImage();
	clearDebugText();
	clearDisplayLinks();
}

function clearWarningMessage()
{
	var warningMessageElement = document.getElementById('warning-message');
	warningMessageElement.innerHTML = '';
	warningMessageElement.style.display = 'none';
}

function clearImage()
{
	var currentImage = document.getElementById('current-image');
	currentImage.src  = '';
	currentImage.removeAttribute('alt');
	currentImage.removeAttribute('title');
	currentImage.style.display = 'none';
}

function clearDebugText()
{
	var testingArea = document.getElementById('testing-area-text');
	testingArea.innerHTML = '';
	testingArea.style.display = 'none';
}

function clearDisplayLinks()
{
	var testingArea = document.getElementById('testing-area-links');
	testingArea.innerHTML = '';
	testingArea.style.display = 'none';
}

// Shows
function showNavigationBar()
{
	var navigationBar = document.getElementById('navigation');
	navigation.style.display = 'block';
}

// Hides
function hideNavigationBar()
{
	var navigationBar = document.getElementById('navigation');
	navigationBar.style.display = 'none';
}

// Gets
function getSearchText()
{
	var searchText = document.getElementById('search-text').value;
	
	if (searchText == '')
	{
		displayWarningMessage("The search query is blank");
		return;
	}
	
	return searchText;
}

function getSecondsPerImage()
{
	var secondsPerImageText = document.getElementById('seconds-per-image').value;
	
	if (secondsPerImageText == '')
	{
		displayWarningMessage("The seconds-per-image is blank");
		return;
	}
	
	if (isNaN(secondsPerImageText))
	{
		displayWarningMessage("The seconds-per-image needs to be a number");
		return;
	}
	
	return Number(secondsPerImageText);
}

function getSelectedSites()
{
	var sitesToSearchElements = document.getElementsByName('sites-to-search');
	var sitesToSearch = [];
	
	for (var i = 0; i < sitesToSearchElements.length; i++)
	{
		var siteElement = sitesToSearchElements[i];
		
		if (siteElement.checked)
		{
			var site = siteElement.value;
			sitesToSearch.push(site);
		}
	}
	
	if (sitesToSearch.length == 0)
	{
		displayWarningMessage("No sites were selected to be searched");
		return;
	}
	
	return sitesToSearch;
}

// Sets
function setCurrentNumberDisplay(currentImageNumber)
{
	var currentNumberElement = document.getElementById('current-image-number');
	currentNumberElement.innerHTML = currentImageNumber;
}