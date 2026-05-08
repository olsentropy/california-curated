// Refreshes src/data/news.json by:
//   1. Fetching every RSS feed in scripts/feeds.mjs (in parallel; tolerates
//      individual feed failures).
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

const SYSTEM_PROMPT = `You are a news editor for "California Curated," a publication about California's natural world: science, geology, marine biology, plants, animals, climate, weather, space exploration, and science history.

You receive a list of recent headlines from various sources. Your job is to pick the ${TARGET_COUNT} most relevant ones for our readers.

INCLUDE:
- California geography, ecosystems, wildlife, marine life, plants, geology, climate, drought, fire, water
- Research from California institutions (UC system, Caltech, JPL, USGS, Cal Academy, NASA Ames, MBARI, Scripps, etc.) — even if not California-specific topic
- Space and astronomy stories (especially with California involvement)
- Environmental policy directly affecting California's natural environment
- Notable science history or scientific discoveries

SKIP:
- General national/international politics, elections, campaigns
- Sports, celebrity, entertainment
- Crime, accidents, breaking news
- Local government meetings, school boards (unless directly about water/environment)
- Pure technology / business news (unless about energy, climate, conservation)
- Op-eds and personal essays (we want news)
- Duplicates: if two sources cover the same story, pick the better-written headline

Return ONLY a JSON array. No prose, no markdown fences, no explanation. Each element should look like:
  { "headline": "...", "url": "...", "source": "...", "publishedAt": "..." }

Use the exact strings from the input — do not rewrite headlines. Order newest first.`;

async function fetchFeed(parser, feed) {
	try {
		const parsed = await parser.parseURL(feed.url);
		const items = (parsed.items || []).map((it) => ({
			headline: (it.title || '').trim(),
			url: it.link || '',
			source: feed.source,
			publishedAt: it.isoDate || it.pubDate || new Date().toISOString(),
		}));
		return items;
	} catch (err) {
		console.warn(`[skip] ${feed.url} — ${err.message}`);
		return [];
	}
}

function dedupe(items) {
	const byKey = new Map();
	for (const it of items) {
		// Use URL as primary key; fall back to source+headline.
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
	// Tolerate code fences or stray prose around the JSON array.
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
	// Ensure each entry has the exact shape the site consumes, drop bad rows.
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
	const parser = new Parser({ timeout: 15_000 });
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
