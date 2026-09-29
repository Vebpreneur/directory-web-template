export const revalidate = 3600;

import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DocsPageContent } from './docs-page-content';
import { getBaseUrl } from '@/lib/utils/url-cleaner';
import { generateHreflangAlternates, getLocalizedUrl } from '@/lib/seo/hreflang';
import { Locale } from '@/lib/constants';

// Public origin: NEXT_PUBLIC_CANONICAL_URL when pinned (and valid), else the
// app URL. getBaseUrl() validates both, so a malformed pin cannot make
// `new URL(appUrl)` below throw.
const appUrl = getBaseUrl();

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    metadataBase: new URL(appUrl),
    title: `${t('help.DOCS_PAGE_TITLE')} - Ever Works Template`,
    description: t('help.DOCS_PAGE_DESCRIPTION'),
    alternates: {
      canonical: getLocalizedUrl('/docs', locale as Locale),
      languages: generateHreflangAlternates('/docs')
    }
  };
}

export default function DocsPage() {
  return <DocsPageContent />;
}
