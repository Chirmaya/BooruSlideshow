function setFocusToSearchBox()
{
	document.getElementById('search-text').focus();
}

// Displays
function displayWarningMessage(message)
{
	hideLoadingAnimation();
	
	var warningMessageElement = document.getElementById('warning-message');
	warningMessageElement.innerHTML = message;
	warningMessageElement.style.display = 'block';
}

function displayImage(imageUrl, id)
{
	showLoadingAnimation();
	
	var currentImage = document.getElementById('current-image');
	
	currentImage.src  = imageUrl;
	currentImage.setAttribute('alt', id);
	currentImage.setAttribute('title', id);
	currentImage.style.display = 'inline';
	
	var maxWidthText = getMaxWidth();
	
	if ((maxWidthText != '') &&
		(!isNaN(maxWidthText)))
	{
		var maxWidth = parseInt(maxWidthText);
		currentImage.style.maxWidth = maxWidth + 'px';
	}
	else
	{
		currentImage.style.maxWidth = null;
	}
	
	var maxHeightText = document.getElementById('max-height').value;
	
	if ((maxHeightText != '') &&
		(!isNaN(maxHeightText)))
	{
		var maxHeight = parseInt(maxHeightText);
		currentImage.style.maxHeight = maxHeight + 'px';
	}
	else
	{
		currentImage.style.maxHeight = null;
	}
}

function displayThumbnail(thumbnailImageUrl, id, showGreyedOut)
{
	var thumbnailList = document.getElementById('thumbnail-list');
	
	var newThumbnail = document.createElement("div");
	newThumbnail.classList.add("thumbnail");
	newThumbnail.setAttribute('title', id);
	newThumbnail.onclick = function() {
		//if (sitesManager.isNextImagePreloaded(id))
		//{
			if (sitesManager.moveToPreloadedImage(id))
			{
				updateImages();
				updateNavigation();
				restartSlideshowIfOn();
			}
		//}
	};
	
	var newThumbnailImage = document.createElement("img");
	newThumbnailImage.id = 'thumbnail-image-' + id;
	newThumbnailImage.classList.add("thumbnail-image");
	newThumbnailImage.src  = thumbnailImageUrl;
	
	if (showGreyedOut)
	{
		newThumbnailImage.classList.add("thumbnail-image-greyed-out");
	}
	
	newThumbnail.appendChild(newThumbnailImage);
	thumbnailList.appendChild(newThumbnail);
}

function removeThumbnailGreyness(id)
{
	var thumbnail = document.getElementById('thumbnail-image-' + id);
	
	if (thumbnail != null)
	{
		removeClass(thumbnail, 'thumbnail-image-greyed-out');
	}
}

function removeClass(element, classToRemove)
{
	var regex = new RegExp('(?:^|\\s)' + classToRemove + '(?!\\S)')
	element.className = element.className.replace(regex, '');
}

function hideLoadingAnimation()
{
	var loadingAnimation = document.getElementById('loading-animation');
	
	loadingAnimation.style.display = "none";
}

function showLoadingAnimation()
{
	var loadingAnimation = document.getElementById('loading-animation');
	
	loadingAnimation.style.display = "inline";
}

// Clears
function clearUI()
{
	clearWarningMessage();
	clearImage();
	clearThumbnails();
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

function clearThumbnails()
{
	var thumbnailList = document.getElementById('thumbnail-list');
	
	while (thumbnailList.firstChild)
	{
		thumbnailList.removeChild(thumbnailList.firstChild);
	}
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

function getMaxWidth()
{
	return document.getElementById('max-width').value;
}

function getMaxHeight()
{
	return document.getElementById('max-height').value;
}

function setCurrentNumberDisplay(currentImageNumber)
{
	var currentNumberElement = document.getElementById('current-image-number');
	currentNumberElement.innerHTML = currentImageNumber;
}

function setSecondsPerImage(secondsPerImage)
{
	var secondsPerImageElement = document.getElementById('seconds-per-image');
	secondsPerImageElement.value = secondsPerImage;
}

function setMaxWidth(maxWidth)
{
	var maxWidthElement = document.getElementById('max-width');
	maxWidthElement.value = maxWidth;
}

function setMaxHeight(maxHeight)
{
	var maxHeightElement = document.getElementById('max-height');
	maxHeightElement.value = maxHeight;
}

function setSelectedSites(sitesToSet)
{
	var sitesToSearchElements = document.getElementsByName('sites-to-search');
	
	for (var i = 0; i < sitesToSet.length; i++)
	{
		
		
		for (var j = 0; j < sitesToSearchElements.length; j++)
		{
			var siteElement = sitesToSearchElements[j];
			
			if (siteElement.value == siteToSet)
			{
				siteElement.checked = true;
				break;
			}
		}
	}
	
	for (var i = 0; i < sitesToSearchElements.length; i++)
	{
		var siteElement = sitesToSearchElements[i];
		
		siteElement.checked = false;
		
		for (var j = 0; j < sitesToSet.length; j++)
		{
			var siteToSet = sitesToSet[j];
			
			if (siteElement.value == siteToSet)
			{
				siteElement.checked = true;
			}
		}
	}
}