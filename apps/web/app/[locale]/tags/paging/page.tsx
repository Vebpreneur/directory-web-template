import { getCachedItems } from "@/lib/content";
import { paginateMeta, PER_PAGE } from "@/lib/paginate";
import ListingTags from "../listing-tags";
import { getTagsEnabled } from "@/lib/utils/settings";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocalizedUrl } from "@/lib/seo/hreflang";
import type { Locale } from "@/lib/constants";

// Page 1 of the paging route renders the same listing as /tags, so it
// canonicalises there. Without this it inherited the [locale] layout's
// canonical and declared itself a duplicate of the homepage.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: { canonical: getLocalizedUrl("/tags", locale as Locale) } };
}

// Enable ISR with 10 minutes revalidation
export const revalidate = 600;

// Allow non-English locales to be generated on-demand (ISR)
export const dynamicParams = true;

export async function generateStaticParams() {
  // Only pre-build English locale for optimal build size
  return [{ locale: 'en' }];
}

export default async function TagPagingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const tagsEnabled = getTagsEnabled();
  if (!tagsEnabled) {
    notFound();
  }

  const { locale } = await params
  const { start, page } = paginateMeta();
  const { tags, total } = await getCachedItems({ lang: locale });

  // Sort and paginate tags with locale-aware sorting
  const collator = new Intl.Collator(locale);
  const sortedTags = tags.slice().sort((a, b) => collator.compare(a.name, b.name));
  const paginatedTags = sortedTags.slice(start, start + PER_PAGE);

  return (
    <ListingTags
      total={total}
      page={page}
      basePath="/tags/paging"
      tags={paginatedTags}
    />
  );
}