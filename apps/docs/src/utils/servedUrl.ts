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
 *
 * The 404 page is not a page crawlers should be pointed at either: it is only ever served as the
 * body of a 404 response (nginx marks /404.html internal), and with trailingSlash its upstream
 * canonical, og:url and hreflang named /404.html/, which answers 404. It emits none of them.
 */
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useLocation } from '@docusaurus/router';

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

// True while rendering the 404 page (404.html under the current locale's baseUrl).
export function useIsNotFoundPage(): boolean {
	const {
		siteConfig: { baseUrl }
	} = useDocusaurusContext();
	const { pathname } = useLocation();
	return pathname.replace(/\/+$/, '') === `${baseUrl}404.html`;
}

// True while rendering one of the pages docusaurus.config.ts lists as not documentation
// (customFields.noIndexPaths, paths relative to the current locale's baseUrl).
export function useIsNoIndexPage(): boolean {
	const {
		siteConfig: { baseUrl, customFields }
	} = useDocusaurusContext();
	const { pathname } = useLocation();
	const noIndexPaths = Array.isArray(customFields?.noIndexPaths) ? (customFields.noIndexPaths as unknown[]) : [];
	const current = `${pathname.replace(/\/+$/, '')}/`;
	return noIndexPaths.some(
		(noIndexPath) => typeof noIndexPath === 'string' && current === `${baseUrl}${noIndexPath.replace(/^\/+/, '')}`
	);
}

// The site-relative path of the home page as the deployment serves it: the current locale's
// root, or - when the deployment redirects its root - the page it redirects to.
export function useHomePath(): string {
	const {
		siteConfig: { baseUrl, customFields }
	} = useDocusaurusContext();
	return `${baseUrl}${homeCanonicalPathOf(customFields).replace(/^\/+/, '')}`;
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
