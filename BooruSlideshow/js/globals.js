let SITE_ATFBOORU = 'ATFB';
let SITE_DANBOORU = 'DANB';
let SITE_DERPIBOORU = 'DERP';
let SITE_E621 = 'E621';
let SITE_GELBOORU = 'GELB';
let SITE_KONACHAN = 'KONA';
let SITE_REALBOORU = 'REAL';
let SITE_RULE34 = 'RULE';
let SITE_SAFEBOORU = 'SAFE';
let SITE_XBOORU = 'XBOO';
let SITE_YANDERE = 'YAND';

let MEDIA_TYPE_IMAGE = 'IMAGE';
let MEDIA_TYPE_GIF = 'GIF';
let MEDIA_TYPE_VIDEO = 'VIDEO';
let MEDIA_TYPE_UNSUPPORTED = 'UNSUPPORTED';

let ENTER_KEY_ID = 13;
let SPACE_KEY_ID = 32;
let LEFT_ARROW_KEY_ID = 37;
let RIGHT_ARROW_KEY_ID = 39;
let A_KEY_ID = 65;
let D_KEY_ID = 68;
let S_KEY_ID = 83;
let W_KEY_ID = 87;
let F_KEY_ID = 70;
let L_KEY_ID = 76;
let G_KEY_ID = 71;
let E_KEY_ID = 69;
let R_KEY_ID = 82;

let SITE_QUERY_TERM_ASSOCIATIONS = {};

SITE_QUERY_TERM_ASSOCIATIONS[SITE_ATFBOORU] = {
	"sort:id" : "order:id",
	"sort:id_asc" : "order:id_asc",
	"sort:id_desc" : "order:id_desc",
	"sort:score" : "order:score",
	"sort:score_asc" : "order:score_asc",
	"sort:score_desc" : "order:score_desc",
	"sort:-upload" : ""
};
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
SITE_QUERY_TERM_ASSOCIATIONS[SITE_XBOORU] = {
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
SITE_QUERY_TERM_ASSOCIATIONS[SITE_YANDERE] = {
	"sort:id" : "order:id",
	"sort:id_asc" : "order:id_asc",
	"sort:id_desc" : "order:id_desc",
	"sort:score" : "order:score",
	"sort:score_asc" : "order:score_asc",
	"sort:score_desc" : "order:score_desc",
	"sort:-upload" : ""
}