class SiteManagerFactory
{
    static createSiteManager(sitesManager, id, pageLimit)
    {
        switch (id)
		{
			case SITE_ATFBOORU:
				return new SiteManagerAtfBooru(sitesManager, pageLimit);
			case SITE_DANBOORU:
				return new SiteManagerDanbooru(sitesManager, pageLimit);
			case SITE_DERPIBOORU:
				return new SiteManagerDerpibooru(sitesManager, pageLimit);
			case SITE_E621:
				return new SiteManagerE621(sitesManager, pageLimit);
			case SITE_GELBOORU:
				return new SiteManagerGelbooru(sitesManager, pageLimit);
			case SITE_KONACHAN:
				return new SiteManagerKonachan(sitesManager, pageLimit);
			case SITE_REALBOORU:
				return new SiteManagerRealbooru(sitesManager, pageLimit);
			case SITE_RULE34:
				return new SiteManagerRule34(sitesManager, pageLimit);
			case SITE_SAFEBOORU:
				return new SiteManagerSafebooru(sitesManager, pageLimit);
			case SITE_XBOORU:
				return new SiteManagerXbooru(sitesManager, pageLimit);
				case SITE_YANDERE:
				return new SiteManagerYandere(sitesManager, pageLimit);
			default:
                console.log('SiteManagerFactory cannot handle the supplied site ID: ' + id);
                return;
		}
    }
}