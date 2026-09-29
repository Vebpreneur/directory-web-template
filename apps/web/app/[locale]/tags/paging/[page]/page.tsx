import { getCachedItems } from "@/lib/content";
import { paginateMeta, totalPages } from "@/lib/paginate";
import ListingTags from "../../listing-tags";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTagsEnabled } from "@/lib/utils/settings";
import { generateListingMetadata } from "@/lib/seo/listing-metadata";
import { pagingCanonicalPath, pagingTitle, resolveListingPage } from "@/lib/seo/paging";

// Set per page to 12 for tags (default from config)
const PER_PAGE = 12; // This matches the default in LayoutThemeContext

/**
 * The tags and the page this URL names, or `page: null` when the segment is
 * not a page of the tag listing (malformed, or past the last page).
 */
async function resolveTagsPage(rawPage: string | undefined, locale: string) {
  const { tags } = await getCachedItems({ lang: locale, sortTags: true });
  return { tags, page: resolveListingPage(rawPage, tags.length, PER_PAGE) };
}

/**
 * Own metadata instead of the [locale] layout's homepage canonical. Page 1 is
 * the same listing as /tags, so it takes /tags' canonical and title; each
 * later page is canonical to itself with a title of its own. Anything that is
 * not a page of the listing (/tags/paging/abc, /tags/paging/999) is
 * not-found, not an empty grid that claims to be canonical. This route's
 * loading.tsx streams the response, so that page is sent with status 200 and
 * `noindex`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string; locale: string }>;
}): Promise<Metadata> {
  // Tags switched off: /tags 404s on this site (the page below does the same).
  if (!getTagsEnabled()) {
    notFound();
  }

  const { locale, page: rawPage } = await params;
  const { tags, page } = await resolveTagsPage(rawPage, locale);
  if (page === null) {
    notFound();
  }

  return generateListingMetadata({
    title: pagingTitle("Tags", page),
    path: pagingCanonicalPath("/tags", page),
    locale,
    itemCount: tags.length,
    keywords: ["tags", "browse", "directory", "labels"],
  });
}

// Force dynamic — getCachedItems consults request-scoped APIs
// during render. Static rendering throws DYNAMIC_SERVER_USAGE → 5xx
// on the paging probes.
export const dynamic = 'force-dynamic';
export const revalidate = 600;

// Allow non-English locales to be generated on-demand (ISR)
export const dynamicParams = true;

export async function generateStaticParams() {
  // Only pre-build English locale for optimal build size
  const locale = 'en';
  const { tags } = await getCachedItems({ lang: locale });
  const paths = [];
  const pages = totalPages(tags.length);

  for (let i = 1; i <= pages; ++i) {
    paths.push({ page: i.toString(), locale });
  }

  return paths;
}

export default async function TagPagingPage({
  params,
}: {
  params: Promise<{ page: string; locale: string }>;
}) {
  // Tags switched off → the not-found page, as on /tags/paging.
  if (!getTagsEnabled()) {
    notFound();
  }

  const { page: pageMeta, locale } = await params;
  // `page` is one segment (a string), not a catch-all array: `pageMeta[0]`
  // took its first CHARACTER, so /tags/paging/10..19 all rendered page 1 while
  // each declared itself canonical.
  const { tags, page: resolvedPage } = await resolveTagsPage(pageMeta, locale);
  if (resolvedPage === null) {
    notFound();
  }
  const { start, page } = paginateMeta(resolvedPage, PER_PAGE);

  // PAGINATE tags here!
  const paginatedTags = tags.slice(start, start + PER_PAGE);

  // Debug log
  console.log({
    page,
    start,
    perPage: PER_PAGE,
    totalTags: tags.length,
    paginatedTags: paginatedTags.length,
    paginatedTagNames: paginatedTags.map(t => t.name)
  });

  return (
    <ListingTags
      total={tags.length}
      page={page}
      basePath="/tags/paging"
      tags={paginatedTags} // <-- Only pass paginated tags!
    />
  );
}
