/**
 * Remark plugin: auto-merge image + caption paragraphs.
 *
 * Sveltia (and most CMS / Substack pastes) emit images as their own
 * standalone paragraphs, with the caption text following in the next
 * paragraph. The site's existing `.prose p:has(img)` rule only styles
 * captions that share a paragraph with their image, so the separate-
 * paragraph pattern would render as plain body text.
 *
 * This plugin walks the markdown AST and, when it finds an image-only
 * paragraph immediately followed by a paragraph that looks like a caption,
 * folds the caption text into the image paragraph. The end result mirrors
 * the older WordPress paste structure and gets caption styling for free.
 *
 * Heuristic for "looks like a caption": the next paragraph must contain a
 * credit pattern like `(Photo: ...)`, `(Credit: ...)`, etc. This is a
 * conservative gate — it avoids accidentally merging body text after a
 * captionless image. If the user wants a caption styled, they include a
 * credit. (You can extend the pattern or relax the rule if needed.)
 */

const CREDIT_PATTERN =
	/\((?:Photo|Photograph|Photographs|Pohto|Image|Images|Credit|Source|Courtesy|Illustration|Illustrations|Map|Maps|Video|Drawing|Artwork|Diagram|Photos)[\s:]/i;

export default function remarkMergeImageCaptions() {
	return (tree) => {
		if (!Array.isArray(tree?.children)) return;

		let i = 0;
		while (i < tree.children.length - 1) {
			const node = tree.children[i];
			const next = tree.children[i + 1];

			if (
				node?.type === 'paragraph' &&
				next?.type === 'paragraph' &&
				isImageOnlyParagraph(node) &&
				!paragraphContainsImage(next) &&
				looksLikeCaption(next)
			) {
				// Fold caption children into the image paragraph; drop the now-empty
				// caption paragraph from the tree.
				node.children.push(...next.children);
				tree.children.splice(i + 1, 1);
				// Don't advance — re-check this position in case another image-only
				// paragraph (with caption) immediately follows.
			} else {
				i++;
			}
		}
	};
}

// True if the paragraph's only element is an <img>, or a link wrapping an <img>.
function isImageOnlyParagraph(p) {
	if (!Array.isArray(p?.children) || p.children.length !== 1) return false;
	const c = p.children[0];
	if (c?.type === 'image') return true;
	if (
		c?.type === 'link' &&
		Array.isArray(c.children) &&
		c.children.length === 1 &&
		c.children[0]?.type === 'image'
	) {
		return true;
	}
	return false;
}

// True if any descendant of `node` is an image.
function paragraphContainsImage(node) {
	if (node?.type === 'image') return true;
	if (!Array.isArray(node?.children)) return false;
	return node.children.some(paragraphContainsImage);
}

// Caption heuristic: the rendered text contains a credit-style parenthetical.
function looksLikeCaption(p) {
	return CREDIT_PATTERN.test(getText(p));
}

function getText(node) {
	if (node?.type === 'text') return node.value || '';
	if (!Array.isArray(node?.children)) return '';
	return node.children.map(getText).join('');
}
