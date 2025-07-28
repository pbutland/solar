import type { EnergyCsvParser } from './csvProcessor';
import type { EnergyData } from '../types/index.js';
import { aggregateToInterval, filterLastYearOfData } from './csvProcessor';

// NEM12 parser implementation
// Reference: https://aemo.com.au/-/media/files/electricity/nem/retail_and_metering/market-settlements-and-transfer-solution-nem12-nem13-file-format-specification.pdf
// Only basic 30-min/15-min/5-min interval import is supported
export class NEM12CsvParser implements EnergyCsvParser {
  isValid(data: any[] | string[][]): boolean {
    // Check if data is array-of-arrays and first cell is '100' (NEM12 header)
    return Array.isArray(data) && data.length > 0 && Array.isArray(data[0]) && data[0][0] === '100';
  }

  parse(data: any[] | string[][], periodInMinutes: number = 30): EnergyData {
    if (!Array.isArray(data) || data.length === 0 || !Array.isArray(data[0])) {
      throw new Error('NEM12 parser expects array-of-arrays input');
    }

    // NEM12 structure: 100 (file header), 200 (meter), 300 (intervals), 900 (footer)
    let currentDate = '';
    let currentIntervalLength = periodInMinutes;
    const rawValues: { date: string; value: number }[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      const recordType = row[0];
      if (recordType === '200') {
        // 200,NMI,SUFFIX,MDI,UNIT,INTERVAL_LENGTH,...
        currentIntervalLength = parseInt(row[5], 10) || 30;
      } else if (recordType === '300') {
        // 300,yyyymmdd,v1,v2,...,vN,qual1,qual2,...
        currentDate = row[1];
        const intervalsPerDay = Math.floor(1440 / currentIntervalLength);
        for (let j = 0; j < intervalsPerDay; j++) {
          const valStr = row[2 + j];
          const val = parseFloat(valStr);
          if (!isNaN(val)) {
            const year = currentDate.slice(0, 4);
            const month = currentDate.slice(4, 6);
            const day = currentDate.slice(6, 8);
            const minutes = j * currentIntervalLength;
            const hour = Math.floor(minutes / 60).toString().padStart(2, '0');
            const minute = (minutes % 60).toString().padStart(2, '0');
            const iso = `${year}-${month}-${day}T${hour}:${minute}`;
            rawValues.push({ date: iso, value: val });
          }
        }
      }
    }

    rawValues.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const processedData = aggregateToInterval(rawValues, periodInMinutes);
    
    return {
      periodInMinutes: currentIntervalLength,
      values: filterLastYearOfData(processedData)
    };
  }
}
