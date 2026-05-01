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
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image().or(z.string())),
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
		}),
});

export const collections = { blog };
