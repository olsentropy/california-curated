# California Curated — Follow-ups

Last updated May 5, 2026.

**Site state:** live, healthy, fully migrated to Vercel + Astro. Search Console reporting growth (~3,300 clicks / 819K impressions over 3 months, position 8.6 average, trending up). All major migration plumbing in place. CMS now live for non-Terminal editing.

---

## ✅ Done since the migration

- Migration from WordPress to Astro/Vercel
- 930 images mirrored locally
- 162 trailing-slash redirects fixed (old WP URLs → new /blog/ URLs)
- Search Console verified, sitemap submitted, indexing on track
- Mountain lion favicon set deployed
- Donate links → Ko-fi (Header, Footer, homepage banner)
- Subscribe button removed; Contact form via Formspree (working)
- Pagefind full-text search at `/search`
- Tagline under masthead ("The natural world of California, explained.")
- Nav labels shortened to fit one line (Geology, Oceans, Climate)
- Homepage hero reordered (headline above photo); mobile order fixed
- Hero image de-duplicated across 156 posts
- Polluted post descriptions cleaned across 35 posts (with hand-written subheads on 7)
- SEO optimization: western fence lizard title + description (test case for high-impression-low-CTR posts)
- **Sveltia CMS at `/admin/`** — full editorial flow with paste-from-Word, drafts, image upload. Self-hosted GitHub OAuth bridge via Vercel functions.

---

## ✅ Critical fixes (all resolved May 5, 2026)

- ✅ **Broken post** — `the-desert-garden-at-the-huntington` was a phantom from the May 1 in-progress audit; post is healthy now (verified with build success)
- ✅ **11 thin posts** — also a phantom; current word count comparison shows all 11 posts at 100–108% of their WordPress source. The audit was measuring something else (likely page chrome).
- ✅ **14 broken images** — 17 references stripped across 13 posts. Photo credits preserved as italic lines via `_import/fix_broken_images.py`.
- ✅ **/feed/ redirect** — added 3 feed redirects to `vercel.json`: `/feed/`, `/feed/atom/`, `/comments/feed/` → `/rss.xml`.

---

## ⭐ Next up: Google AdSense / monetization

### 5. Apply for Google AdSense — TARGET MILESTONE
The next big push for the site. Two-stage process:

**Stage A — Get ready (prerequisites AdSense looks for during review):**
- ✅ Real domain with HTTPS (have it)
- ✅ Substantive original content, 166+ posts (have it)
- ✅ Working Contact page (have it)
- ❌ Real About page (currently a placeholder)
- ❌ Privacy Policy page (required for review and to disclose ad cookies)
- ❌ Site needs to have been live and stable for several weeks post-migration (we're at ~1 week, give it 2–3 more)

**Stage B — Apply and integrate:**
- Apply at https://adsense.google.com
- Approval can take days to weeks
- Once approved, decide on placements (in-article after the 2nd paragraph, sidebar, between popular features, etc.)
- Add the AdSense script + ad units to the Astro layouts

**Open questions to think about before we start:**
- Auto-ads (Google places ads automatically) vs. manual ad units (you control placement)
- How aggressive do you want the ads to be? More units = more revenue but degrades reading experience
- Whether to have any ad-free pages (About, Contact, etc.)

---

## 🟡 Launch prep (mostly tied to AdSense readiness)

### 6. Write real About page
`src/pages/about.astro` still has placeholder copy. Pull the real bio/mission from the old WP site or write fresh. **AdSense prerequisite.**

### 7. Add Privacy Policy page
Boilerplate template + customization. Must mention cookies, third-party ad networks, analytics. **AdSense prerequisite — they actively check for this.**

### 8. Vercel Web Analytics
Enable in Vercel dashboard, add `<Analytics />` component to layout. ~5 min. Free tier covers traffic. Optional but useful baseline visitor stats alongside Search Console.

### 9. SEO optimization on more high-impression-low-CTR pages
First test case (western fence lizard) was deployed; watch for 2–4 weeks to see if CTR improves. If yes, repeat for:
- **Clair Patterson** (8,864 impressions, 0.2% CTR — likely "Berkeley's cosmic breakthrough" post)
- **San Gabriel Mountains** (974 impressions/week, 0.4% CTR)
- **Hydraulic mining** (4,257 impressions, 0.6% CTR)
- Any other pages where Search Console shows >1,000 impressions and <1% CTR

---

## 🟢 Infrastructure cleanup

### 10. Move DNS off WordPress.com
Currently WordPress.com hosts the DNS. Migrate to Cloudflare (free, recommended) or Vercel DNS before canceling WordPress.com.

### 11. Confirm where the domain is registered
If WordPress.com is the registrar, transfer registration before canceling.

### 12. Email check
DNS has `wpcloud._domainkey` CNAMEs and `v=spf1 include:_spf.wpcloud.com` — confirm whether you actually receive mail at `@californiacurated.com`. If yes, that needs to migrate too. If no, ignore.

### 13. Cancel WordPress.com
Only after 10, 11, 12 are sorted.

### 14. Cancel Bluehost
Quick check first — log in, confirm nothing important is there. Then cancel.

---

## 🔵 Polish (low priority)

### 15. Convert absolute image URLs to relative
All `<img src>` paths are absolute (`https://californiacurated.com/wp-content/...`). Works fine but breaks on staging/preview deploys. ~15 min job.

### 16. Rewrite internal links from old WP form to new /blog/ form
Many post bodies contain inline hyperlinks to `https://californiacurated.com/YYYY/MM/DD/slug/`. They 308-redirect and work, but create extra hops. Cleanup via script.

### 17. Decide what to do about the 93 third-party-host images
Currently hot-linking from Wikipedia, NOAA, Flickr, Substack CDN. Pros: stable hosts. Cons: occasional 404 if source removes them. Probably leave alone.

### 18. Build the Videos section (YouTube + Instagram)
Discussed but not built. Decision needed: homepage section vs dedicated `/videos` page; manual list vs API-fetched; how many videos to feature.

---

## Reference

- **Project root:** `~/Documents/CLAUDE/californiacurated`
- **Domain:** `californiacurated.com` (apex, A → 216.198.79.1 / Vercel)
- **Hosting:** Vercel (`olsentropy-6014`'s `california-curated` project)
- **Repo:** `https://github.com/olsentropy/california-curated`
- **DNS:** WordPress.com (currently — needs to move)
- **CMS admin:** `https://californiacurated.com/admin/` (Sveltia, GitHub OAuth)
- **Search admin:** Google Search Console for `californiacurated.com` (Domain property, sitemap submitted)
- **Migration audit:** `_import/seo_compare_summary.txt`
- **Original WP export:** `_import/californiacurated.WordPress.2026-05-01.xml`
