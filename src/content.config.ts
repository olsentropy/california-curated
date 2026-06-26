import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// California Curated — blog (article) collection.
// Schema is shaped to receive everything we'll pull from the WordPress WXR export
// so we can preserve URLs, categories, authors, and SEO metadata.
const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			// Sveltia CMS writes empty values as '' or null for unset optional fields.
			// Preprocess those to undefined so the schema's .optional() can apply cleanly.
			updatedDate: z.preprocess(
				(v) => (v === '' || v === null ? undefined : v),
				z.coerce.date().optional(),
			),
			// heroImage accepts any string (full URL or absolute /public path).
			// We don't run images through Astro's asset pipeline — every consumer
			// just uses the value as a plain <img src>. Using image() here was
			// breaking builds for /wp-content/... paths (Vite couldn't resolve
			// them as importable modules).
			heroImage: z.preprocess(
				(v) => (v === '' || v === null ? undefined : v),
				z.string().optional(),
			),
			// Preserved from WordPress for URL parity:
			wpId: z.number().optional(),
			wpSlug: z.string().optional(),
			// Taxonomy:
			categories: z.array(z.string()).default([]),
			tags: z.array(z.string()).default([]),
			// Authorship:
			author: z.string().default('Erik Olsen'),
			// Status flag — lets us draft posts before publishing:
			draft: z.boolean().default(false),
			// Optional SEO-optimized title for the <title> tag and og:title.
			// When set, this appears in search results instead of the editorial headline.
			// The editorial title (above) is still used as the H1 on the page.
			// Example: editorial title "Mountain of Knives" →
			//          seoTitle "Lookout Mountain Obsidian: California's Ancient Indigenous Quarry"
			seoTitle: z.preprocess(
				(v) => (v === '' || v === null ? undefined : v),
				z.string().optional(),
			),
		}),
});

export const collections = { blog };
