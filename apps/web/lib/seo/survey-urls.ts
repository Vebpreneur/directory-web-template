/**
 * The one public URL of a survey.
 *
 * A survey is reachable on two routes: `/surveys/<slug>` serves any survey by
 * its slug, and `/items/<item>/surveys/<slug>` served it under ANY item string.
 * Each declared itself canonical, so one survey had an unbounded set of
 * self-canonical URLs. An item survey belongs to one item (`itemId` holds that
 * item's slug, see components/surveys/user-survey-section.tsx), so it is
 * published under that item; every other survey under `/surveys`.
 */

/** The survey fields that decide where it is published. */
export interface SurveyLocation {
	slug: string;
	/** `'global'` or `'item'` (lib/types/survey.ts SurveyTypeEnum). */
	type: string;
	/** For an item survey, the slug of the item it belongs to. */
	itemId?: string | null;
}

function isItemSurvey(survey: SurveyLocation): survey is SurveyLocation & { itemId: string } {
	return survey.type === 'item' && typeof survey.itemId === 'string' && survey.itemId.length > 0;
}

/** Locale-less canonical path of a survey. */
export function surveyCanonicalPath(survey: SurveyLocation): string {
	const slug = encodeURIComponent(survey.slug);
	if (isItemSurvey(survey)) {
		return `/items/${encodeURIComponent(survey.itemId)}/surveys/${slug}`;
	}
	return `/surveys/${slug}`;
}

function safeDecode(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

/**
 * Whether `/items/<itemSlug>/surveys/<survey.slug>` is a real URL of the
 * survey: it must be an item survey that belongs to that very item.
 * `itemSlug` is the route segment, encoded or not.
 */
export function isSurveyOfItem(survey: SurveyLocation, itemSlug: string): boolean {
	if (!isItemSurvey(survey)) return false;
	return survey.itemId === itemSlug || survey.itemId === safeDecode(itemSlug);
}
