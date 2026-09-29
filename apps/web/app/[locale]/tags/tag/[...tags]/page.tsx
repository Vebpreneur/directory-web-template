import type { Metadata } from "next";
import { getCachedItemsByTag, getCachedItems, type Tag } from "@/lib/content";
import { totalPages } from "@/lib/paginate";
import ListingTags from "../../listing-tags";
import { getTagsEnabled } from "@/lib/utils/settings";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { getTranslations } from "next-intl/server";
import { DEFAULT_LOCALE } from "@/lib/constants";
import { toTitleCase } from "@/lib/utils";
import { generateListingMetadata } from "@/lib/seo/listing-metadata";
import { parsePageParam } from "@/lib/seo/paging";

// Force dynamic — getCachedItemsByTag consults request-scoped APIs during
// render, so an on-demand ISR render threw and every /tags/tag/<tag> URL
// answered HTTP 500. Same fix as categories/category and tags/paging/[page].
export const dynamic = 'force-dynamic';
// Enable ISR with 10 minutes revalidation
export const revalidate = 600;

/** The tag a URL segment names: by id, or by name (any case). */
function findTag(tags: Tag[], tag: string): Tag | undefined {
  return tags.find(
    (t) => t.id === tag || t.name?.toLowerCase() === tag.toLowerCase()
  );
}

/**
 * Own metadata instead of the [locale] layout's, which made every
 * /tags/tag/<tag> URL declare the HOMEPAGE canonical.
 *
 * Every page of this route renders the ALL-TAGS grid (<ListingTags> gets every
 * tag, unsliced, under the "Tags" hero): the content of /tags, not of the
 * tag's own item listing /tags/<id>. So each of them canonicalises to /tags,
 * with /tags' own title and description (tags/page.tsx).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ tags: string[]; locale: string }>;
}): Promise<Metadata> {
  // Tags switched off: /tags 404s on this site (the page below does the same).
  if (!getTagsEnabled()) {
    notFound();
  }

  const { tags: tagMeta, locale } = await params;
  const [rawTag] = tagMeta;
  const tag = decodeURI(rawTag);
  // An unknown tag gets the not-found page (the page below does the same).
  // This route's loading.tsx streams the response, so that page is sent with
  // status 200 and `noindex` (Next's streaming-metadata behaviour).
  const { tags } = await getCachedItemsByTag(tag, { lang: locale });
  if (!findTag(tags, tag)) {
    notFound();
  }

  return generateListingMetadata({
    title: "Tags",
    path: "/tags",
    locale,
    itemCount: tags.length,
    keywords: ["tags", "browse", "directory", "labels"],
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
  // A malformed page segment (`abc`, `02`) reads as page 1 rather than NaN.
  const page = parsePageParam(rawPage) ?? 1;
  const { total, tags } = await getCachedItemsByTag(tag, {
    lang: locale,
  });

  // Unknown tag → the not-found page (noindex), as on /tags/<tag>, not the
  // full tag grid under any string.
  const matchedTag = findTag(tags, tag);
  if (!matchedTag) {
    notFound();
  }

  const tCommon = await getTranslations({ locale, namespace: "common" });
  const localePrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const tagName = matchedTag.name || toTitleCase(matchedTag.id);
  const breadcrumbItems: { name: string; url?: string }[] = [
    { name: tCommon("HOME"), url: `${localePrefix || "/"}` },
    { name: tCommon("TAGS"), url: `${localePrefix}/tags` },
  ];
  if (page > 1) {
    breadcrumbItems.push({
      name: tagName,
      // The tag's own page, under its id (a URL segment may name the tag by
      // its display name, e.g. `Open%20Source`).
      url: `${localePrefix}/tags/${encodeURIComponent(matchedTag.id)}`,
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
