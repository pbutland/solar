import type { EnergyData, EnergyPeriodEntry } from '../types/index';
import { calculateSunriseSunset } from '../utils/solarTime';
import { toZonedTime } from 'date-fns-tz';
import { fetchNasaPowerIrradianceData } from './nasaPowerApiService';
import { fetchOpenMeteoIrradianceData } from './openMeteoApiService';

// Default period in minutes for solar irradiance data processing
export const PERIOD_IN_MINUTES = 30;

// Solar irradiance data sources as a const object and union type
export const SolarIrradianceSource = {
  NASA_POWER_API: 'NASA_POWER_API',
  OPEN_METEO_API: 'OPEN_METEO_API',
} as const;

export type SolarIrradianceSource = typeof SolarIrradianceSource[keyof typeof SolarIrradianceSource];

/**
 * Solar Irradiance Service
 */

/**
 * Unified function to get solar irradiance data for a given source
 */
export async function getSolarIrradiance(
  latitude: number,
  longitude: number,
  source: SolarIrradianceSource
  // TODO: allow time intervals to be specified in the future
): Promise<EnergyData> {
  if (latitude === undefined || longitude === undefined) {
    throw new Error('Location coordinates are required to fetch solar data. Please input a location.');
  }

  let rawEntries: { date: string; value: number }[] = [];
  try {
    switch (source) {
      case SolarIrradianceSource.NASA_POWER_API:
        rawEntries = await fetchNasaPowerIrradianceData(latitude, longitude);
        break;
      case SolarIrradianceSource.OPEN_METEO_API:
        rawEntries = await fetchOpenMeteoIrradianceData(latitude, longitude);
        break;
      default:
        throw new Error('Unknown solar irradiance data source');
    }
  } catch (err: any) {
    // Error handling per source
    if (err instanceof Error) {
      if (err.message.includes('NASA POWER API request failed')) {
        throw new Error(`Unable to fetch solar data for this location. The NASA POWER API service may be temporarily unavailable. Please try again later or select a different location.`);
      } else if (err.message.includes('No irradiance data received')) {
        throw new Error(`No solar data available for the selected location. Please try a different location with better data coverage.`);
      } else if (err.message.includes('Invalid')) {
        throw new Error(`Invalid solar data received for this location. Please try selecting a different location.`);
      } else if (err.message.includes('Open Meteo')) {
        throw new Error('Open Meteo data source not yet implemented.');
      }
    }
    throw new Error(`Failed to retrieve solar data for the selected location (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Please verify the location is valid and try again.`);
  }

  // Set all dates to current year and sort
  const currentYear = new Date().getFullYear();
  const entries = rawEntries.map(entry => {
    // date is YYYYMMDD
    const month = entry.date.substring(4, 6);
    const day = entry.date.substring(6, 8);
    // Set year to current year
    const dateStr = `${currentYear}-${month}-${day}`;
    return { date: dateStr, value: entry.value };
  });

  // Sort by date
  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Slice data to PERIOD_IN_MINUTES blocks
  const values = processSolarIrradianceData(entries, latitude, longitude, PERIOD_IN_MINUTES);
  return {
    periodInMinutes: PERIOD_IN_MINUTES,
    values: values || []
  };
}

/**
 * Processes solar irradiance data into energy period entries
 */
function processSolarIrradianceData(
  data: EnergyPeriodEntry[],
  latitude: number,
  longitude: number,
  periodInMinutes: number = PERIOD_IN_MINUTES
): EnergyPeriodEntry[] | null {

  if (!data || data.length === 0) {
    console.warn('No solar irradiance data available for processing');
    return null;
  }

  // Map each irradiance entry to an EnergyPeriodEntry calling splitIrradianceValue for each entry
  const energyEntries: EnergyPeriodEntry[] = data.flatMap(entry => {
    const date = new Date(entry.date);

    // Determine the sunrise and sunset times based on latitude and longitude
    const { sunrise, sunset } = calculateSunriseSunset(date, latitude, longitude);
    const { roundedSunrise, roundedSunset } = roundSunriseSunset(sunrise, sunset, periodInMinutes);

    // Create zero value entries for the time since midnight until sunrise
    const midnightUtcMinutes = getMidnightUtcMinutes(date);
    const preSunriseEntries: EnergyPeriodEntry[] = [];
    for (let i = midnightUtcMinutes; i < roundedSunrise; i += periodInMinutes) {
      const entryDate = new Date(entry.date);
      entryDate.setUTCMinutes(i);
      preSunriseEntries.push({
        date: entryDate.toISOString(),
        value: 0 // No energy before sunrise
      });
    }

    // Split the entry.value into the specified period using a normal distribution between the sunrise and sunset times
    const values = splitIrradianceValue(entry, roundedSunrise, roundedSunset, periodInMinutes);

    // Create zero value entries for the time after sunset until midnight
    const postSunsetEntries: EnergyPeriodEntry[] = [];
    for (let i = roundedSunset; i < (midnightUtcMinutes + 1440); i += periodInMinutes) {
      const entryDate = new Date(entry.date);
      entryDate.setUTCMinutes(i);
      postSunsetEntries.push({
        date: entryDate.toISOString(),
        value: 0 // No energy after sunset
      });
    }

    const totalEntries = preSunriseEntries.length + values.length + postSunsetEntries.length;
    if (totalEntries !== 48) {
      console.warn(`Unexpected number of entries: ${totalEntries}`);
    }

    // Combine all entries: pre-sunrise, split values, and post-sunset
    return [...preSunriseEntries, ...values, ...postSunsetEntries];
  });

  return energyEntries;
}

function splitIrradianceValue(
  entry: EnergyPeriodEntry,
  sunrise: number,
  sunset: number,
  periodInMinutes: number
): EnergyPeriodEntry[] {
  const entries: EnergyPeriodEntry[] = [];

  // Calculate the total minutes of daylight
  const daylightMinutes = sunset - sunrise;
  if (daylightMinutes <= 0) return entries;

  // Normal distribution parameters
  const mean = sunrise + daylightMinutes / 2;
  const stddev = daylightMinutes / 6; // 99.7% within daylight

  // Helper: normal distribution PDF
  function normalPDF(x: number, mean: number, stddev: number) {
    return Math.exp(-0.5 * Math.pow((x - mean) / stddev, 2)) / (stddev * Math.sqrt(2 * Math.PI));
  }

  // Calculate PDF values for each minute
  const pdfValues: number[] = [];
  let pdfSum = 0;
  for (let m = sunrise; m < sunset; m++) {
    const pdf = normalPDF(m, mean, stddev);
    pdfValues.push(pdf);
    pdfSum += pdf;
  }

  // Split the value into periods using summed PDF values
  for (let i = sunrise; i < sunset; i += periodInMinutes) {
    // Sum PDF values for this block
    let blockPdfSum = 0;
    for (let m = i; m < Math.min(i + periodInMinutes, sunset); m++) {
      blockPdfSum += pdfValues[m - sunrise];
    }
    // Proportion of total energy for this block
    const entryValue = (blockPdfSum / pdfSum) * entry.value;
    const entryDate = new Date(entry.date);
    entryDate.setUTCMinutes(i);

    entries.push({
      date: entryDate.toISOString(),
      value: entryValue
    });
  }

  return entries;
}

function roundSunriseSunset(
  sunrise: number,
  sunset: number,
  periodInMinutes: number
): { roundedSunrise: number, roundedSunset: number } {
  // Helper to round minutes to nearest periodInMinutes
  function roundToNearestPeriod(mins: number): { rounded: number, direction: 'up' | 'down' } {
    const remainder = mins % periodInMinutes;
    if (remainder === 0) return { rounded: mins, direction: 'up' };
    if (remainder < periodInMinutes / 2) return { rounded: mins - remainder, direction: 'down' };
    return { rounded: mins + (periodInMinutes - remainder), direction: 'up' };
  }

  // Round sunrise and sunset to nearest periodInMinutes, same direction
  const sunriseRound = roundToNearestPeriod(sunrise);
  let roundedSunrise = sunriseRound.rounded;
  let roundedSunset;
  if (sunriseRound.direction === 'up') {
    roundedSunset = roundToNearestPeriod(sunset).rounded;
    if (roundedSunset < sunset) {
      // If sunset rounded down, force up (keeps length of day consistent)
      roundedSunset += periodInMinutes;
    }
  } else {
    roundedSunset = roundToNearestPeriod(sunset).rounded;
    if (roundedSunset > sunset) {
      // If sunset rounded up, force down (keeps length of day consistent)
      roundedSunset -= periodInMinutes;
    }
  }

  return { roundedSunrise, roundedSunset };
}

function getMidnightUtcMinutes(date: Date): number {
  // Get local midnight in the target timezone
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localMidnight = toZonedTime(date, timeZone);
  localMidnight.setHours(0, 0, 0, 0);
  // Get UTC minutes for local midnight
  return -1440 + localMidnight.getUTCHours() * 60 + localMidnight.getUTCMinutes();
}