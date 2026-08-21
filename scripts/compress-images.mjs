// Compresses all JPG/JPEG/PNG images in public/ in place.
// PNGs → compressed PNG. JPGs → 80% quality JPEG.
// Skips files already under 200KB.
// Run: node scripts/compress-images.mjs

import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

const PUBLIC = new URL('../public', import.meta.url).pathname;
const SKIP_BELOW_BYTES = 200 * 1024; // 200KB — already small enough

async function walk(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const e of entries) {
		const full = join(dir, e.name);
		if (e.isDirectory()) files.push(...await walk(full));
		else files.push(full);
	}
	return files;
}

async function main() {
	const all = await walk(PUBLIC);
	const images = all.filter(f => /\.(jpe?g|png)$/i.test(f));
	console.log(`Found ${images.length} images.`);

	let saved = 0;
	let skipped = 0;
	let errors = 0;

	for (const file of images) {
		const { size } = await stat(file);
		if (size < SKIP_BELOW_BYTES) { skipped++; continue; }

		const ext = extname(file).toLowerCase();
		try {
			let buf;
			if (ext === '.png') {
				buf = await sharp(file).png({ compressionLevel: 9, effort: 10 }).toBuffer();
			} else {
				buf = await sharp(file).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
			}
			if (buf.length < size) {
				const { writeFile } = await import('node:fs/promises');
				await writeFile(file, buf);
				const kb = (size - buf.length) / 1024;
				saved += kb;
				console.log(`  ✓ ${basename(file)}  ${(size/1024).toFixed(0)}KB → ${(buf.length/1024).toFixed(0)}KB  (-${kb.toFixed(0)}KB)`);
			} else {
				skipped++;
			}
		} catch (e) {
			console.warn(`  ✗ ${basename(file)}: ${e.message}`);
			errors++;
		}
	}

	console.log(`\nDone. Saved ${(saved/1024).toFixed(1)}MB | Skipped ${skipped} | Errors ${errors}`);
}

main();
