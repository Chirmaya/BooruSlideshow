var SITE_DANBOORU = 'DANB';
var SITE_E621 = 'E621';
var SITE_GELBOORU = 'GELB';
var SITE_RULE34 = 'RULE';
var SITE_SAFEBOORU = 'SAFE';

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
        'maxHeightTextBox': document.getElementById('max-height'),
        'autoFitImageCheckBox': document.getElementById('auto-fit-image')
    });
});