import type { EnergyData, EnergyPeriodEntry } from '../types/index';
import { calculateSunriseSunset } from '../utils/solarTime';
import { toZonedTime } from 'date-fns-tz';

/**
 * Solar Irradiance Service
 * Handles NASA POWER API integration for solar irradiance data
 */

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

// NASA POWER API configuration
const NASA_POWER_BASE_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';
const SOLAR_PARAMETER = 'ALLSKY_SFC_SW_DWN'; // All Sky Surface Shortwave Downward Irradiance

// Required to bring up NASA irradiance data to a meaningful figure
const MULTIPLIER = 16;

/**
 * Fetch solar irradiance data from NASA POWER API
 * 
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @returns Promise resolving to daily solar irradiance data in Wh/m²/day
 */
async function fetchNASAPowerData(latitude: number, longitude: number): Promise<number[]> {
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

  // Set all dates to current year and sort
  const currentYear = new Date().getFullYear();
  const irradianceWithDates = irradianceEntries.map(([dateKey, value]) => {
    // dateKey is YYYYMMDD
    const month = dateKey.substring(4, 6);
    const day = dateKey.substring(6, 8);
    // Set year to current year
    const date = new Date(`${currentYear}-${month}-${day}T00:00:00Z`);
    return { date, value };
  });

  // Sort by date
  irradianceWithDates.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Map to values
  const orderedIrradiance = irradianceWithDates.map(entry => entry.value);

  // If not 365 values, throw error
  if (orderedIrradiance.length !== 365) {
    throw new Error(`NASA POWER API did not return 365 daily values, received ${orderedIrradiance.length}`);
  }

  // Validate all values are positive
  const hasInvalidValues = orderedIrradiance.some(value => value <= 0 || isNaN(value));
  if (hasInvalidValues) {
    console.warn('Found invalid irradiance values, replacing with interpolated values');
    const validValues = orderedIrradiance.filter(value => value > 0 && !isNaN(value));
    const average = validValues.length > 0
      ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length
      : 5.0; // 5 kWh/m²/day fallback
    for (let i = 0; i < orderedIrradiance.length; i++) {
      if (orderedIrradiance[i] <= 0 || isNaN(orderedIrradiance[i])) {
        orderedIrradiance[i] = average;
      }
    }
  }

  console.log(`Successfully processed NASA POWER data: ${orderedIrradiance.length} days, values range: ${Math.min(...orderedIrradiance).toFixed(2)} - ${Math.max(...orderedIrradiance).toFixed(2)} Wh/m²/day`);
  return orderedIrradiance;
}

/**
 * Get solar irradiance data from NASA POWER API
 * Requires valid coordinates and throws an error if data cannot be fetched
 * 
 * @param latitude - Location latitude (required for API call)
 * @param longitude - Location longitude (required for API call)
 * @returns Promise resolving to daily solar irradiance data in Wh/m²/day
 * @throws Error if coordinates are missing or API call fails
 */
export async function getApiSolarIrradiance(
  latitude?: number, 
  longitude?: number
): Promise<EnergyData> {
  // Require coordinates to be provided
  if (latitude === undefined || longitude === undefined) {
    throw new Error('Location coordinates are required to fetch solar data. Please input a location.');
  }

  console.log(`Attempting to fetch solar data for coordinates: ${latitude}, ${longitude}`);
  
  try {
    const apiData = await fetchNASAPowerData(latitude, longitude);
    
    // Validate the API data
    if (!apiData || !Array.isArray(apiData) || apiData.length !== 365) {
      throw new Error(`Invalid API response: expected 365 daily values, received ${apiData?.length || 'invalid data'}`);
    }
    
    // Check for values that are out of valid range and fix them
    const invalidValues = apiData.filter(val => 
      typeof val !== 'number' || val < 0 || isNaN(val)
    );
    
    if (invalidValues.length > 0) {
      console.warn(`Found ${invalidValues.length} invalid solar data values:`, invalidValues);
      console.warn('Setting invalid values to interpolated averages and continuing...');
      
      // Fix invalid values by setting them to average of valid values
      const validValues = apiData.filter(val => typeof val === 'number' && val > 0 && !isNaN(val));
      const average = validValues.length > 0 
        ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length 
        : 5000; // 5 kWh/m²/day fallback
      
      for (let i = 0; i < apiData.length; i++) {
        const val = apiData[i];
        if (typeof val !== 'number' || val < 0 || isNaN(val)) {
          apiData[i] = average;
        }
      }
    }
    
    console.log('Successfully retrieved and validated NASA POWER API data');
    // Build IrradianceEntry array with date starting at Jan 1 of current year
    const year = new Date().getFullYear();
    const entries: { date: string; value: number }[] = [];
    let currentDate = new Date(`${year}-01-01T00:00:00Z`);
    for (let i = 0; i < apiData.length; i++) {
      const dateStr = currentDate.toISOString().slice(0, 10); // YYYY-MM-DD
      entries.push({ date: dateStr, value: apiData[i] * MULTIPLIER });
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // Slice data to 30 minute blocks
    const values = processSolarIrradianceData(entries, latitude, longitude, 30);
    return {
      periodInMinutes: 30,
      values: values || []
    }
    
  } catch (apiError) {
    console.error('NASA POWER API failed:', apiError);
    
    // Provide more specific error messages based on the type of error
    if (apiError instanceof Error) {
      if (apiError.message.includes('NASA POWER API request failed')) {
        throw new Error(`Unable to fetch solar data for this location. The NASA POWER API service may be temporarily unavailable. Please try again later or select a different location.`);
      } else if (apiError.message.includes('No irradiance data received')) {
        throw new Error(`No solar data available for the selected location. Please try a different location with better data coverage.`);
      } else if (apiError.message.includes('Invalid')) {
        throw new Error(`Invalid solar data received for this location. Please try selecting a different location.`);
      }
    }
    
    // Generic error message for any other failures
    throw new Error(`Failed to retrieve solar data for the selected location (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Please verify the location is valid and try again.`);
  }
}

/**
 * Processes solar irradiance data into energy period entries
 */
function processSolarIrradianceData(
  data: EnergyPeriodEntry[],
  latitude: number,
  longitude: number,
  periodInMinutes: number = 30
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
    for (let i = roundedSunset; i < (1440-roundedSunset); i += periodInMinutes) {
      const entryDate = new Date(entry.date);
      entryDate.setUTCMinutes(i);
      postSunsetEntries.push({
        date: entryDate.toISOString(),
        value: 0 // No energy after sunset
      });
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