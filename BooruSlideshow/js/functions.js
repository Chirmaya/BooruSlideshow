function enableDevMode()
{
	LOGGING_MODE = LOGGING_MODE_DEV;
}

function disableProdMode()
{
	LOGGING_MODE = LOGGING_MODE_PROD;
}

function logForDev(text)
{
	if (LOGGING_MODE != LOGGING_MODE_DEV)
	{
		return;
	}

	console.log(text);
}

function getXmlElementStringValueSafe(xml, elementName)
{
	var elements = xml.getElementsByTagName(elementName);

	if (elements.length == 0)
	{
		return '';
	}

	return elements[0].textContent;
}

function doesXmlContainElement(xml, elementName)
{
	var elements = xml.getElementsByTagName(elementName);

	return elements.length > 0;
}