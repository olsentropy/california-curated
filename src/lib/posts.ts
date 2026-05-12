// Shared helpers for fetching, filtering, and sorting blog posts.
import { getCollection, type CollectionEntry } from 'astro:content';
import { SECTIONS } from '../consts';

export type Post = CollectionEntry<'blog'>;

/** All published (non-draft) posts, sorted newest first. */
export async function getPublishedPosts(): Promise<Post[]> {
	const all = await getCollection('blog', ({ data }) => !data.draft);
	return all.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Posts whose categories match any of the given category slugs. */
export async function getPostsInCategories(catSlugs: readonly string[] | string[]): Promise<Post[]> {
	const wanted = new Set(catSlugs.map((c) => c.toLowerCase()));
	const posts = await getPublishedPosts();
	return posts.filter((p) =>
		(p.data.categories ?? []).some((c) => wanted.has(c.toLowerCase())),
	);
}

/** Resolve a section slug (from SECTIONS) to its display config, or null. */
export function findSection(slug: string) {
	return SECTIONS.find((s) => s.slug === slug) ?? null;
}

/** Hero image URL — schema allows asset OR string; this normalizes to a string for <img>. */
export function heroUrl(post: Post): string | undefined {
	const h = post.data.heroImage;
	if (!h) return undefined;
	if (typeof h === 'string') return h;
	// astro:assets ImageMetadata
	if (typeof h === 'object' && 'src' in h) return (h as { src: string }).src;
	return undefined;
}

/** Convenience: return up to N posts. */
export function take<T>(arr: T[], n: number): T[] {
	return arr.slice(0, n);
}

/**
 * Related posts: other published posts that share at least one category with
 * `categories`, excluding the post with id `currentId`. Sorted newest-first
 * (inherits ordering from getPublishedPosts). Returns up to `n` posts.
 *
 * Used by BlogPost.astro to render a "Keep reading" block at the bottom of
 * each article — helps SEO via internal linking and keeps readers on site.
 */
export async function getRelatedPosts(
	currentId: string,
	categories: readonly string[] | string[],
	n: number = 4,
): Promise<Post[]> {
	if (!categories || categories.length === 0) return [];
	const wanted = new Set(categories.map((c) => c.toLowerCase()));
	const posts = await getPublishedPosts();
	return posts
		.filter((p) => p.id !== currentId)
		.filter((p) => (p.data.categories ?? []).some((c) => wanted.has(c.toLowerCase())))
		.slice(0, n);
}

/** Posts authored by `authorName` (exact match), newest first. */
export async function getPostsByAuthor(authorName: string): Promise<Post[]> {
	const posts = await getPublishedPosts();
	return posts.filter((p) => p.data.author === authorName);
}
