import { CollectionsList } from "@/components/collections";
import { getCachedItems } from "@/lib/content";
import { paginateMeta } from "@/lib/paginate";
import type { Metadata } from "next";
import { getLocalizedUrl } from "@/lib/seo/hreflang";
import type { Locale } from "@/lib/constants";

// Self-referencing canonical for each page of the listing (instead of the
// [locale] layout's homepage canonical, which this route used to inherit).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}): Promise<Metadata> {
  const { locale, page } = await params;
  return {
    alternates: {
      canonical: getLocalizedUrl(`/collections/paging/${encodeURIComponent(page)}`, locale as Locale),
    },
  };
}

// Force dynamic — collectionRepository / getCachedItems consult
// request-scoped APIs during render. Static rendering throws
// DYNAMIC_SERVER_USAGE → 5xx on the paging probes.
export const dynamic = 'force-dynamic';
export const revalidate = 600;

// Allow non-English locales to be generated on-demand (ISR)
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export default async function CollectionsPagingPageDynamic({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}) {
  const { locale, page: rawPage } = await params;
  const COLLECTIONS_PER_PAGE = 6;
  const { start, page } = paginateMeta(rawPage, COLLECTIONS_PER_PAGE);

  // Fetch collections from content
  const { collections } = await getCachedItems({ lang: locale });
  const allCollections = collections.filter((collection) => collection.isActive !== false);

  // Sort and paginate collections
  const collator = new Intl.Collator(locale);
  const sortedCollections = allCollections.slice().sort((a, b) => collator.compare(a.name, b.name));
  const paginatedCollections = sortedCollections.slice(start, start + COLLECTIONS_PER_PAGE);

  return (
    <CollectionsList
      collections={paginatedCollections}
      locale={locale}
      total={allCollections.length}
      page={page}
      basePath="/collections/paging"
    />
  );
}
