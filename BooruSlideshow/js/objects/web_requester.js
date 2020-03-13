class WebRequester
{
    constructor()
    {
        this.METHOD = 'GET';
    }

    getXhr(useSecondaryXhr = false)
    {
        return (useSecondaryXhr ? this.secondaryXhr : this.xhr);
    }

    resetConnection(useSecondaryXhr = false)
	{
        let xhr = this.getXhr(useSecondaryXhr);

		if (xhr != null) 
            xhr.abort();
		
        if (useSecondaryXhr)
            this.secondaryXhr = new XMLHttpRequest();
        else
            this.xhr = new XMLHttpRequest();
    }
    
    makeWebsiteRequest(url, onSuccessResponse, onErrorResponse, onAfterAnyResponse, onError, useSecondaryXhr = false)
	{
        this.resetConnection(useSecondaryXhr);
        
        let xhr = this.getXhr(useSecondaryXhr);
		
		xhr.open(this.METHOD, url, true);

		var webRequester = this;
		
		xhr.onload = function() {
            var responseText = xhr.responseText;

			if (xhr.status == 200)
			{
				if (onSuccessResponse != null)
				{
					onSuccessResponse(responseText);
				}
			}
			else
			{
                if (onErrorResponse != null){
                    onErrorResponse(responseText, xhr.status, useSecondaryXhr);
                }
			}
			
            if (onAfterAnyResponse != null)
                onAfterAnyResponse();
		};
		
		xhr.onerror = function() {
            if (onError != null)
            {
                onError(url, useSecondaryXhr);
            }
		};
		
		xhr.send();
	}
}