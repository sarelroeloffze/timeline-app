import type { DateValue, DateCertainty, DateFormat } from '@/lib/types';

// Month names for different languages
export const MONTH_NAMES: Record<string, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  af: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'],
  es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  fr: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jui', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
};

/**
 * Create a Date object from a year (supports BC dates)
 */
export function makeYear(year: number, month = 6, day = 1): Date {
  const d = new Date(0);
  d.setFullYear(year, month - 1, day);
  return d;
}

/**
 * Convert DateValue to Date object for vis-timeline
 */
export function dateForVis(d: DateValue | null | undefined): Date | undefined {
  if (d == null) return undefined;
  return typeof d === 'number' ? makeYear(d) : new Date(d);
}

/**
 * Convert DateValue to sortable year number
 */
export function toSortYear(d: DateValue | null | undefined): number {
  if (d == null) return 0;
  return typeof d === 'number' ? d : parseInt(String(d));
}

/**
 * Format year for ruler/axis display
 */
export function fmtRulerYear(yr: number): string {
  const y = Math.round(yr);
  if (y > 0) return y >= 1000 ? String(y) : `${y} AD`;
  return `${-y} BC`;
}

/**
 * Format date with specified format and certainty
 */
export function fmtDate(
  d: DateValue | null | undefined,
  fmt: DateFormat = 'bcad',
  certainty: DateCertainty = 'exact',
  lang: string = 'en'
): string {
  if (certainty === 'unknown') return 'Unknown';
  if (d == null) return '';

  const monthAbbr = MONTH_NAMES[lang] || MONTH_NAMES.en;
  let base: string;

  if (typeof d === 'number') {
    // Integer year (BC/AD system)
    if (fmt === 'signed') {
      base = String(d);
    } else if (d <= 0) {
      base = `${Math.abs(d)} BC`;
    } else {
      base = d < 1000 ? `${d} AD` : String(d);
    }
  } else {
    // ISO string e.g. "1867-11-07"
    const s = String(d);
    const yr = parseInt(s.slice(0, 4));

    if (fmt === 'full') {
      const mm = parseInt(s.slice(5, 7)) - 1; // 0-based
      const dd = parseInt(s.slice(8, 10));
      if (!isNaN(mm) && !isNaN(dd) && s.length >= 10) {
        base = `${dd} ${monthAbbr[mm]} ${yr}`;
      } else {
        base = String(yr);
      }
    } else {
      // 'bcad' and 'signed' → just year for ISO dates
      base = String(yr);
    }
  }

  // Apply certainty prefix/suffix
  if (certainty === 'circa') return `c. ${base}`;
  if (certainty === 'estimated') return `est. ${base}`;
  return base; // 'exact' or already handled 'unknown'
}

/**
 * Parse date string to DateValue
 * Supports: "4 BC", "33 AD", "1867-11-07", "25/12/1867", "-4", "1867"
 */
export function parseDate(s: string | number | null | undefined): DateValue | undefined {
  if (!s || !String(s).trim()) return undefined;
  const t = String(s).trim();

  // Already an ISO date string (yyyy-mm-dd…)
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t;

  // dd/mm/yyyy or dd/mm/yyyy BC or dd/mm/yyyy AD
  const dmy = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{1,4})\s*(BC|AD)?$/i);
  if (dmy) {
    const [, dd, mm, yyyy, era] = dmy;
    const yr = parseInt(yyyy);
    const signed = era && era.toUpperCase() === 'BC' ? -Math.abs(yr) : yr;

    // If it has a real day/month, store as ISO-like string
    const absYr = Math.abs(signed);
    const isoStr = `${String(absYr).padStart(4, '0')}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;

    // Return integer year for BC, full ISO for AD
    if (signed <= 0) return signed;
    return isoStr;
  }

  // "4 BC" or "4BC" → -4
  const bc = t.match(/^(\d{1,4})\s*BC$/i);
  if (bc) return -Math.abs(parseInt(bc[1]));

  // "33 AD" or "33AD" → 33
  const ad = t.match(/^(\d{1,4})\s*AD$/i);
  if (ad) return parseInt(ad[1]);

  // Plain negative integer: -4
  if (/^-\d{1,4}$/.test(t)) return parseInt(t);

  // Plain positive year: 1867
  if (/^\d{1,4}$/.test(t)) return parseInt(t);

  return undefined;
}

/**
 * Convert vis-timeline Date item back to DateValue
 */
export function dateFromVisItem(visDate: Date | string | number): DateValue {
  if (typeof visDate === 'number') return visDate;
  if (typeof visDate === 'string') return visDate;

  // It's a Date object - convert to ISO string or integer year
  const year = visDate.getFullYear();
  const month = visDate.getMonth();
  const day = visDate.getDate();

  // If it's June 1st (default from makeYear), return integer year
  if (month === 5 && day === 1) return year;

  // Otherwise return full ISO date
  return visDate.toISOString().slice(0, 10);
}

/**
 * Get current year
 */
export const THIS_YEAR = new Date().getFullYear();

/**
 * Calculate navigation waypoints from timeline data
 */
export function calcNavPoints(
  events: Array<{ date_start?: DateValue; date_end?: DateValue }>,
  people: Array<{ birth?: DateValue; death?: DateValue }>,
  maxBtns: number = 7
): Array<{ label: string; yr: number; sp: number }> {
  const toYr = (d: DateValue | null | undefined): number | null => {
    if (d == null) return null;
    if (typeof d === 'number') return d;
    const m = String(d).match(/^(-?\d+)/);
    return m ? parseInt(m[1]) : null;
  };

  const years: number[] = [];

  (events || []).forEach((e) => {
    const y1 = toYr(e.date_start);
    const y2 = toYr(e.date_end);
    if (y1 != null) years.push(y1);
    if (y2 != null) years.push(y2);
  });

  (people || []).forEach((p) => {
    const b = toYr(p.birth);
    const d = toYr(p.death);
    if (b != null) years.push(b);
    if (d != null) years.push(d);
  });

  if (years.length === 0) {
    return [
      { label: 'Today', yr: THIS_YEAR, sp: 10 },
      { label: '2000', yr: 2000, sp: 10 },
    ];
  }

  years.sort((a, b) => a - b);
  const minY = years[0];
  const maxY = years[years.length - 1];
  const span = maxY - minY;

  const nav: Array<{ label: string; yr: number; sp: number }> = [];
  const step = Math.max(1, Math.floor(span / (maxBtns - 1)));

  for (let i = 0; i < maxBtns; i++) {
    const yr = minY + i * step;
    if (yr > maxY) break;
    nav.push({ label: fmtRulerYear(yr), yr, sp: 10 });
  }

  // Always include max year
  if (nav[nav.length - 1]?.yr !== maxY) {
    nav.push({ label: fmtRulerYear(maxY), yr: maxY, sp: 10 });
  }

  return nav;
}

/**
 * Expand recurring events into individual occurrences
 */
export function expandRecurringEvents(
  events: Array<{
    id: string;
    recurrence?: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      interval: number;
      endCondition: 'never' | 'count' | 'date';
      endCount?: number;
      endDate?: DateValue;
    } | null;
    date_start: DateValue;
    [key: string]: any;
  }>
): Array<any> {
  const result: Array<any> = [];
  const MAX_OCCURRENCES = 500;

  for (const event of events) {
    if (!event.recurrence) {
      result.push(event);
      continue;
    }

    const { frequency, interval, endCondition, endCount, endDate } = event.recurrence;
    const startDate = dateForVis(event.date_start);
    if (!startDate) {
      result.push(event);
      continue;
    }

    result.push(event); // Master event

    let count = 0;
    let currentDate = new Date(startDate);

    while (count < MAX_OCCURRENCES) {
      // Advance date
      switch (frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + interval * 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + interval);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + interval);
          break;
      }

      count++;

      // Check end conditions
      if (endCondition === 'count' && endCount && count >= endCount) break;
      if (endCondition === 'date' && endDate) {
        const endDateObj = dateForVis(endDate);
        if (endDateObj && currentDate > endDateObj) break;
      }

      // Create occurrence
      result.push({
        ...event,
        id: `${event.id}_occ_${count}`,
        date_start: currentDate.toISOString().slice(0, 10),
        _isOccurrence: true,
        _masterId: event.id,
        _occurrenceNumber: count,
      });
    }
  }

  return result;
}
