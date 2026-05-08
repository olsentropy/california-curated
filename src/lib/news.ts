// Helpers for the curated news rail.
// Reads /src/data/news.json and exposes utilities for rendering.

import newsData from '../data/news.json';

export interface NewsItem {
	headline: string;
	url: string;
	source: string;
	publishedAt: string; // ISO 8601
}

export interface NewsData {
	lastUpdated: string;
	items: NewsItem[];
}

export const news: NewsData = newsData as NewsData;

/** Human-friendly relative time, e.g. "6h ago", "2d ago", "Just now". */
export function relativeTime(iso: string): string {
	const then = new Date(iso).getTime();
	const now = Date.now();
	const diffMs = Math.max(0, now - then);
	const min = Math.round(diffMs / 60_000);
	if (min < 1) return 'Just now';
	if (min < 60) return `${min}m ago`;
	const hr = Math.round(min / 60);
	if (hr < 24) return `${hr}h ago`;
	const days = Math.round(hr / 24);
	if (days < 7) return `${days}d ago`;
	const weeks = Math.round(days / 7);
	if (weeks < 5) return `${weeks}w ago`;
	const months = Math.round(days / 30);
	return `${months}mo ago`;
}

/** Absolute date (e.g. "May 7, 2026") for the dedicated /news page. */
export function absoluteDate(iso: string): string {
	return new Date(iso).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

/** Items sorted newest first. */
export function getItems(): NewsItem[] {
	return [...news.items].sort(
		(a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf(),
	);
}

/** Top N items for the homepage rail. */
export function topItems(n = 8): NewsItem[] {
	return getItems().slice(0, n);
}
