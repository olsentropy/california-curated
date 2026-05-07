// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import smartypants from 'remark-smartypants';
import { defineConfig } from 'astro/config';
import remarkMergeImageCaptions from './src/lib/remarkMergeImageCaptions.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://californiacurated.com',
	integrations: [mdx(), sitemap()],
	markdown: {
		// Convert straight quotes/apostrophes/dashes/ellipses to typographic
		// equivalents at build time. Matches WordPress.com's auto-typography so
		// titles and body content render with curly quotes, en/em-dashes, and …
		// where appropriate. This affects post content AND post titles via
		// frontmatter — Astro applies the remark transforms before rendering.
		// remarkMergeImageCaptions folds Sveltia/Substack-style separate
		// caption paragraphs into the preceding image paragraph so that the
		// site's existing caption CSS rule (.prose p:has(img)) styles them.
		remarkPlugins: [smartypants, remarkMergeImageCaptions],
	},
});
