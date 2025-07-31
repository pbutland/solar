import type { EnergyPeriodEntry } from '../types/index';

// Type definitions for NASA POWER API response
interface NASAPowerResponse {
  type: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: {
    parameter: {
      ALLSKY_SFC_SW_DWN: Record<string, number>;
    };
  };
}

const NASA_POWER_BASE_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';
const SOLAR_PARAMETER = 'ALLSKY_SFC_SW_DWN';
export const MULTIPLIER = 16;

/**
 * Fetch solar irradiance data from NASA POWER API
 * Returns array of { date: string, value: number }
 */
export async function fetchNasaPowerIrradianceData(latitude: number, longitude: number): Promise<EnergyPeriodEntry[]> {
  // Get date range for the past year (API has 5-day delay)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 5); // Account for API delay
  const startDate = new Date(endDate);
  startDate.setFullYear(startDate.getFullYear() - 1); // Go back 1 year
  startDate.setDate(startDate.getDate() + 1);

  // Format dates as YYYYMMDD for NASA POWER API
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);

  // Construct NASA POWER API URL
  const url = `${NASA_POWER_BASE_URL}?parameters=${SOLAR_PARAMETER}&community=SB&longitude=${longitude}&latitude=${latitude}&start=${startDateStr}&end=${endDateStr}&format=JSON`;

  console.log(`Fetching solar data from NASA POWER API for lat: ${latitude}, lng: ${longitude}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NASA POWER API request failed: ${response.status} ${response.statusText}`);
  }

  const data: NASAPowerResponse = await response.json();

  // Extract daily irradiance values
  const irradianceEntries = Object.entries(data.properties.parameter.ALLSKY_SFC_SW_DWN);
  if (irradianceEntries.length === 0) {
    throw new Error('No irradiance data received from NASA POWER API');
  }

  // Convert to array of { date, value }
  const irradianceWithDates = irradianceEntries.map(([dateKey, value]) => {
    return { date: dateKey, value: value * MULTIPLIER };
  });

  // If not 365 values, throw error
  if (irradianceWithDates.length !== 365) {
    throw new Error(`NASA POWER API did not return 365 daily values, received ${irradianceWithDates.length}`);
  }

  // Validate all values are positive
  const hasInvalidValues = irradianceWithDates.some(entry => entry.value <= 0 || isNaN(entry.value));
  if (hasInvalidValues) {
    console.warn('Found invalid irradiance values, replacing with interpolated values');
    const validValues = irradianceWithDates.filter(entry => entry.value > 0 && !isNaN(entry.value)).map(entry => entry.value);
    const average = validValues.length > 0
      ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length
      : 5.0; // 5 kWh/m²/day fallback
    for (let i = 0; i < irradianceWithDates.length; i++) {
      if (irradianceWithDates[i].value <= 0 || isNaN(irradianceWithDates[i].value)) {
        irradianceWithDates[i].value = average;
      }
    }
  }

  console.log(`Successfully processed NASA POWER data: ${irradianceWithDates.length} days, values range: ${Math.min(...irradianceWithDates.map(e => e.value)).toFixed(2)} - ${Math.max(...irradianceWithDates.map(e => e.value)).toFixed(2)} Wh/m²/day`);
  return irradianceWithDates;
}
