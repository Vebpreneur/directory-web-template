/*
 * Wraps @docusaurus/theme-classic's DocBreadcrumbs/StructuredData, the BreadcrumbList JSON-LD on
 * every doc page. Upstream builds each "item" as siteConfig.url + the sidebar href, and sidebar
 * hrefs never carry the trailing slash that `trailingSlash: true` gives every served URL, so the
 * items named /payment/stripe - which the nginx serving the build answers with a 301 to
 * /payment/stripe/ - instead of the page, and the root doc named the site root, which the
 * docs.demo.ever.works ingress answers with a 302. The wrapper hands upstream the hrefs the
 * deployment serves (src/utils/servedUrl: trailing slash applied the way <Link> applies it, the
 * site root mapped to customFields.homeCanonicalPath) and changes nothing else. A build with no
 * canonical origin (no DOCS_URL, noindex) has no host to name, so it emits no BreadcrumbList.
 */
/// <reference types="@docusaurus/theme-classic" />
import React, { type ReactNode } from 'react';
import StructuredData from '@theme-original/DocBreadcrumbs/StructuredData';
import type StructuredDataType from '@theme/DocBreadcrumbs/StructuredData';
import type { WrapperProps } from '@docusaurus/types';
import { useHasCanonicalOrigin, useServedHref } from '../../../utils/servedUrl';

type Props = WrapperProps<typeof StructuredDataType>;

export default function StructuredDataWrapper(props: Props): ReactNode {
	const hasCanonicalOrigin = useHasCanonicalOrigin();
	const servedHref = useServedHref();
	if (!hasCanonicalOrigin) {
		return null;
	}
	const breadcrumbs = props.breadcrumbs.map((breadcrumb) =>
		breadcrumb.href ? { ...breadcrumb, href: servedHref(breadcrumb.href) } : breadcrumb
	);
	return <StructuredData {...props} breadcrumbs={breadcrumbs} />;
}
