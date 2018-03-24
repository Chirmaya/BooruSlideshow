var SITE_DANBOORU = 'DANB';
var SITE_DERPIBOORU = 'DERP';
var SITE_E621 = 'E621';
var SITE_GELBOORU = 'GELB';
//var SITE_IBSEARCH = 'IBSE';
var SITE_KONACHAN = 'KONA';
var SITE_REALBOORU = 'REAL';
var SITE_RULE34 = 'RULE';
var SITE_SAFEBOORU = 'SAFE';
var SITE_YANDERE = 'YAND';

var MEDIA_TYPE_IMAGE = 'IMAGE';
var MEDIA_TYPE_GIF = 'GIF';
var MEDIA_TYPE_VIDEO = 'VIDEO';
var MEDIA_TYPE_UNSUPPORTED = 'UNSUPPORTED';

var SITE_QUERY_TERM_ASSOCIATIONS = {};

SITE_QUERY_TERM_ASSOCIATIONS[SITE_DANBOORU] = {
	"sort:id" : "order:id",
	"sort:id_asc" : "order:id_asc",
	"sort:id_desc" : "order:id_desc",
	"sort:score" : "order:score",
	"sort:score_asc" : "order:score_asc",
	"sort:score_desc" : "order:score_desc",
	"sort:-upload" : ""
};
SITE_QUERY_TERM_ASSOCIATIONS[SITE_DERPIBOORU] = {
	"sort:id" : "",
	"sort:id_asc" : "",
	"sort:id_desc" : "",
	"sort:score" : "",
	"sort:score_asc" : "",
	"sort:score_desc" : "",
	"order:id" : "",
	"order:id_asc" : "",
	"order:id_desc" : "",
	"order:score" : "",
	"order:score_asc" : "",
	"order:score_desc" : "",
	"rating:s\\S*" : "safe",
	"rating:q\\S*" : "questionable",
	"rating:e\\S*" : "explicit",
	"sort:-upload" : ""
};
SITE_QUERY_TERM_ASSOCIATIONS[SITE_E621] = {
	"sort:id" : "order:id",
	"sort:id_asc" : "order:id_asc",
	"sort:id_desc" : "order:id_desc",
	"sort:score" : "order:score",
	"sort:score_asc" : "order:score_asc",
	"sort:score_desc" : "order:score_desc",
	"sort:-upload" : ""
};
SITE_QUERY_TERM_ASSOCIATIONS[SITE_GELBOORU] = {
	"rating:s\\S*" : "rating:safe",
	"rating:q\\S*" : "rating:questionable",
	"rating:e\\S*" : "rating:explicit",
	// Can't sort by ID
	
	// ASC/DESC not implemented?
	"order:score" : "sort:score",
	"order:score_desc" : "sort:score",
	"sort:score_desc" : "sort:score",
	"sort:-upload" : ""
};
/*SITE_QUERY_TERM_ASSOCIATIONS[SITE_IBSEARCH] = {
	"order:id" : "sort:id",
	"order:id_asc" : "sort:id_asc",
	"order:id_desc" : "sort:id_desc",
	"order:score" : "sort:score",
	"order:score_asc" : "sort:score_asc",
	"order:score_desc" : "sort:score_desc"
};*/
SITE_QUERY_TERM_ASSOCIATIONS[SITE_KONACHAN] = {
	"sort:id" : "order:id",
	"sort:id_asc" : "order:id_asc",
	"sort:id_desc" : "order:id_desc",
	"sort:score" : "order:score",
	"sort:score_asc" : "order:score_asc",
	"sort:score_desc" : "order:score_desc",
	"sort:-upload" : ""
};
SITE_QUERY_TERM_ASSOCIATIONS[SITE_REALBOORU] = {
	"rating:s\\S*" : "rating:safe",
	"rating:q\\S*" : "rating:questionable",
	"rating:e\\S*" : "rating:explicit",
	"order:id" : "sort:id",
	"order:id_asc" : "sort:id_asc",
	"order:id_desc" : "sort:id_desc",
	"order:score" : "sort:score",
	"order:score_asc" : "sort:score_asc",
	"order:score_desc" : "sort:score_desc",
	"sort:-upload" : ""
};
SITE_QUERY_TERM_ASSOCIATIONS[SITE_RULE34] = {
	"rating:s\\S*" : "rating:safe",
	"rating:q\\S*" : "rating:questionable",
	"rating:e\\S*" : "rating:explicit",
	"order:id" : "sort:id",
	"order:id_asc" : "sort:id_asc",
	"order:id_desc" : "sort:id_desc",
	"order:score" : "sort:score",
	"order:score_asc" : "sort:score_asc",
	"order:score_desc" : "sort:score_desc",
	"sort:-upload" : ""
};
SITE_QUERY_TERM_ASSOCIATIONS[SITE_SAFEBOORU] = {
	"rating:s\\S*" : "rating:safe",
	"rating:q\\S*" : "rating:questionable",
	"rating:e\\S*" : "rating:explicit",
	"order:id" : "sort:id",
	"order:id_asc" : "sort:id_asc",
	"order:id_desc" : "sort:id_desc",
	"order:score" : "sort:score",
	"order:score_asc" : "sort:score_asc",
	"order:score_desc" : "sort:score_desc",
	"sort:-upload" : ""
};
SITE_QUERY_TERM_ASSOCIATIONS[SITE_YANDERE] = {
	"sort:id" : "order:id",
	"sort:id_asc" : "order:id_asc",
	"sort:id_desc" : "order:id_desc",
	"sort:score" : "order:score",
	"sort:score_asc" : "order:score_asc",
	"sort:score_desc" : "order:score_desc",
	"sort:-upload" : ""
}

var ENTER_KEY_ID = 13;
var SPACE_KEY_ID = 32;
var LEFT_ARROW_KEY_ID = 37;
var RIGHT_ARROW_KEY_ID = 39;
var A_KEY_ID = 65;
var D_KEY_ID = 68;
var S_KEY_ID = 83;
var W_KEY_ID = 87;
var F_KEY_ID = 70;

var slideshowController = null;

document.addEventListener('DOMContentLoaded', function () {
    slideshowController = new SlideshowController({
        'warningMessage': document.getElementById('warning-message'),
        'infoMessage': document.getElementById('info-message'),
        'currentImage': document.getElementById('current-image'),
        'currentVideo': document.getElementById('current-video'),
        'loadingAnimation': document.getElementById('loading-animation'),
        'navigation': document.getElementById('navigation'),
        'currentSlideNumber': document.getElementById('current-slide-number'),
        'totalSlideNumber': document.getElementById('total-slide-number'),
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
        'secondsPerSlideTextBox': document.getElementById('seconds-per-slide'),
        'maxWidthTextBox': document.getElementById('max-width'),
        'maxHeightTextBox': document.getElementById('max-height'),
        'autoFitSlideCheckBox': document.getElementById('auto-fit-slide'),
        'includeImagesCheckBox': document.getElementById('include-images'),
        'includeGifsCheckBox': document.getElementById('include-gifs'),
        'includeWebmsCheckBox': document.getElementById('include-webms'),
        'hideBlacklist': document.getElementById('hide-blacklist'),
        'blacklistContainer': document.getElementById('blacklist-container'),
        'blacklist': document.getElementById('blacklist'),
        'derpibooruApiKey': document.getElementById('derpibooru-api-key'),
        'derpibooruApiKeyContainer': document.getElementById('derpibooru-api-key-container')
    });
});