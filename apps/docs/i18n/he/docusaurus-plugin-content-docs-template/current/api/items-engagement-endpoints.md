---
id: items-engagement-endpoints
title: "Items Engagement API Reference"
sidebar_label: "עיסוק בפריטים"
sidebar_position: 54
---

# Items Engagement API Reference

## סקירה כללית

נקודות הקצה של Items Engagement מספקות גישה למדדי מעורבות וציוני פופולריות עבור פריטי ספרייה. אלה כוללים ספירת צפיות, הצבעות, דירוגים, מועדפים והערות. נקודת הסיום של ציוני הפופולריות מחשבת בנוסף דירוג משוקלל שקובע מדדי מעורבות, סטטוס מוצג ועדכניות התוכן.

## נקודות קצה

### GET /api/items/engagement

מביא מדדי מעורבות עבור פריטים מרובים לפי הקלעים שלהם בבקשת אצווה אחת.

**בקשה**

|פרמטר|הקלד|ב|תיאור|
|-----------|--------|-------|-------------|
|שבלולים|מחרוזת|שאילתה|רשימה מופרדת בפסיקים של שבלולים (חובה, מקסימום 200)|

**תגובה**
```typescript
{
  metrics: Record<string, {
    views: number;
    votes: number;
    avgRating: number;
    favorites: number;
    comments: number;
  }>;
}
```

**דוגמה**
```typescript
const response = await fetch('/api/items/engagement?slugs=item-one,item-two,item-three');
const { metrics } = await response.json();

// metrics["item-one"] = { views: 1500, votes: 42, avgRating: 4.2, favorites: 18, comments: 7 }
```

### קבל /api/items/ציוני פופולריות

ניפוי נקודת קצה שמחזירה פריטים ממוינים לפי ציון פופולריות מחושב עם פירוט מפורט של גורמי הניקוד. שימושי להבנת האופן שבו אלגוריתם המיון מדרג פריטים.

**בקשה**

|פרמטר|הקלד|ב|תיאור|
|-----------|--------|-------|-------------|
|הגבלה|מספר|שאילתה|מספר פריטים להחזרה (ברירת מחדל: 20, מקסימום: 100)|
|מקומי|מחרוזת|שאילתה|קוד שפה לפריטים (ברירת מחדל: "he")|

**תגובה**
```typescript
{
  totalItems: number;
  showing: number;
  items: Array<{
    rank: number;
    name: string;
    slug: string;
    featured: boolean;
    score: number;               // Total computed score (rounded)
    scoreBreakdown: {
      featured: number;          // 10000 if featured, 0 otherwise
      views: number;             // log10(views + 1) * 1000
      votes: number;             // log10(votes + 1) * 1200
      rating: number;            // avgRating * 500
      favorites: number;         // log10(favorites + 1) * 1100
      comments: number;          // log10(comments + 1) * 1000
      recency: number;           // Decays over 180 days
    };
    engagement: {
      views: number;
      votes: number;
      avgRating: number;
      favorites: number;
      comments: number;
    } | null;
    ageInDays: number;
  }>;
}
```

**דוגמה**
```typescript
const response = await fetch('/api/items/popularity-scores?limit=10&locale=en');
const { items, totalItems } = await response.json();

// items[0] = { rank: 1, name: "Top Item", score: 15234, scoreBreakdown: { ... }, ... }
```

## אימות

שתי נקודות הקצה הן **ציבוריות** -- אין צורך באימות. הם מסומנים כ-`force-dynamic` כדי להבטיח נתונים עדכניים על כל בקשה.

## תגובות שגיאה

|סטטוס|תיאור|
|--------|-------------|
| 400 |חסר פרמטר נדרש `slugs` או יותר מ-200 שבלולים מסופק (נקודת קצה של מעורבות)|
| 500 |שגיאת שרת פנימית -- כשל בשאילתת מסד הנתונים|

## הגבלת תעריפים

אין הגבלת תעריפים מפורשת. נקודת הקצה של המעורבות מגבילה את גודל האצווה ל-200 שבלולים לכל בקשה כדי למנוע שימוש לרעה. שתי נקודות הקצה עוקפות את מטמון Next.js באמצעות `export const dynamic = 'force-dynamic'`.

## נקודות קצה קשורות

- [Config Feature Endpoints](./config-feature-endpoints.md) -- בדוק אם תכונות הדירוג/מועדפים/הערות מופעלות
