// Google News Sitemap — https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
//
// Google News requires articles published within the last 48 hours.
// Because this is a static site that rebuilds on every deploy (i.e. every
// time a new article is published), the sitemap will always include the
// freshly published post. We also include up to 5 recent articles as a
// fallback so the file is never empty between publishes.

import { getPublishedPosts, heroUrl } from '../lib/posts';
import { SITE_TITLE } from '../consts';

export async function GET(context) {
	const posts = await getPublishedPosts(); // newest first

	const TWO_DAYS_MS = 48 * 60 * 60 * 1000;
	const cutoff = new Date(Date.now() - TWO_DAYS_MS);

	// Articles from the last 48 hours — what Google News actually wants.
	let recent = posts.filter((p) => p.data.pubDate >= cutoff);

	// Always surface at least the 5 most recent posts so the sitemap is
	// never empty when there hasn't been a publish in the last two days.
	if (recent.length === 0) {
		recent = posts.slice(0, 5);
	}

	const siteUrl = context.site ?? 'https://californiacurated.com';

	const urlEntries = recent
		.map((post) => {
			const loc = new URL(`/blog/${post.id}/`, siteUrl).toString();
			const pubDate = post.data.pubDate.toISOString();
			const image = heroUrl(post);
			const imageTag = image
				? `
    <image:image>
      <image:loc>${escapeXml(image)}</image:loc>
      <image:title>${escapeXml(post.data.title)}</image:title>
    </image:image>`
				: '';
			return `
  <url>
    <loc>${escapeXml(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE_TITLE)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(post.data.title)}</news:title>
    </news:news>${imageTag}
  </url>`;
		})
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
}

function escapeXml(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}
