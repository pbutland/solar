import type { EnergyCsvParser } from './csvProcessor';
import type { EnergyData, EnergyPeriodEntry } from '../types/index.js';
import { aggregateToInterval, fetchAndParseAverageData, filterLastYearOfData, padMissingDates } from './csvProcessor';

/**
 * Powerpal CSV parser implementation
 * Handles files with columns: datetime_utc, datetime_local, watt_hours, cost_dollars, is_peak
 */
export class PowerpalCsvParser implements EnergyCsvParser {
  isValid(data: any[] | string[][]): boolean {
    // Accepts array-of-objects with Powerpal keys, or array-of-arrays with correct header
    if (Array.isArray(data) && data.length > 0) {
      if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
        return 'datetime_utc' in data[0] && 'watt_hours' in data[0];
      }
    }
    return false;
  }

  async parse(data: any[] | string[][], periodInMinutes: number = 30): Promise<EnergyData> {
    const csvRows = data as { [key: string]: string }[];

    // Build flat array of entries
    const entries: EnergyPeriodEntry[] = [];
    for (const row of csvRows) {
      const dateStr = row['datetime_utc'];
      const wh = parseFloat(row['watt_hours']);
      if (!dateStr || isNaN(wh)) continue;
      const date = new Date(dateStr.replace(' ', 'T'));
      if (isNaN(date.getTime())) continue;
      // Use ISO string to minute precision for interval aggregation
      const dateTime = date.toISOString().slice(0, 16);
      entries.push({ date: dateTime, value: wh / 1000, usageType: 'general' });
    }

    // Sort entries by date (optional, for consistency)
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const processedData = aggregateToInterval(entries, periodInMinutes);
    const filteredData = filterLastYearOfData(processedData);
    const averageData = await fetchAndParseAverageData(periodInMinutes);
    const paddedData = padMissingDates(filteredData, periodInMinutes, averageData);

    return {
      periodInMinutes,
      values: paddedData
    };
  }
}
