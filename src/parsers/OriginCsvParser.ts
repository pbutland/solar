import type { EnergyCsvParser } from './csvProcessor';
import type { EnergyData, EnergyPeriodEntry } from '../types/index.js';
import { parseISO } from 'date-fns';
import { toZonedTime, format } from 'date-fns-tz';
import { aggregateToInterval, fetchAndParseAverageData, filterLastYearOfData, padMissingDates } from './csvProcessor';

export class OriginCsvParser implements EnergyCsvParser {
  isValid(data: any[] | string[][]): boolean {
    // Check if data is array-of-objects with expected keys
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && !Array.isArray(data[0])) {
      return 'Usage Type' in data[0] && 'Amount Used' in data[0];
    }
    return false;
  }

  async parse(data: any[] | string[][], periodInMinutes: number = 30): Promise<EnergyData> {
    const csvRows = data as { [key: string]: string }[];
    const entries: EnergyPeriodEntry[] = [];

    for (const row of csvRows) {
      const usageType = row['Usage Type'];
      const amountUsedStr = row['Amount Used'];
      const fromTime = row['From (date/time)'];
      const toTime = row['To (date/time)'];

      if (
        usageType !== 'Consumption' ||
        !fromTime ||
        !toTime ||
        !amountUsedStr
      ) {
        continue;
      }

      const consumption = parseFloat(amountUsedStr);
      if (isNaN(consumption)) {
        continue;
      }

      try {
        let startDate: Date;
        let endDate: Date;
        let tz: string | undefined;

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
          continue;
        }

        const blockMillis = periodInMinutes * 60 * 1000;
        const startMillis = startDate.getTime();
        const endMillis = endDate.getTime();
        const firstBlockMillis = startMillis - (startMillis % blockMillis);
        const lastBlockMillis = endMillis - (endMillis % blockMillis);

        const blockCount = Math.floor((lastBlockMillis - firstBlockMillis) / blockMillis) + 1;
        if (blockCount <= 0) {
          continue;
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
          const dateKey = format(blockStartDate, "yyyy-MM-dd'T'HH:mm", { timeZone: tz || 'UTC' });
          entries.push({ date: dateKey, value: consumptionPerBlock, usageType: 'general' });
        }
      } catch (error) {
        console.error('Error parsing date:', fromTime, toTime, error);
      }
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
