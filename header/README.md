header
======

This module publishes a dynamic header, which is by default incorporated into every geOrchestra webapp.

Additional buttons have be added to access to Drupal and Pydio.
An additional field has been added which is a rss.xml parser able to show news information for Drupal in the header.

The url of the rss.xml can be change in the index.jsp file.
Modify url attribut in 	<c:import var="newsList" url="https://xxxxxxx/rss.xml" /> to parse your own rss.xml
