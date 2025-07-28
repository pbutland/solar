import type { EnergyCsvParser } from './csvProcessor';
import type { EnergyData } from '../types/index.js';
import { aggregateToInterval, filterLastYearOfData } from './csvProcessor';

// Jemena CSV parser implementation
export class JemenaCsvParser implements EnergyCsvParser {
  isValid(data: any[] | string[][]): boolean {
    // Check if data is array-of-objects with expected keys
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && !Array.isArray(data[0])) {
      return 'NMI' in data[0] && 'CON/GEN' in data[0];
    }
    return false;
  }

  parse(data: any[] | string[][], periodInMinutes: number = 30): EnergyData {
    const csvRows = data as { [key: string]: string }[];
    const keys = Object.keys(csvRows[0]);
    const intervalColumns = keys.filter(k => /\d{2}:\d{2} - \d{2}:\d{2}/.test(k));

    // Aggregate values by date and interval
    const aggregate: { [dateTime: string]: number } = {};
    for (const row of csvRows) {
      const dateStr = row['DATE'];
      if (!dateStr) continue;
      for (const interval of intervalColumns) {
        const value = parseFloat(row[interval]);
        if (isNaN(value)) continue;
        const match = interval.match(/(\d{2}:\d{2})/);
        if (!match) continue;
        const time = match[1];
        const dateTime = `${dateStr}T${time}`;
        if (!aggregate[dateTime]) {
          aggregate[dateTime] = 0;
        }
        aggregate[dateTime] += value;
      }
    }

    const rawValues = Object.entries(aggregate).map(([date, value]) => ({ date, value }));
    const processedData = aggregateToInterval(rawValues, periodInMinutes);

    return {
      periodInMinutes,
      values: filterLastYearOfData(processedData)
    };
  }
}
