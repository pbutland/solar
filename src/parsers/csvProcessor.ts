import { OriginCsvParser } from './OriginCsvParser';
import { NEM12CsvParser } from './NEM12CsvParser';
import { JemenaCsvParser } from './JemenaCsvParser';
import { PowerpalCsvParser } from './PowerpalCsvParser';
import type { EnergyData, EnergyPeriodEntry } from '../types/index.js';
import { parseISO } from 'date-fns';

export interface EnergyCsvParser {
  isValid: (data: any[] | string[][]) => boolean;
  parse(data: any[] | string[][], periodInMinutes?: number): EnergyData;
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
    return { ...entry, date: updatedDate.toISOString() };
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