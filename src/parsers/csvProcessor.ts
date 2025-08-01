import { OriginCsvParser } from './OriginCsvParser';
import { NEM12CsvParser } from './NEM12CsvParser';
import { JemenaCsvParser } from './JemenaCsvParser';
import { PowerpalCsvParser } from './PowerpalCsvParser';
import type { EnergyData, EnergyPeriodEntry } from '../types/index.js';
import { parseISO } from 'date-fns';
import { format } from 'date-fns-tz';


export interface EnergyCsvParser {
  isValid: (data: any[] | string[][]) => boolean;
  parse(data: any[] | string[][], periodInMinutes?: number): Promise<EnergyData>;
}

const parsers = [
  new OriginCsvParser(),
  new NEM12CsvParser(),
  new JemenaCsvParser(),
  new PowerpalCsvParser(),
];

/**
 * Factory function to select the appropriate CSV parser based on the data.
 * @param data The parsed CSV as string[][]
 * @returns An instance of EnergyCsvParser
 * @throws Error if no suitable parser is found
 */
export function getEnergyCsvParser(data: any[] | string[][]): EnergyCsvParser {
  const parser = parsers.find(parser => parser.isValid(data));
  if (parser) {
    return parser;
  }

  throw new Error('No suitable CSV parser found for the provided data format.');
}

/**
 * Filters CsvRow[] to only include rows within the last year from the latest 'To (date/time)' value.
 * @param data Array of CsvRow
 * @returns Filtered array of CsvRow
 */
export function filterLastYearOfData(data: EnergyPeriodEntry[]): EnergyPeriodEntry[] {
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
    const dateKey = format(updatedDate, "yyyy-MM-dd'T'HH:mm", { timeZone: 'UTC' });
    return { ...entry, date: dateKey };
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return rearranged;
}

/**
 * Aggregates or splits an array of EnergyPeriodEntry to the specified periodInMinutes.
 * If periodInMinutes is greater than the raw interval, values are summed into larger blocks.
 * If periodInMinutes is less than the raw interval, values are distributed evenly across smaller blocks.
 * Assumes no gaps in the data.
 */
export function aggregateToInterval(
  entries: EnergyPeriodEntry[],
  periodInMinutes: number
): EnergyPeriodEntry[] {
  if (!entries.length) return [];
  // Sort entries by date ascending
  const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  // Determine raw interval in ms
  const getMs = (d: string) => new Date(d).getTime();
  const rawIntervalMs = sorted.length > 1 ? getMs(sorted[1].date) - getMs(sorted[0].date) : periodInMinutes * 60 * 1000;
  const targetIntervalMs = periodInMinutes * 60 * 1000;

  if (rawIntervalMs === targetIntervalMs) {
    // No change needed
    return sorted;
  } else if (rawIntervalMs < targetIntervalMs) {
    // Aggregate up: sum values into targetIntervalMs blocks
    const result: EnergyPeriodEntry[] = [];
    let blockStart = getMs(sorted[0].date) - (getMs(sorted[0].date) % targetIntervalMs);
    let blockSum = 0;
    let blockCount = 0;
    for (const entry of sorted) {
      const entryMs = getMs(entry.date);
      const entryBlockStart = entryMs - (entryMs % targetIntervalMs);
      if (entryBlockStart !== blockStart && blockCount > 0) {
        result.push({
          date: new Date(blockStart).toISOString().slice(0, 16),
          value: blockSum,
        });
        blockStart = entryBlockStart;
        blockSum = 0;
        blockCount = 0;
      }
      blockSum += entry.value;
      blockCount++;
    }
    // Push last block
    if (blockCount > 0) {
      result.push({
        date: new Date(blockStart).toISOString().slice(0, 16),
        value: blockSum,
      });
    }
    return result;
  } else {
    // Split down: distribute value evenly across smaller intervals
    const result: EnergyPeriodEntry[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      const entryMs = getMs(entry.date);
      const nextMs = i + 1 < sorted.length ? getMs(sorted[i + 1].date) : entryMs + rawIntervalMs;
      const nBlocks = Math.round((nextMs - entryMs) / targetIntervalMs);
      const valuePerBlock = entry.value / nBlocks;
      for (let b = 0; b < nBlocks; b++) {
        const blockDate = new Date(entryMs + b * targetIntervalMs).toISOString().slice(0, 16);
        result.push({ date: blockDate, value: valuePerBlock });
      }
    }
    return result;
  }
}

// Helper: calculate ratio
function calculateRatio(data: EnergyPeriodEntry[], avgLookup: Record<string, number>): number {
  let sumData = 0;
  let sumAvg = 0;
  for (const entry of data) {
    sumData += entry.value;
    const key = entry.date.slice(5, 16); // MM-DDTHH:mm
    if (avgLookup[key] !== undefined) {
      sumAvg += avgLookup[key];
    }
  }
  // Avoid division by zero
  return sumAvg !== 0 ? sumData / sumAvg : 1;
}

/**
 * Pads missing dates in the data array, imputing missing values using the provided avgMap and a calculated ratio.
 * This function is synchronous; avgMap must be prepared in advance (e.g., using fetchAndParseAverageData).
 * @param data Array of EnergyPeriodEntry (may have missing intervals)
 * @param periodInMinutes Interval size in minutes
 * @param avgMap Map of ISO date string to average value (from average-vic-nem12.csv)
 * @returns Array of EnergyPeriodEntry with all intervals filled
 */
export function padMissingDates(
  data: EnergyPeriodEntry[],
  periodInMinutes: number,
  avgMap: Record<string, number>
): EnergyPeriodEntry[] {
  if (!data.length) return [];
  const startDate = new Date(data[0].date);
  const endDate = new Date(data[data.length - 1].date);
  const blockMillis = periodInMinutes * 60 * 1000;

  // Fast check: if data already has all intervals, return data as-is
  const expectedCount = Math.floor((endDate.getTime() - startDate.getTime()) / blockMillis) + 1;
  if (data.length === expectedCount) {
    return data;
  }

  const filledData: EnergyPeriodEntry[] = [];
  // Build avgLookup: key is MM-DDTHH:mm, value is avg value (first found for that slot)
  const avgLookup: Record<string, number> = {};
  for (const [iso, val] of Object.entries(avgMap)) {
    const key = iso.slice(5, 16); // MM-DDTHH:mm
    if (avgLookup[key] === undefined) {
      avgLookup[key] = val;
    }
  }

  const ratio = calculateRatio(data, avgLookup);

  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = format(currentDate, "yyyy-MM-dd'T'HH:mm", { timeZone: 'UTC' });
    const existingEntry = data.find(entry => entry.date === dateKey);
    let value: number;
    if (existingEntry) {
      value = existingEntry.value;
    } else {
      // Impute using average data for this interval, scaled by ratio
      const lookupKey = dateKey.slice(5, 16); // MM-DDTHH:mm
      value = avgLookup[lookupKey] !== undefined ? avgLookup[lookupKey] * ratio : 0;
    }
    filledData.push({
      date: dateKey,
      value,
    });
    currentDate.setTime(currentDate.getTime() + blockMillis);
  }

  return filledData;
}

// Browser-compatible helper to fetch and parse average-vic-nem12.csv
export function fetchAndParseAverageData(periodInMinutes: number, csvUrl = `${import.meta.env.BASE_URL}average-vic-nem12.csv`): Promise<Record<string, number>> {
  return fetch(csvUrl)
    .then(response => response.text())
    .then(content => {
      const avgMap: Record<string, number> = {};
      const lines = content.split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        const [interval, yyyymmdd, ...values] = line.split(',');
        if (!interval || !yyyymmdd || values.length === 0) continue;
        const year = yyyymmdd.slice(0, 4);
        const month = yyyymmdd.slice(4, 6);
        const day = yyyymmdd.slice(6, 8);
        const dateBase = `${year}-${month}-${day}`;
        const intervalsPerDay = 24 * 60 / periodInMinutes;
        for (let i = 0; i < intervalsPerDay; i++) {
          const minutes = i * periodInMinutes;
          const hour = Math.floor(minutes / 60).toString().padStart(2, '0');
          const min = (minutes % 60).toString().padStart(2, '0');
          const iso = `${dateBase}T${hour}:${min}`;
          const val = parseFloat(values[i]);
          if (!isNaN(val)) {
            avgMap[iso] = val;
          }
        }
      }
      return avgMap;
    });
}