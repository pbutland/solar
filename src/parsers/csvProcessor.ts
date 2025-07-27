import { OriginCsvParser } from './OriginCsvParser';
import { NEM12CsvParser } from './NEM12CsvParser';
import { JemenaCsvParser } from './JemenaCsvParser';
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
