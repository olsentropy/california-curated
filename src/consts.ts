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
// California Curated and Erik Olsen both post under @ScienceWeekly.
export const SITE_TWITTER = 'ScienceWeekly';
export const SITE_TWITTER_CREATOR = 'ScienceWeekly';

// Full URLs for social profiles. Set to empty string to hide the icon in
// the header utility bar and omit from the JSON-LD sameAs array.
export const SITE_FACEBOOK = 'https://www.facebook.com/californiacurious';
export const SITE_INSTAGRAM = 'https://www.instagram.com/californiacuratedus/';
export const SITE_TIKTOK = 'https://www.tiktok.com/@californiacurated';

// Magazine sections (used in nav and homepage rails). Order matters — this is
// what shows up on the top nav. Map each to one or more imported categories.
export const SECTIONS = [
	{
		slug: 'animals',
		label: 'Animals',
		categories: ['animals', 'birds'],
		description: 'California wildlife stories: mountain lions, condors, dolphins, sea otters, elephant seals, migratory birds, and the extraordinary diversity of animal life across the Golden State.',
	},
	{
		slug: 'geology-earthquakes',
		label: 'Geology',
		categories: ['geology-and-earthquakes'],
		description: 'The deep geology of California: the San Andreas Fault, plate tectonics, earthquakes, the Sierra Nevada, volcanic activity, and the ancient forces that shaped the landscape of the Golden State.',
	},
	{
		slug: 'ocean-science',
		label: 'Oceans',
		categories: ['marine-science'],
		description: 'California\'s ocean world: kelp forests, the California Current, Monterey Canyon, deep-sea creatures, marine mammals, whale migration, and the oceanography of the Pacific Coast.',
	},
	{
		slug: 'climate-change',
		label: 'Climate',
		categories: ['climate-change'],
		description: 'Climate change and California: drought, wildfire ecology, snowpack, sea level rise, desalination, and the science behind the environmental challenges facing the Golden State.',
	},
	{
		slug: 'plants',
		label: 'Plants',
		categories: ['horticulture'],
		description: 'California\'s remarkable plant life: giant sequoias, ancient bristlecone pines, Joshua trees, native oaks, kelp, wildflowers, and the botanical wonders of one of the world\'s most biodiverse regions.',
	},
	{
		slug: 'space',
		label: 'Space',
		categories: ['space'],
		description: 'Space science from California: JPL, Caltech, SLAC, NASA missions, telescopes, asteroid exploration, and the Golden State\'s outsized role in humanity\'s exploration of the cosmos.',
	},
	{
		slug: 'science-history',
		label: 'Science History',
		categories: ['history-of-science'],
		description: 'The history of science in California: Caltech, UC Berkeley, Scripps, the Manhattan Project, plate tectonics, the discovery of the Richter scale, and the people who transformed our understanding of the world.',
	},
] as const;
