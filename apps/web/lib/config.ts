/**
 * Centralized site configuration for template customization
 *
 * This file provides a single source of truth for site-wide settings.
 * Values can be overridden via environment variables in .env.local.
 */

export type {
	AppConfigSchema,
	ConfigValidationResult,
	ConfigValidationError,
	ConfigValidationWarning,
	ConfigSection,
	ConfigSectionType,
	Environment,
	CoreConfig,
	AuthConfig,
	OAuthProvider,
	EmailConfig,
	PaymentConfig,
	AnalyticsConfig,
	IntegrationsConfig,
} from './config/types';
export { isDevelopment, isProduction, isTest, getEnvironment } from './config/types';

export const siteConfig = {
	name: process.env.NEXT_PUBLIC_SITE_NAME || 'OfferMesh',
	tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE || 'Commercial Offer Infrastructure for the Agentic Web',
	url:
		process.env.NEXT_PUBLIC_APP_URL ??
		(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://offermesh.vercel.app'),
	logo: process.env.NEXT_PUBLIC_SITE_LOGO || '/favicon.ico',
	brandName: process.env.NEXT_PUBLIC_BRAND_NAME || 'OfferMesh',
	description:
		process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
		'Discover verified affiliate, referral, reseller and partner opportunities through one structured commercial offer layer.',
	keywords: process.env.NEXT_PUBLIC_SITE_KEYWORDS
		? process.env.NEXT_PUBLIC_SITE_KEYWORDS.split(',').map((k) => k.trim())
		: ['OfferMesh', 'Affiliate Programs', 'Partner Programs', 'Reseller Programs', 'Commercial Offers', 'MCP'],
	ogImage: {
		gradientStart: process.env.NEXT_PUBLIC_OG_GRADIENT_START || '#667eea',
		gradientEnd: process.env.NEXT_PUBLIC_OG_GRADIENT_END || '#764ba2'
	},
	social: {
		github: process.env.NEXT_PUBLIC_SOCIAL_GITHUB || '',
		x: process.env.NEXT_PUBLIC_SOCIAL_X || '',
		linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || '',
		facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || '',
		blog: process.env.NEXT_PUBLIC_SOCIAL_BLOG || '',
		email: process.env.NEXT_PUBLIC_SOCIAL_EMAIL || ''
	},
	attribution: {
		url: process.env.NEXT_PUBLIC_ATTRIBUTION_URL || 'https://ever.works',
		name: process.env.NEXT_PUBLIC_ATTRIBUTION_NAME || 'Ever Works'
	}
} as const;

export function validateSiteConfig() {
	const warnings: string[] = [];

	if (!process.env.NEXT_PUBLIC_APP_URL) {
		warnings.push('NEXT_PUBLIC_APP_URL not set, using the current deployment URL.');
	}
	if (!process.env.NEXT_PUBLIC_SITE_URL) {
		warnings.push('NEXT_PUBLIC_SITE_URL not set, using the current deployment URL.');
	}
	if (!process.env.NEXT_PUBLIC_SITE_NAME) {
		warnings.push('NEXT_PUBLIC_SITE_NAME not set, using "OfferMesh".');
	}

	if (warnings.length > 0) {
		console.warn('Site Configuration Warnings:');
		warnings.forEach((warning) => console.warn(`   - ${warning}`));
	}

	return warnings.length === 0;
}
