/*
 * The URLs this docs build hands to crawlers - canonical, og:url, hreflang (src/theme/SiteMetadata)
 * and the BreadcrumbList structured data (src/theme/DocBreadcrumbs/StructuredData) - must be URLs
 * the deployment answers with a 200, never with a redirect. Two things stand in the way, and both
 * are settled in docusaurus.config.ts and published through customFields:
 *
 * - hasCanonicalOrigin: false when the build has no DOCS_URL. Such a build is noindex and must
 *   not name any host, so these components emit no canonical, hreflang or breadcrumb URLs at all.
 * - homeCanonicalPath: the page a deployment redirects its site root to (DOCS_HOME_CANONICAL_PATH),
 *   "/" when the root serves itself. The default locale's root is mapped to that page.
 */
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

type CustomFields = Record<string, unknown> | undefined;

function homeCanonicalPathOf(customFields: CustomFields): string {
	return typeof customFields?.homeCanonicalPath === 'string' ? customFields.homeCanonicalPath : '/';
}

// True unless docusaurus.config.ts says this build has no canonical origin (no DOCS_URL).
export function useHasCanonicalOrigin(): boolean {
	const {
		siteConfig: { customFields }
	} = useDocusaurusContext();
	return customFields?.hasCanonicalOrigin !== false;
}

// Maps the default locale's root URL (fully qualified) to the served home page URL; every other
// URL passes through unchanged.
export function useServedUrl(): (url: string) => string {
	const {
		siteConfig: { customFields },
		i18n: { defaultLocale, localeConfigs }
	} = useDocusaurusContext();
	const { url, baseUrl } = localeConfigs[defaultLocale]!;
	const rootUrl = `${url}${baseUrl}`;
	const homeUrl = `${rootUrl}${homeCanonicalPathOf(customFields).replace(/^\/+/, '')}`;
	return (candidate) => (candidate === rootUrl ? homeUrl : candidate);
}

// Maps a site-relative href ("/payment/stripe", as sidebars and breadcrumbs carry it) to the path
// the deployment serves: the trailing slash applied the way Docusaurus's own <Link> applies
// `trailingSlash`, and the default locale's root mapped to the served home page. Hrefs that are
// not site-relative (external, hash-only) pass through unchanged.
export function useServedHref(): (href: string) => string {
	const {
		siteConfig: { customFields, trailingSlash },
		i18n: { defaultLocale, localeConfigs }
	} = useDocusaurusContext();
	const { baseUrl: rootPath } = localeConfigs[defaultLocale]!;
	const homePath = `${rootPath}${homeCanonicalPathOf(customFields).replace(/^\/+/, '')}`;
	return (href) => {
		if (!href.startsWith('/')) {
			return href;
		}
		const [pathname = href] = href.split(/[#?]/);
		const rest = href.slice(pathname.length);
		if (pathname === rootPath) {
			return `${homePath}${rest}`;
		}
		if (trailingSlash === true && !pathname.endsWith('/')) {
			return `${pathname}/${rest}`;
		}
		if (trailingSlash === false && pathname.endsWith('/')) {
			return `${pathname.replace(/\/+$/, '')}${rest}`;
		}
		return href;
	};
}
