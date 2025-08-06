import type { EnergyCsvParser } from './csvProcessor';
import type { EnergyData, EnergyPeriodEntry } from '../types/index.js';
import { aggregateToInterval, fetchAndParseAverageData, filterLastYearOfData, padMissingDates } from './csvProcessor';

// Jemena CSV parser implementation
export class JemenaCsvParser implements EnergyCsvParser {
  isValid(data: any[] | string[][]): boolean {
    // Check if data is array-of-objects with expected keys
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && !Array.isArray(data[0])) {
      return 'NMI' in data[0] && 'CON/GEN' in data[0];
    }
    return false;
  }

  // Helper to determine usageType based on the third column value
  private getUsageType(row: { [key: string]: string }): 'general' | 'controlled' {
    // Get the third column value (index 2)
    const values = Object.values(row);
    const usageText = values[2];
    if (usageText === 'Controlled Load Consumption') return 'controlled';
    return 'general';
  }

  async parse(data: any[] | string[][], periodInMinutes: number = 30): Promise<EnergyData> {
    const csvRows = data as { [key: string]: string }[];
    const keys = Object.keys(csvRows[0]);
    const intervalColumns = keys.filter(k => /\d{2}:\d{2} - \d{2}:\d{2}/.test(k));

    // Build flat array of entries with correct usageType
    const entries: EnergyPeriodEntry[] = [];
    for (const row of csvRows) {
      const dateStr = row['DATE'];
      if (!dateStr) continue;
      const usageType = this.getUsageType(row);
      for (const interval of intervalColumns) {
        const value = parseFloat(row[interval]);
        if (isNaN(value)) continue;
        const match = interval.match(/(\d{2}:\d{2})/);
        if (!match) continue;
        const time = match[1];
        const dateTime = `${dateStr}T${time}`;
        entries.push({ date: dateTime, value, usageType });
      }
    }

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
