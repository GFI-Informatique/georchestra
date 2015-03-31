header
======

This module publishes a dynamic header, which is by default incorporated into every geOrchestra webapp.

Additional butons have be added, and a rss.xml parser to be able to show news information in the header.

In index.jsp, modify url attribut in 	<c:import var="newsList" url="https://xxxxxxx/rss.xml" /> to parse your own rss.xml
