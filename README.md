# Scraping SurveyMonkey

Basically, I got really iritated at quite how much paywall SurveyMonkey uses and decided to scrape it. This is the rough result (though I've removed anything personally identifiable).

This project uses the `puppeteer` library and should be loaded on the login page that redirects to the form results. There's a hard limit of (if I remember correctly) 100 responses to scrape (you can view 40 results + delete 60 results).
