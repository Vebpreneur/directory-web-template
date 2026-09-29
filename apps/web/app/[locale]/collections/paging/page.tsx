import { CollectionsList } from "@/components/collections";
import { getCachedItems } from "@/lib/content";
import { paginateMeta } from "@/lib/paginate";
import { Collection } from "@/types/collection";
import type { Metadata } from "next";
import { getLocalizedUrl } from "@/lib/seo/hreflang";
import type { Locale } from "@/lib/constants";

// Page 1 of the paging route renders the same listing as /collections, so it
// canonicalises there. Without this it inherited the [locale] layout's
// canonical and declared itself a duplicate of the homepage.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: { canonical: getLocalizedUrl("/collections", locale as Locale) } };
}

// Enable ISR with 10 minutes revalidation
export const revalidate = 600;

// Allow non-English locales to be generated on-demand (ISR)
export const dynamicParams = true;

export async function generateStaticParams() {
  // Only pre-build English locale for optimal build size
  return [{ locale: 'en' }];
}

export default async function CollectionsPagingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const COLLECTIONS_PER_PAGE = 6;
  const { start, page } = paginateMeta(1, COLLECTIONS_PER_PAGE);

  // Fetch collections from content
  const { collections } = await getCachedItems({ lang: locale });

  // Filter active collections only
  const activeCollections = collections.filter((c) => c.isActive !== false);

  // Sort and paginate collections
  const collator = new Intl.Collator(locale);
  const sortedCollections = activeCollections.slice().sort((a: Collection, b: Collection) => collator.compare(a.name, b.name));
  const paginatedCollections = sortedCollections.slice(start, start + COLLECTIONS_PER_PAGE);

  return (
    <CollectionsList
      collections={paginatedCollections}
      locale={locale}
      total={activeCollections.length}
      page={page}
      basePath="/collections/paging"
    />
  );
}
