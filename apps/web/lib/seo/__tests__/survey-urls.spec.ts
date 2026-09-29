import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isSurveyOfItem, surveyCanonicalPath } from '../survey-urls';

/**
 * Survey URL helpers (lib/seo/survey-urls.ts).
 *
 * Run with: `pnpm --filter @ever-works/web test:unit`
 *
 * /items/<anything>/surveys/<slug> used to answer 200, indexable, with a self
 * canonical for ANY item string, and the same survey was also self-canonical
 * at /surveys/<slug>.
 */

const itemSurvey = { slug: 'onboarding', type: 'item', itemId: 'clockify' };
const globalSurvey = { slug: 'site-feedback', type: 'global', itemId: null };

describe('surveyCanonicalPath', () => {
	it('publishes an item survey under its own item', () => {
		assert.equal(surveyCanonicalPath(itemSurvey), '/items/clockify/surveys/onboarding');
	});

	it('publishes a global survey under /surveys', () => {
		assert.equal(surveyCanonicalPath(globalSurvey), '/surveys/site-feedback');
	});

	it('falls back to /surveys for an item survey with no item', () => {
		assert.equal(surveyCanonicalPath({ slug: 'orphan', type: 'item', itemId: '' }), '/surveys/orphan');
		assert.equal(surveyCanonicalPath({ slug: 'orphan', type: 'item' }), '/surveys/orphan');
	});

	it('encodes the path segments', () => {
		assert.equal(surveyCanonicalPath({ slug: 'a b', type: 'item', itemId: 'x/y' }), '/items/x%2Fy/surveys/a%20b');
	});
});

describe('isSurveyOfItem', () => {
	it('accepts the owning item only', () => {
		assert.equal(isSurveyOfItem(itemSurvey, 'clockify'), true);
		assert.equal(isSurveyOfItem(itemSurvey, 'jibble'), false);
		assert.equal(isSurveyOfItem(itemSurvey, 'anything'), false);
	});

	it('accepts an encoded segment of the owning item', () => {
		assert.equal(isSurveyOfItem({ slug: 's', type: 'item', itemId: 'my tool' }, 'my%20tool'), true);
	});

	it('never serves a global survey under an item', () => {
		assert.equal(isSurveyOfItem(globalSurvey, 'clockify'), false);
		assert.equal(isSurveyOfItem({ slug: 's', type: 'global', itemId: 'clockify' }, 'clockify'), false);
	});

	it('survives a malformed segment', () => {
		assert.equal(isSurveyOfItem(itemSurvey, '%E0%A4%A'), false);
	});
});
