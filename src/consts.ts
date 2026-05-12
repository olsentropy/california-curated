// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'California Curated';
export const SITE_TAGLINE = 'The natural world of California, explained.';
// SEO meta description used on the homepage and as the fallback elsewhere.
// Keep this keyword-rich so search engines have something substantive to index.
// The shorter SITE_TAGLINE above is what readers see in the brand header.
export const SITE_DESCRIPTION =
	'Independent journalism on California\'s natural world: marine biology, geology, wildlife, kelp forests, the San Andreas Fault, the Sierra Nevada, the Mojave Desert, condors, redwoods, drought, fire ecology, and the science of the Golden State.';
export const SITE_AUTHOR = 'Erik Olsen';
// Author archive slug — used by /pages/author/[slug].astro and as a link target.
export const SITE_AUTHOR_SLUG = 'erik-olsen';
// Social handles (without the @). Leave empty strings to omit the meta tags.
// twitter:site = brand handle; twitter:creator = author handle.
export const SITE_TWITTER = '';
export const SITE_TWITTER_CREATOR = '';

// Magazine sections (used in nav and homepage rails). Order matters — this is
// what shows up on the top nav. Map each to one or more imported categories.
export const SECTIONS = [
	{ slug: 'animals', label: 'Animals', categories: ['animals', 'birds'] },
	{ slug: 'geology-earthquakes', label: 'Geology', categories: ['geology-and-earthquakes'] },
	{ slug: 'ocean-science', label: 'Oceans', categories: ['marine-science'] },
	{ slug: 'climate-change', label: 'Climate', categories: ['climate-change'] },
	{ slug: 'plants', label: 'Plants', categories: ['horticulture'] },
	{ slug: 'space', label: 'Space', categories: ['space'] },
	{ slug: 'science-history', label: 'Science History', categories: ['history-of-science'] },
] as const;
