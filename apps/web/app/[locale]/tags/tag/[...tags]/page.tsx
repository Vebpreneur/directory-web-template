import type { Metadata } from "next";
import { getCachedItemsByTag, getCachedItems } from "@/lib/content";
import { paginateMeta, totalPages } from "@/lib/paginate";
import ListingTags from "../../listing-tags";
import { getTagsEnabled } from "@/lib/utils/settings";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { getTranslations } from "next-intl/server";
import { DEFAULT_LOCALE } from "@/lib/constants";
import { toTitleCase } from "@/lib/utils";
import { generateListingMetadata } from "@/lib/seo/listing-metadata";

// Force dynamic — getCachedItemsByTag consults request-scoped APIs during
// render, so an on-demand ISR render threw and every /tags/tag/<tag> URL
// answered HTTP 500. Same fix as categories/category and tags/paging/[page].
export const dynamic = 'force-dynamic';
// Enable ISR with 10 minutes revalidation
export const revalidate = 600;

/**
 * Own metadata instead of the [locale] layout's, which made every
 * /tags/tag/<tag> URL declare the HOMEPAGE canonical. Every page of this route
 * renders the same tag grid, and the tag's own page is /tags/<tag> — the URL
 * the sitemap and every internal link use — so all of them canonicalise there.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ tags: string[]; locale: string }>;
}): Promise<Metadata> {
  const { tags: tagMeta, locale } = await params;
  const [rawTag] = tagMeta;
  const tag = decodeURI(rawTag);
  // An unknown tag gets the not-found page (the page below does the same).
  // Resolving it here also keeps its metadata from naming /tags/<unknown>, a
  // 404, as the canonical. (This route's loading.tsx streams the response, so
  // Next sends the not-found page, noindex, with status 200 - see Next's
  // streaming-metadata docs.)
  const { tags } = await getCachedItemsByTag(tag, { lang: locale });
  const matchedTag = tags.find(
    (t) => t.id === tag || t.name?.toLowerCase() === tag.toLowerCase()
  );
  if (!matchedTag) {
    notFound();
  }

  return generateListingMetadata({
    title: `${toTitleCase(tag)} Tag`,
    path: `/tags/${encodeURIComponent(matchedTag.id)}`,
    locale,
    keywords: [tag, "tag", "directory", "listings"],
  });
}

// Allow non-English locales to be generated on-demand (ISR)
export const dynamicParams = true;

export async function generateStaticParams() {
  // Only pre-build English locale for optimal build size
  // Other locales will be generated on-demand and cached via ISR
  const locale = 'en';
  const { tags } = await getCachedItems({ lang: locale });
  const paths = [];

  for (const tag of tags) {
    const pages = totalPages(tag.count || 0);

    for (let i = 1; i <= pages; ++i) {
      if (i === 1) {
        paths.push({ tags: [tag.id], locale });
      } else {
        paths.push({ tags: [tag.id, i.toString()], locale });
      }
    }
  }

  return paths;
}

export default async function TagListing({
  params,
}: {
  params: Promise<{ tags: string[]; locale: string }>;
}) {
  const tagsEnabled = getTagsEnabled();
  if (!tagsEnabled) {
    notFound();
  }

  const resolvedParams = await params;
  const { tags: tagMeta, locale } = resolvedParams;
  const [rawTag, rawPage] = tagMeta;
  const tag = decodeURI(rawTag);
  const { page } = paginateMeta(rawPage || "1");
  const { total, tags } = await getCachedItemsByTag(tag, {
    lang: locale,
  });

  // Unknown tag → the not-found page (noindex), as on /tags/<tag>, not the
  // full tag grid under any string.
  const knownTag = tags.some(
    (t) => t.id === tag || t.name?.toLowerCase() === tag.toLowerCase()
  );
  if (!knownTag) {
    notFound();
  }

  const tCommon = await getTranslations({ locale, namespace: "common" });
  const localePrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const tagName = toTitleCase(tag);
  const breadcrumbItems: { name: string; url?: string }[] = [
    { name: tCommon("HOME"), url: `${localePrefix || "/"}` },
    { name: tCommon("TAGS"), url: `${localePrefix}/tags` },
  ];
  if (page > 1) {
    breadcrumbItems.push({
      name: tagName,
      // The tag's canonical page (see generateMetadata above).
      url: `${localePrefix}/tags/${tag}`,
    });
    breadcrumbItems.push({ name: `Page ${page}` });
  } else {
    breadcrumbItems.push({ name: tagName });
  }

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ListingTags
        total={total}
        page={page}
        basePath={`/tags/tag/${tag}`}
        tags={tags}
      />
    </>
  );
}