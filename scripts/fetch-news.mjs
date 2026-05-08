// Refreshes src/data/news.json by:
//   1. Fetching every RSS feed in scripts/feeds.mjs (in parallel; tolerates
//      individual feed failures, including malformed XML).
//   2. Combining + de-duping items, capping to the most recent ~150.
//   3. Asking Claude Haiku to pick the most relevant headlines for a
//      California-focused science / nature / history publication.
//   4. Writing the curated set to src/data/news.json.
//
// Required env: ANTHROPIC_API_KEY
//
// Run locally:    node scripts/fetch-news.mjs
// Run in CI:      see .github/workflows/refresh-news.yml

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Parser from 'rss-parser';
import Anthropic from '@anthropic-ai/sdk';
import { FEEDS } from './feeds.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '..', 'src', 'data', 'news.json');

const TARGET_COUNT = 25;       // how many curated items to keep
const RECENT_POOL = 150;       // newest N items considered by the model
const MAX_AGE_DAYS = 14;       // drop anything older than this before AI filtering
const FETCH_TIMEOUT_MS = 15_000;

// Identify ourselves as a polite bot. Some publishers (USGS, etc.) refuse
// requests with a default Node fetch User-Agent.
const USER_AGENT =
	'Mozilla/5.0 (compatible; CaliforniaCuratedBot/1.0; +https://californiacurated.com/news)';

const SYSTEM_PROMPT = `You are a news editor for "California Curated," a publication about California's natural world: science, geology, marine biology, plants, animals, climate, weather, space exploration, and science history.

You receive a list of recent headlines from various sources. Pick up to ${TARGET_COUNT} that meet the criteria below. It is FAR better to return fewer items than to include items that don't qualify.

HARD REQUIREMENT — every headline you pick MUST satisfy at least one of:
  (a) The headline or accompanying text explicitly names California or a California place / region / feature (LA, San Francisco, Bay Area, San Diego, Sacramento, Yosemite, Sierra Nevada, Mojave, Death Valley, San Andreas, Lake Tahoe, Sequoia, Channel Islands, Monterey, etc.).
  (b) The story is unambiguously about a California-specific topic even if "California" isn't named (e.g. Point Reyes purple waves, Owens Valley pupfish, Bay Area sea otters).
  (c) The work is done by a California-based institution AND the topic directly concerns California's natural world or California-relevant phenomena (e.g. Scripps studying California kelp ✓; MBARI on Monterey Bay ✓; Caltech Ganymede paper ✗; UC Berkeley on Antarctic penguins ✗).

If a headline does NOT clearly satisfy at least one of those, SKIP it. Do not include it just because it's "interesting science" or "from a California institution." Reasonable doubt → skip.

WITHIN the California requirement, prefer:
- Wildlife, marine life, plants, ecosystems, conservation
- Geology, earthquakes, fire, drought, water, weather
- Climate change effects on California
- California-led space and astronomy research about California-relevant topics
- Environmental policy and natural resources in California
- Science history with California roots

ALWAYS SKIP regardless of California angle:
- General politics, elections, campaigns
- Sports, celebrity, entertainment
- Crime, accidents, breaking news
- Local government meetings, school boards (unless directly about water/environment)
- Pure technology / business news (unless about energy, climate, conservation)
- Op-eds and personal essays
- Duplicates: if two sources cover the same story, pick the better headline

Return ONLY a JSON array, ordered newest first. No prose, no markdown fences. Each element:
  { "headline": "...", "url": "...", "source": "...", "publishedAt": "..." }

Use the exact strings from the input — do not rewrite headlines. If fewer than ${TARGET_COUNT} qualify, return only those that qualify. Quantity is not a goal.`;

/**
 * Fix common XML errors that break strict parsers. Most often this is a bare
 * "&" character in a feed body (e.g. KQED) that should be "&amp;".
 */
function sanitizeXml(xml) {
	return xml.replace(
		/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);)/g,
		'&amp;',
	);
}

async function fetchFeedRaw(url) {
	const ac = new AbortController();
	const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
	try {
		const res = await fetch(url, {
			redirect: 'follow',
			signal: ac.signal,
			headers: {
				'User-Agent': USER_AGENT,
				Accept:
					'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.5',
			},
		});
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}`);
		}
		return await res.text();
	} finally {
		clearTimeout(timer);
	}
}

/**
 * Lenient regex-based fallback for feeds whose XML is too malformed for
 * strict parsers. Extracts <item>/<entry> blocks via pattern matching and
 * pulls out title, link, and pubDate. Brittle but tolerant.
 */
function lenientExtract(raw, sourceLabel) {
	const items = [];
	const itemPattern = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi;
	let match;
	while ((match = itemPattern.exec(raw)) !== null) {
		const block = match[2];
		const title =
			matchTagBody(block, 'title') ||
			matchTagBody(block, 'media:title') ||
			'';
		// <link>http://...</link>  OR  <link href="http://..." />
		const link =
			matchTagBody(block, 'link') ||
			(block.match(/<link\b[^>]*href=["']([^"']+)["']/i) || [])[1] ||
			'';
		const pubDate =
			matchTagBody(block, 'pubDate') ||
			matchTagBody(block, 'published') ||
			matchTagBody(block, 'updated') ||
			matchTagBody(block, 'dc:date') ||
			'';
		const cleanTitle = stripCdataAndTags(title);
		const cleanLink = stripCdataAndTags(link);
		if (cleanTitle && cleanLink) {
			items.push({
				headline: cleanTitle,
				url: cleanLink,
				source: sourceLabel,
				publishedAt: pubDate
					? new Date(pubDate).toISOString()
					: new Date().toISOString(),
			});
		}
	}
	return items;
}

function matchTagBody(block, tag) {
	const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}\\s*>`, 'i');
	return (block.match(re) || [])[1] || '';
}

function stripCdataAndTags(s) {
	return String(s)
		.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
		.replace(/<[^>]+>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

async function fetchFeed(parser, feed) {
	let raw;
	try {
		raw = await fetchFeedRaw(feed.url);
	} catch (err) {
		console.warn(`[skip] ${feed.url} — ${err.message}`);
		return [];
	}

	// First pass: strict parse with a sanitization step for bare ampersands.
	try {
		const xml = sanitizeXml(raw);
		const parsed = await parser.parseString(xml);
		const items = (parsed.items || []).map((it) => ({
			headline: (it.title || '').trim(),
			url: it.link || '',
			source: feed.source,
			publishedAt: it.isoDate || it.pubDate || new Date().toISOString(),
		}));
		console.log(`[ok]   ${feed.source} — ${items.length} items`);
		return items;
	} catch (strictErr) {
		// Second pass: regex-based lenient extraction. Used for feeds whose XML
		// is so malformed that even strict-mode-off parsers reject them.
		const items = lenientExtract(raw, feed.source);
		if (items.length > 0) {
			console.log(`[ok*]  ${feed.source} — ${items.length} items (lenient parse)`);
			return items;
		}
		console.warn(`[skip] ${feed.url} — ${strictErr.message}`);
		return [];
	}
}

function dedupe(items) {
	const byKey = new Map();
	for (const it of items) {
		const key = it.url || `${it.source}::${it.headline}`;
		if (!byKey.has(key)) byKey.set(key, it);
	}
	return [...byKey.values()];
}

function recentOnly(items) {
	const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
	return items.filter((it) => {
		const t = new Date(it.publishedAt).getTime();
		return Number.isFinite(t) && t >= cutoff;
	});
}

function sortNewestFirst(items) {
	return [...items].sort(
		(a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf(),
	);
}

function extractJsonArray(text) {
	const fenced = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
	if (fenced) return JSON.parse(fenced[1]);
	const bare = text.match(/\[[\s\S]*\]/);
	if (bare) return JSON.parse(bare[0]);
	throw new Error('Model response did not contain a JSON array.');
}

async function curate(client, candidates) {
	const userMessage =
		`Headlines (newest first):\n\n${JSON.stringify(candidates, null, 2)}`;

	const resp = await client.messages.create({
		model: 'claude-haiku-4-5',
		max_tokens: 4096,
		system: SYSTEM_PROMPT,
		messages: [{ role: 'user', content: userMessage }],
	});

	const text = resp.content
		.filter((b) => b.type === 'text')
		.map((b) => b.text)
		.join('\n');

	return extractJsonArray(text);
}

function shapeOutput(curated) {
	return curated
		.map((it) => ({
			headline: String(it.headline || '').trim(),
			url: String(it.url || '').trim(),
			source: String(it.source || '').trim(),
			publishedAt: new Date(it.publishedAt).toISOString(),
		}))
		.filter((it) => it.headline && it.url && it.source);
}

async function main() {
	if (!process.env.ANTHROPIC_API_KEY) {
		console.error('ANTHROPIC_API_KEY is not set. Aborting.');
		process.exit(1);
	}

	console.log(`Fetching ${FEEDS.length} feeds…`);
	const parser = new Parser({ timeout: FETCH_TIMEOUT_MS });
	const all = (await Promise.all(FEEDS.map((f) => fetchFeed(parser, f)))).flat();

	const fresh = sortNewestFirst(recentOnly(dedupe(all)));
	const candidates = fresh.slice(0, RECENT_POOL);
	console.log(`Pulled ${all.length} items, ${fresh.length} fresh, sending top ${candidates.length} to model.`);

	if (candidates.length === 0) {
		console.error('No fresh items found. Refusing to overwrite news.json with an empty list.');
		process.exit(1);
	}

	const client = new Anthropic();
	const curated = await curate(client, candidates);
	const items = shapeOutput(curated).slice(0, TARGET_COUNT);
	console.log(`Model returned ${curated.length} items, kept ${items.length}.`);

	if (items.length === 0) {
		console.error('Model returned zero usable items. Refusing to overwrite news.json.');
		process.exit(1);
	}

	const output = {
		lastUpdated: new Date().toISOString(),
		items,
	};

	fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, '\t') + '\n');
	console.log(`Wrote ${items.length} items to ${OUT_PATH}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
