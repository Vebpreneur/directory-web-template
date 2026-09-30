import { NextRequest, NextResponse } from 'next/server';
import { fetchItems } from '@/lib/content';
import type { OfferMetadata } from '@/lib/types/item';

export const runtime = 'nodejs';

function categoryNames(category: unknown): string[] {
  const values = Array.isArray(category) ? category : [category];
  return values
    .map((value) => {
      if (typeof value === 'string') return value;
      if (value && typeof value === 'object' && 'name' in value) return String(value.name);
      return '';
    })
    .filter(Boolean);
}

function tagNames(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((value) => {
      if (typeof value === 'string') return value;
      if (value && typeof value === 'object' && 'name' in value) return String(value.name);
      return '';
    })
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q')?.trim().toLowerCase();
  const category = searchParams.get('category')?.trim().toLowerCase();
  const type = searchParams.get('type')?.trim().toLowerCase();
  const network = searchParams.get('network')?.trim().toLowerCase();
  const market = searchParams.get('market')?.trim().toLowerCase();

  const { items } = await fetchItems({ lang: 'en' });

  const offers = items
    .filter((item) => Boolean(item.offer))
    .map((item) => {
      const offer = item.offer as OfferMetadata;
      return {
        id: item.slug,
        name: item.name,
        description: item.description,
        url: item.source_url,
        categories: categoryNames(item.category),
        tags: tagNames(item.tags),
        featured: Boolean(item.featured),
        provider: offer.provider,
        offer_type: offer.type,
        network: offer.network ?? null,
        commission: offer.commission ?? null,
        recurring: offer.recurring ?? false,
        cookie_days: offer.cookie_days ?? null,
        markets: offer.markets ?? [],
        apply_url: offer.apply_url ?? item.source_url,
        tracking_url: offer.tracking_url ?? null,
        api_available: offer.api_available ?? false,
        mcp_available: offer.mcp_available ?? false,
        verified_at: offer.verified_at ?? null,
        source: offer.source ?? item.source_url,
        updated_at: item.updated_at,
      };
    })
    .filter((offer) => {
      if (q) {
        const haystack = [
          offer.name,
          offer.description,
          offer.provider,
          offer.network ?? '',
          offer.offer_type,
          ...offer.categories,
          ...offer.tags,
          ...offer.markets,
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (category && !offer.categories.some((value) => value.toLowerCase() === category)) return false;
      if (type && offer.offer_type.toLowerCase() !== type) return false;
      if (network && (offer.network ?? '').toLowerCase() !== network) return false;
      if (market && !offer.markets.some((value) => value.toLowerCase() === market)) return false;
      return true;
    });

  return NextResponse.json({
    data: offers,
    meta: {
      total: offers.length,
      filters: { q: q ?? null, category: category ?? null, type: type ?? null, network: network ?? null, market: market ?? null },
      generated_at: new Date().toISOString(),
    },
  });
}
