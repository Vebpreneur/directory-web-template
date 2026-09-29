import { getCachedItems } from "@/lib/content";
import { paginateMeta, totalPages } from "@/lib/paginate";
import ListingTags from "../../listing-tags";
import type { Metadata } from "next";
import { getLocalizedUrl } from "@/lib/seo/hreflang";
import type { Locale } from "@/lib/constants";

// Self-referencing canonical for each page of the listing (instead of the
// [locale] layout's homepage canonical, which this route used to inherit).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string; locale: string }>;
}): Promise<Metadata> {
  const { locale, page } = await params;
  return {
    alternates: {
      canonical: getLocalizedUrl(`/tags/paging/${encodeURIComponent(page)}`, locale as Locale),
    },
  };
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

// Set per page to 12 for tags (default from config)
const PER_PAGE = 12; // This matches the default in LayoutThemeContext

export default async function TagPagingPage({
  params,
}: {
  params: Promise<{ page: string; locale: string }>;
}) {
  const { page: pageMeta, locale } = await params;
  // `page` is one segment (a string), not a catch-all array: `pageMeta[0]`
  // took its first CHARACTER, so /tags/paging/10..19 all rendered page 1 while
  // each declared itself canonical.
  const rawPage = pageMeta || "1";
  const { start, page } = paginateMeta(rawPage, PER_PAGE);
  const { tags } = await getCachedItems({ lang: locale, sortTags: true });

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
