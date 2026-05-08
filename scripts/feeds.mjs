// RSS feed sources for the curated news rail. Edit this list to add or
// remove sources. Each entry needs a publicly-reachable RSS/Atom URL and
// a human-readable source label that appears under each headline.
//
// Tips:
// - Prefer feeds that are stable and well-maintained.
// - The aggregator gracefully skips dead/404 feeds and tolerates malformed
//   XML (it sanitizes bare `&` chars, then falls back to a lenient regex
//   parser if strict XML still fails). A broken URL here won't kill a
//   refresh — it'll just be missing from that run.
// - Keep the list focused on California / science / nature / environment.
//   The AI filter is strong but garbage in, garbage out.

export const FEEDS = [
	// ====== Big-city news (California sections) ======
	{ url: 'https://www.latimes.com/science/rss2.0.xml', source: 'Los Angeles Times' },
	{ url: 'https://www.latimes.com/environment/rss2.0.xml', source: 'Los Angeles Times' },
	{ url: 'https://www.latimes.com/california/rss2.0.xml', source: 'Los Angeles Times' },

	// ====== California public radio + nature beats ======
	{ url: 'https://www.kqed.org/science/feed', source: 'KQED Science' }, // malformed XML; lenient parser handles it
	{ url: 'https://baynature.org/feed/', source: 'Bay Nature' },

	// ====== National science + environment ======
	{ url: 'https://feeds.npr.org/1007/rss.xml', source: 'NPR Science' },
	{ url: 'https://news.mongabay.com/feed/', source: 'Mongabay' },
	{ url: 'https://eos.org/feed', source: 'Eos' },

	// ====== California research institutions ======
	{ url: 'https://www.caltech.edu/news/rss', source: 'Caltech' },
	{ url: 'https://news.berkeley.edu/feed', source: 'UC Berkeley News' },
	{ url: 'https://www.mbari.org/feed/', source: 'MBARI' },
];

// Feeds we'd like to add but couldn't find a working RSS URL for. If the
// publisher exposes one, drop it into FEEDS above. Verified-broken as of
// 2026-05-08:
//
// - NASA JPL          tried https://www.jpl.nasa.gov/news/news.atom (404)
// - KPBS              tried https://www.kpbs.org/feeds/news/rss.xml (404)
// - Scripps Oceano.   tried https://scripps.ucsd.edu/news.xml (404)
// - California Acad.  tried https://www.calacademy.org/explore-science/feed (404)
// - NOAA Fisheries WC tried https://www.fisheries.noaa.gov/region/west-coast/feed (404)
// - USGS              tried https://www.usgs.gov/news/feed (502; may be transient)
