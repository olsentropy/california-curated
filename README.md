# California Curated

California, explained — the Astro + Vercel rebuild of [californiacurated.com](https://californiacurated.com).

## Stack

- **[Astro](https://astro.build/)** — static site generator
- **GitHub** — source of truth
- **Vercel** — hosting + CI

## Local development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # production build to ./dist
npm run preview  # preview the production build
```

## Project layout

- `_import/` — WordPress export + conversion artifacts
- `public/` — static assets served at /
- `src/components/` — Header, Footer, BaseHead, FormattedDate
- `src/content/blog/` — 162 imported posts as markdown
- `src/lib/posts.ts` — filter/sort helpers
- `src/pages/` — homepage, archive, category pages, RSS
- `src/styles/global.css` — brand palette, prose styles
- `vercel.json` — 301 redirects from old WordPress URLs

## Migration notes

WordPress source URLs followed `/YYYY/MM/DD/<slug>/`. New URLs are `/blog/<slug>/`.
All 162 old URLs have permanent (301) redirects in `vercel.json`.

Hero images and inline images are still referenced from WordPress.com CDN URLs.
They render fine at runtime; a follow-up step will download them locally.

Drafts/private posts (32) were skipped during import.
