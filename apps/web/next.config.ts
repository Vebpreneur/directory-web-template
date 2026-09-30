import * as path from 'path';
import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';
import { sentryWebpackPluginOptions } from './sentry.config';
import { generateImageRemotePatterns } from './lib/utils/image-domains';
import { DEFAULT_LOCALE, LOCALES } from './lib/i18n/locales';
const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
	turbopack: {
		root: path.join(__dirname, '../..')
	},
	// Ensure bundled Git-CMS fallback data is present inside Vercel serverless
	// functions. The runtime hydrates /tmp/.content from one of these folders.
	outputFileTracingIncludes: {
		'/*': ['./demo-content/**/*', './.content/**/*']
	},
	// `standalone` produces a self-contained server bundle for Docker/k8s targets
	// (the project Dockerfile sets `STANDALONE_BUILD=true`). Vercel uses its own
	// serverless packaging and does not need `standalone`; leaving it on there
	// inflates the build with no benefit. See Spec 019.
	output: process.env.STANDALONE_BUILD === 'true' ? 'standalone' : undefined,
	outputFileTracingRoot: path.join(__dirname, '../..'),
	serverExternalPackages: ['postgres', 'bcryptjs', 'drizzle-orm'],
	experimental: {
		optimizePackageImports: ['@heroui/react', 'lucide-react']
	},
	trailingSlash: false,
	generateEtags: false,
	poweredByHeader: false,
	staticPageGenerationTimeout: 180,
	webpack: (config, { dev, isServer }) => {
		config.ignoreWarnings = [
			{ module: /@supabase\/realtime-js/ },
			{ module: /@supabase\/supabase-js/ },
			{ module: /bcryptjs/ },
			{ message: /bcryptjs/ },
			{ module: /postgres/ },
			{ message: /postgres/ },
			{ module: /stripe/ },
			{ message: /stripe/ }
		];

		if (process.env.CI || process.env.VERCEL) {
			config.infrastructureLogging = { level: 'error' };
		}

		if (dev) {
			config.watchOptions = {
				...config.watchOptions,
				ignored: ['**/node_modules/**', '**/.git/**', '**/.content/**']
			};
		}

		return config;
	},
	images: {
		remotePatterns: generateImageRemotePatterns(),
		dangerouslyAllowSVG: true,
		contentDispositionType: 'attachment',
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
		unoptimized: false
	},
	async rewrites() {
		const localeGroup = LOCALES.join('|');
		const mdMirrors = [
			{ source: `/:locale(${localeGroup})/items/:slug.md`, destination: '/:locale/items/:slug/md' },
			{ source: '/items/:slug.md', destination: `/${DEFAULT_LOCALE}/items/:slug/md` },
			{ source: `/:locale(${localeGroup})/categories/:category.md`, destination: '/:locale/categories/:category/md' },
			{ source: '/categories/:category.md', destination: `/${DEFAULT_LOCALE}/categories/:category/md` },
			{ source: `/:locale(${localeGroup})/tags/:tag.md`, destination: '/:locale/tags/:tag/md' },
			{ source: '/tags/:tag.md', destination: `/${DEFAULT_LOCALE}/tags/:tag/md` },
			{ source: `/:locale(${localeGroup})/collections/:slug.md`, destination: '/:locale/collections/:slug/md' },
			{ source: '/collections/:slug.md', destination: `/${DEFAULT_LOCALE}/collections/:slug/md` },
			{ source: `/:locale(${localeGroup})/comparisons/:slug.md`, destination: '/:locale/comparisons/:slug/md' },
			{ source: '/comparisons/:slug.md', destination: `/${DEFAULT_LOCALE}/comparisons/:slug/md` },
			{ source: `/:locale(${localeGroup})/pages/:slug.md`, destination: '/:locale/pages/:slug/md' },
			{ source: '/pages/:slug.md', destination: `/${DEFAULT_LOCALE}/pages/:slug/md` },
			{ source: `/:locale(${localeGroup})/:staticSlug(about|help|pricing|privacy-policy|terms-of-service|cookies|faq).md`, destination: '/:locale/static-md/:staticSlug' },
			{ source: '/:staticSlug(about|help|pricing|privacy-policy|terms-of-service|cookies|faq).md', destination: `/${DEFAULT_LOCALE}/static-md/:staticSlug` }
		];

		return [
			...mdMirrors,
			{ source: '/:path', destination: '/:path/discover/1' },
			{ source: '/:path/discover', destination: '/:path/discover/1' }
		];
	},
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'X-Frame-Options', value: 'DENY' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					{ key: 'X-DNS-Prefetch-Control', value: 'on' },
					{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
					{
						key: 'Content-Security-Policy',
						value: `default-src 'self'; script-src 'self' ${isDev ? "'unsafe-eval'" : ''} 'unsafe-inline' https://assets.lemonsqueezy.com https://js.stripe.com https://www.googletagmanager.com https://plausible.io https://cdn.datafast.io https://datafa.st https://t.jitsu.com https://*.d.jitsu.com https://cdn.segment.com https://us.i.posthog.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: https://www.google-analytics.com https://stats.g.doubleclick.net; font-src 'self'; connect-src 'self' https: https://www.google-analytics.com https://stats.g.doubleclick.net https://plausible.io https://datafa.st https://t.jitsu.com https://*.d.jitsu.com https://api.segment.io https://us.i.posthog.com https://*.i.posthog.com; frame-src 'self' https://assets.lemonsqueezy.com https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'none';`
							.replace(/\s+/g, ' ')
							.trim()
					}
				]
			},
			{
				source: '/api/reference',
				headers: [
					{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },
					{
						key: 'Content-Security-Policy',
						value: `default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com; connect-src 'self' https:; worker-src 'self' blob:; frame-ancestors 'self';`
							.replace(/\s+/g, ' ')
							.trim()
					}
				]
			}
		];
	}
} satisfies NextConfig;

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
const configWithIntl = withNextIntl(nextConfig);
const finalConfig = withSentryConfig(configWithIntl, sentryWebpackPluginOptions) as NextConfig;

export default finalConfig;
