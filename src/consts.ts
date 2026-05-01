// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'California Curated';
export const SITE_DESCRIPTION = 'California, explained.';
export const SITE_AUTHOR = 'Erik Olsen';

// Magazine sections (used in nav and homepage rails). Order matters — this is
// what shows up on the top nav. Map each to one or more imported categories.
export const SECTIONS = [
	{ slug: 'animals', label: 'Animals', categories: ['animals', 'birds'] },
	{ slug: 'geology-earthquakes', label: 'Geology / Earthquakes', categories: ['geology-and-earthquakes'] },
	{ slug: 'ocean-science', label: 'Ocean Science', categories: ['marine-science'] },
	{ slug: 'climate-change', label: 'Climate Change', categories: ['climate-change'] },
	{ slug: 'plants', label: 'Plants', categories: ['horticulture'] },
	{ slug: 'space', label: 'Space', categories: ['space'] },
	{ slug: 'science-history', label: 'Science History', categories: ['history-of-science'] },
] as const;
