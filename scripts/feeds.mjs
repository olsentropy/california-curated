// RSS feed sources for the curated news rail. Edit this list to add or
// remove sources. Each entry needs a publicly-reachable RSS/Atom URL and
// a human-readable source label that appears under each headline.
//
// Tips:
// - Prefer feeds that are stable and well-maintained.
// - The aggregator gracefully skips dead/404 feeds and tolerates malformed
//   XML (it sanitizes bare `&` characters before parsing). A broken URL
//   here won't kill a refresh — it'll just be missing from that run.
// - Keep the list focused on California / science / nature / environment.
//   The AI filter is strong but garbage in, garbage out.

export const FEEDS = [
	// ====== Big-city news (California sections) ======
	{ url: 'https://www.latimes.com/science/rss2.0.xml', source: 'Los Angeles Times' },
	{ url: 'https://www.latimes.com/environment/rss2.0.xml', source: 'Los Angeles Times' },
	{ url: 'https://www.latimes.com/california/rss2.0.xml', source: 'Los Angeles Times' },

	// ====== California public radio + nature beats ======
	{ url: 'https://www.kqed.org/science/feed', source: 'KQED Science' },
	{ url: 'https://baynature.org/feed/', source: 'Bay Nature' },
	{ url: 'https://www.kpbs.org/feeds/news/rss.xml', source: 'KPBS' },

	// ====== National science + environment ======
	{ url: 'https://feeds.npr.org/1007/rss.xml', source: 'NPR Science' },
	{ url: 'https://news.mongabay.com/feed/', source: 'Mongabay' },
	{ url: 'https://eos.org/feed', source: 'Eos' },

	// ====== California research institutions ======
	{ url: 'https://www.jpl.nasa.gov/news/news.atom', source: 'NASA JPL' },
	{ url: 'https://www.caltech.edu/news/rss', source: 'Caltech' },
	{ url: 'https://news.berkeley.edu/feed', source: 'UC Berkeley News' },
	{ url: 'https://scripps.ucsd.edu/news.xml', source: 'Scripps Oceanography' },
	{ url: 'https://www.mbari.org/feed/', source: 'MBARI' },
	{ url: 'https://www.calacademy.org/explore-science/feed', source: 'California Academy of Sciences' },

	// ====== Federal agencies (California-relevant) ======
	{ url: 'https://www.usgs.gov/news/feed', source: 'USGS' },
	{ url: 'https://www.fisheries.noaa.gov/region/west-coast/feed', source: 'NOAA Fisheries (West Coast)' },
];
