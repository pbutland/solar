import type { EnergyData, EnergyPeriodEntry } from '../types/index.js';
import { parseISO } from 'date-fns';
import { toZonedTime, format } from 'date-fns-tz';

/**
 * Filters CsvRow[] to only include rows within the last year from the latest 'To (date/time)' value.
 * @param data Array of CsvRow
 * @returns Filtered array of CsvRow
 */
function filterLastYearOfData(data: EnergyPeriodEntry[]): EnergyPeriodEntry[] {
  if (!data.length) return [];
  // Find the latest date value
  const maxDate = data.reduce<Date | undefined>((max, row) => {
    const d = row.date ? parseISO(row.date) : undefined;
    return d && !isNaN(d.getTime()) && (!max || d > max) ? d : max;
  }, undefined);
  if (!maxDate) return [];

  const cutoff = new Date(maxDate.getTime() - 365 * 24 * 60 * 60 * 1000);
  const filtered = data.filter(row => {
    if (!row.date) return false;
    const d = parseISO(row.date);
    return !isNaN(d.getTime()) && d > cutoff && d <= (maxDate as Date);
  });

  // Set the year to current year and sort
  const currentYear = new Date().getFullYear();
  const rearranged = filtered.map(entry => {
    const d = entry.date ? parseISO(entry.date) : undefined;
    if (!d || isNaN(d.getTime())) return entry;
    if (d.getFullYear() === currentYear) return entry;
    // Update only the year
    const updatedDate = new Date(d);
    updatedDate.setFullYear(currentYear);
    // Preserve time, month, day, timezone
    return { ...entry, date: updatedDate.toISOString() };
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return rearranged;
}

interface CsvRow {
  'Usage Type': string;
  'Amount Used': string;
  'From (date/time)': string;
  'To (date/time)': string;
  [key: string]: string;
}

export const processCsvData = (
  data: CsvRow[],
  periodInMinutes: number = 30
): EnergyData => {
  const blockConsumption: { [key: string]: number } = {};

  data.forEach((row) => {
    const usageType = row['Usage Type'];
    const amountUsedStr = row['Amount Used'];
    const fromTime = row['From (date/time)'];
    const toTime = row['To (date/time)'];

    // Only process consumption entries
    if (
      usageType !== 'Consumption' ||
      !fromTime ||
      !toTime ||
      !amountUsedStr
    ) {
      return;
    }

    const consumption = parseFloat(amountUsedStr);
    if (isNaN(consumption)) {
      return;
    }

    try {
      // Use timezone from input if present, otherwise treat as local
      let startDate: Date;
      let endDate: Date;
      let tz: string | undefined;

      // If input contains timezone offset (e.g. +10:00 or Z), parseISO will handle it
      // Otherwise, treat as local
      if (/([Zz]|[+-]\d{2}:?\d{2})$/.test(fromTime)) {
        startDate = parseISO(fromTime);
        endDate = parseISO(toTime);
        tz = undefined;
      } else {
        tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        startDate = parseISO(fromTime);
        endDate = parseISO(toTime);
      }

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return;
      }

      // Calculate block boundaries
      const blockMillis = periodInMinutes * 60 * 1000;
      const startMillis = startDate.getTime();
      const endMillis = endDate.getTime();
      const firstBlockMillis = startMillis - (startMillis % blockMillis);
      const lastBlockMillis = endMillis - (endMillis % blockMillis);

      const blockCount = Math.floor((lastBlockMillis - firstBlockMillis) / blockMillis) + 1;
      if (blockCount <= 0) {
        return;
      }
      const consumptionPerBlock = consumption / blockCount;

      for (let i = 0; i < blockCount; i++) {
        const blockStartMillis = firstBlockMillis + i * blockMillis;
        let blockStartDate: Date;
        if (tz) {
          blockStartDate = toZonedTime(new Date(blockStartMillis), tz);
        } else {
          blockStartDate = new Date(blockStartMillis);
        }
        // Format as 'YYYY-MM-DDTHH:mm' in local or input timezone
        const dateKey = format(blockStartDate, "yyyy-MM-dd'T'HH:mm", { timeZone: tz || 'UTC' });
        if (blockConsumption[dateKey]) {
          blockConsumption[dateKey] += consumptionPerBlock;
        } else {
          blockConsumption[dateKey] = consumptionPerBlock;
        }
      }
    } catch (error) {
      console.error('Error parsing date:', fromTime, toTime, error);
    }
  });

  // Convert to array format matching energy-usage.json structure
  const entries = Object.entries(blockConsumption)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const lastYear = filterLastYearOfData(entries);

  return {
    periodInMinutes,
    values: lastYear
  };
};
