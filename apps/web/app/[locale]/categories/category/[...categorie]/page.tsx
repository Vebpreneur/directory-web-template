import { Metadata } from "next";
import { getCachedItemsByCategory, getCachedItems } from "@/lib/content";
import { paginateMeta, totalPages } from "@/lib/paginate";
import { generateListingMetadata } from "@/lib/seo/listing-metadata";
import { toTitleCase, slugify } from "@/lib/utils";
import Listing from "../../../(listing)/listing";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { getTranslations } from "next-intl/server";
import { DEFAULT_LOCALE } from "@/lib/constants";

// Force dynamic — getCachedItemsByCategory / Listing consult request-scoped
// APIs during render, so an on-demand ISR render threw DYNAMIC_SERVER_USAGE
// and every /categories/category/<id> URL answered HTTP 500 (on every
// directory built from this template, e.g. all 125 categories of one Work;
// reproduced locally). Same fix as tags/paging/[page].
export const dynamic = 'force-dynamic';
// Enable ISR with 10 minutes revalidation
export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorie: string[]; locale: string }>;
}): Promise<Metadata> {
  const { categorie: categoryMeta, locale } = await params;
  const [rawCategory, rawPage] = categoryMeta;
  const category = decodeURIComponent(rawCategory);
  const page = rawPage ? parseInt(rawPage) : 1;
  const { total } = await getCachedItemsByCategory(category, { lang: locale });
  const formattedCategory = toTitleCase(category);
  const title = page > 1 ? `${formattedCategory} - Page ${page}` : formattedCategory;
  const encodedCategory = encodeURIComponent(category);
  // Page 1 is the same listing as /categories/<id> - the shape every internal
  // link and the sitemap use - so it canonicalises there instead of to itself.
  const path = page > 1 ? `/categories/category/${encodedCategory}/${page}` : `/categories/${encodedCategory}`;

  return generateListingMetadata({
    title,
    path,
    locale,
    itemCount: total,
    keywords: [category, "category", "directory", "listings"],
  });
}

// Allow non-English locales to be generated on-demand (ISR)
export const dynamicParams = true;

export async function generateStaticParams() {
  // Only pre-build English locale for optimal build size
  const locale = 'en';
  const { categories } = await getCachedItems({ lang: locale });
  const paths = [];

  for (const category of categories) {
    const pages = totalPages(category.count || 0);

    for (let i = 1; i <= pages; ++i) {
      if (i === 1) {
        paths.push({ categorie: [category.id], locale });
      } else {
        paths.push({ categorie: [category.id, i.toString()], locale });
      }
    }
  }

  return paths;
}

export default async function CategoryListing({
  params,
}: {
  params: Promise<{ categorie: string[]; locale: string }>;
}) {
  const resolvedParams = await params;
  const { categorie: categoryMeta, locale } = resolvedParams;
  const [rawCategory, rawPage] = categoryMeta;
  const category = decodeURIComponent(rawCategory);
  
  // Handle pagination
  const page = rawPage ? parseInt(rawPage) : 1;
  const { start } = paginateMeta(page);
  
  // For now, we'll use the original approach
  // In the future, we can implement query parameters here
  const result = await getCachedItemsByCategory(category, { lang: locale });

  const { items, categories, total, tags } = result;

  // Resolve to a known category ID (handles URL-encoded names with spaces, etc.)
  const slug = slugify(category);
  const matchedCategory = categories.find(
    (c) => c.id === category || c.id === slug
      || c.name.toLowerCase() === category.toLowerCase()
  );
  const resolvedCategory = matchedCategory?.id ?? slug;

  const tCommon = await getTranslations({ locale, namespace: "common" });
  const localePrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const categoryName = matchedCategory?.name ?? toTitleCase(category);
  const breadcrumbItems: { name: string; url?: string }[] = [
    { name: tCommon("HOME"), url: `${localePrefix || "/"}` },
    { name: tCommon("CATEGORIES"), url: `${localePrefix}/categories` },
  ];
  if (page > 1) {
    breadcrumbItems.push({
      name: categoryName,
      // The category's canonical page (see generateMetadata above).
      url: `${localePrefix}/categories/${resolvedCategory}`,
    });
    breadcrumbItems.push({ name: `Page ${page}` });
  } else {
    breadcrumbItems.push({ name: categoryName });
  }

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Listing
        total={total}
        start={start}
        page={page}
        basePath={`/categories/category/${resolvedCategory}`}
        categories={categories}
        tags={tags}
        items={items}
        initialCategory={resolvedCategory}
      />
    </>
  );
}
