#!/usr/bin/env python3
"""
Append the editorial-style Instagram follow CTA to every article in
src/content/blog/. Idempotent — skips files that already have the
`ig-cta` class. Run from repo root:

    python3 scripts/add-ig-cta.py
"""
import os
import sys
from pathlib import Path

IG_BLOCK = (
    '<div class="ig-cta">'
    '<div class="ig-cta-eyebrow">'
    '<span class="ig-cta-rule"></span>'
    '<span class="ig-cta-label">FOLLOW US</span>'
    '<span class="ig-cta-rule"></span>'
    '</div>'
    '<p class="ig-cta-text">'
    'More California science, photography and wild places on '
    '<a class="ig-cta-link" '
    'href="https://www.instagram.com/californiacuratedus/" '
    'target="_blank" rel="noopener noreferrer me">'
    'Instagram '
    '<svg viewBox="0 0 24 24" aria-hidden="true">'
    '<path fill="currentColor" d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.42.37 1.06.42 2.23.06 1.25.07 1.65.07 4.85s0 3.6-.07 4.85c-.05 1.17-.25 1.8-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.17-1.06.37-2.23.42-1.25.06-1.65.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.42a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.17-.42-.37-1.06-.42-2.23C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.85c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.06-.37 2.23-.42C8.4 2.2 8.8 2.2 12 2.2zm0 1.95c-3.14 0-3.51 0-4.75.07-1.07.05-1.65.23-2.04.38-.51.2-.88.44-1.27.83-.39.39-.63.76-.83 1.27-.15.39-.33.97-.38 2.04-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.05 1.07.23 1.65.38 2.04.2.51.44.88.83 1.27.39.39.76.63 1.27.83.39.15.97.33 2.04.38 1.24.06 1.61.07 4.75.07s3.51 0 4.75-.07c1.07-.05 1.65-.23 2.04-.38.51-.2.88-.44 1.27-.83.39-.39.63-.76.83-1.27.15-.39.33-.97.38-2.04.06-1.24.07-1.61.07-4.75s0-3.51-.07-4.75c-.05-1.07-.23-1.65-.38-2.04a2.43 2.43 0 00-.83-1.27 2.43 2.43 0 00-1.27-.83c-.39-.15-.97-.33-2.04-.38C15.51 4.15 15.14 4.15 12 4.15zm0 3.32a4.53 4.53 0 110 9.06 4.53 4.53 0 010-9.06zm0 1.95a2.58 2.58 0 100 5.16 2.58 2.58 0 000-5.16zm5.78-2.17a1.06 1.06 0 11-2.12 0 1.06 1.06 0 012.12 0z"/>'
    '</svg>'
    ' @californiacuratedus'
    '</a>'
    '</p>'
    '</div>'
)


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    blog_dir = repo_root / "src" / "content" / "blog"
    if not blog_dir.is_dir():
        print(f"error: blog directory not found at {blog_dir}", file=sys.stderr)
        return 1

    md_files = sorted(blog_dir.glob("*.md"))
    print(f"Scanning {len(md_files)} articles in {blog_dir}\n")

    added = 0
    skipped = 0
    for path in md_files:
        text = path.read_text(encoding="utf-8")
        if "ig-cta" in text:
            skipped += 1
            continue

        # Normalize trailing whitespace; ensure exactly one blank line
        # before the IG block and exactly one trailing newline at EOF.
        body = text.rstrip()
        new_text = f"{body}\n\n{IG_BLOCK}\n"
        path.write_text(new_text, encoding="utf-8")
        added += 1

    print(f"Added IG CTA to {added} files")
    print(f"Skipped (already had ig-cta) {skipped} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
