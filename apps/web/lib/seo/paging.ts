/**
 * Page-number helpers for the paginated listing routes
 * (`/tags/paging/<n>`, `/collections/paging/<n>`).
 *
 * Only a real page of a listing may answer as an indexable, self-canonical
 * URL. `parseInt()` read `2abc` as 2 and `abc` as NaN, and no route checked
 * the upper bound, so `/tags/paging/abc` and `/tags/paging/999` each rendered
 * an empty grid that declared itself canonical, and `/tags/paging/1`
 * duplicated `/tags` while pointing at itself.
 */

/**
 * Strictly parse a page path segment: a positive integer written without a
 * sign, leading zeros or any other character. Anything else is null.
 */
export function parsePageParam(raw: string | null | undefined): number | null {
	if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return null;
	const page = Number(raw);
	return Number.isSafeInteger(page) ? page : null;
}

/**
 * How many pages a listing of `total` records has. At least 1, so an empty
 * listing still has its first page (the listing index itself).
 */
export function listingPageCount(total: number, perPage: number): number {
	if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(perPage) || perPage <= 0) return 1;
	return Math.max(1, Math.ceil(total / perPage));
}

/**
 * The page a `/<listing>/paging/<n>` segment names, or null when it is not a
 * page of this listing: not a canonical page number, or past the last page.
 * The route answers not-found for null.
 */
export function resolveListingPage(raw: string | null | undefined, total: number, perPage: number): number | null {
	const page = parsePageParam(raw);
	if (page === null) return null;
	return page <= listingPageCount(total, perPage) ? page : null;
}

/**
 * The canonical path of page `page` of the listing at `listingPath`
 * (`/tags`, `/collections`): page 1 IS the listing index, later pages are
 * `<listingPath>/paging/<n>`.
 */
export function pagingCanonicalPath(listingPath: string, page: number): string {
	return page > 1 ? `${listingPath}/paging/${page}` : listingPath;
}

/** The listing title for page `page`: the plain title on page 1, `<title> - Page <n>` after. */
export function pagingTitle(title: string, page: number): string {
	return page > 1 ? `${title} - Page ${page}` : title;
}
