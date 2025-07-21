import type { EnergyUsageEntry } from '../types/index.js';

interface CsvRow {
  'Usage Type': string;
  'Amount Used': string;
  'From (date/time)': string;
  'To (date/time)': string;
  [key: string]: string;
}

export const processCsvData = (data: CsvRow[]): EnergyUsageEntry[] => {
  const dailyConsumption: { [key: string]: number } = {};

  data.forEach((row) => {
    const usageType = row['Usage Type'];
    const amountUsedStr = row['Amount Used'];
    const fromTime = row['From (date/time)'];

    // Only process consumption entries
    if (usageType !== 'Consumption' || !fromTime || !amountUsedStr) {
      return;
    }

    const consumption = parseFloat(amountUsedStr);
    if (isNaN(consumption)) {
      return;
    }

    try {
      const date = new Date(fromTime);
      if (isNaN(date.getTime())) {
        return;
      }
      const day = date.toISOString().split('T')[0];

      if (dailyConsumption[day]) {
        dailyConsumption[day] += consumption;
      } else {
        dailyConsumption[day] = consumption;
      }
    } catch (error) {
      console.error('Error parsing date:', fromTime, error);
    }
  });

  // Convert to array format matching energy-usage.json structure
  return Object.entries(dailyConsumption)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
