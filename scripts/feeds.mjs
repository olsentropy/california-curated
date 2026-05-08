// RSS feed sources for the curated news rail. Edit this list to add or
// remove sources. Each entry needs a publicly-reachable RSS/Atom URL and
// a human-readable source label that appears under each headline.
//
// Tips:
// - Prefer feeds that are stable and well-maintained.
// - The aggregator gracefully skips dead/404 feeds, so a broken URL here
//   won't kill a refresh — it'll just be missing from that run.
// - Keep the list focused on California / science / nature / environment.
//   The AI filter is strong but garbage in, garbage out.

export const FEEDS = [
	{ url: 'https://www.kqed.org/science/feed', source: 'KQED Science' },
	{ url: 'https://baynature.org/feed/', source: 'Bay Nature' },
	{ url: 'https://www.latimes.com/science/rss2.0.xml', source: 'Los Angeles Times' },
	{ url: 'https://www.latimes.com/environment/rss2.0.xml', source: 'Los Angeles Times' },
	{ url: 'https://www.latimes.com/california/rss2.0.xml', source: 'Los Angeles Times' },
	{ url: 'https://feeds.npr.org/1007/rss.xml', source: 'NPR Science' },
	{ url: 'https://news.mongabay.com/feed/', source: 'Mongabay' },
	{ url: 'https://www.jpl.nasa.gov/feeds/news.xml', source: 'NASA JPL' },
	{ url: 'https://eos.org/feed', source: 'Eos' },
	{ url: 'https://www.kpbs.org/feeds/news.xml', source: 'KPBS' },
	{ url: 'https://www.calacademy.org/news/rss', source: 'California Academy of Sciences' },
	{ url: 'https://www.usgs.gov/news-releases/feed', source: 'USGS' },
];
