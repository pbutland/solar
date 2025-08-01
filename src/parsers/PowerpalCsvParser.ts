import type { EnergyCsvParser } from './csvProcessor';
import type { EnergyData } from '../types/index.js';
import { aggregateToInterval, filterLastYearOfData, padMissingDates } from './csvProcessor';

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

  parse(data: any[] | string[][], periodInMinutes: number = 30): EnergyData {
    const csvRows = data as { [key: string]: string }[];

    // Aggregate by block of periodInMinutes
    const blockMillis = periodInMinutes * 60 * 1000;
    const blockSums: { [blockStart: string]: number } = {};

    for (const row of csvRows) {
      const dateStr = row['datetime_utc'];
      const wh = parseFloat(row['watt_hours']);
      if (!dateStr || isNaN(wh)) continue;
      const date = new Date(dateStr.replace(' ', 'T'));
      if (isNaN(date.getTime())) continue;
      const millis = date.getTime();
      const blockStartMillis = millis - (millis % blockMillis);
      const blockDate = new Date(blockStartMillis).toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:mm'
      if (!blockSums[blockDate]) blockSums[blockDate] = 0;
      blockSums[blockDate] += wh;
    }

    const rawValues = Object.entries(blockSums)
      .map(([date, whSum]) => ({ date, value: whSum / 1000 })) // kWh
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const processedData = aggregateToInterval(rawValues, periodInMinutes);
    const filteredData = filterLastYearOfData(processedData);
    const paddedData = padMissingDates(filteredData, periodInMinutes);

    return {
      periodInMinutes,
      values: paddedData
    };
  }
}
