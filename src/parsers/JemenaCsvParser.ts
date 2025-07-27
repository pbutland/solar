import type { EnergyCsvParser } from './csvProcessor';
import type { EnergyData } from '../types/index.js';
import { filterLastYearOfData } from './csvProcessor';

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
    let csvRows: { [key: string]: string }[];
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && !Array.isArray(data[0])) {
      csvRows = data as { [key: string]: string }[];
    } else if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      const [header, ...rows] = data as string[][];
      const keys = header;
      csvRows = rows.map(row => {
        const obj: { [key: string]: string } = {};
        keys.forEach((k, i) => {
          obj[k] = row[i];
        });
        return obj;
      });
    } else {
      throw new Error('Unsupported data format for JemenaCsvParser');
    }

    const values = csvRows.map(row => {
      // Expecting 'Interval Date' in ISO or AU format, and 'kWh' as the value
      const date = row['Interval Date'];
      const value = parseFloat(row['kWh']);
      return { date, value };
    }).filter(e => e.date && !isNaN(e.value));

    return {
      periodInMinutes,
      values: filterLastYearOfData(values)
    };
  }
}
