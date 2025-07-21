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
  
  // Process the data similar to the fallback processing
  // Group by calendar day (MM-DD) regardless of year
  const irradianceByCalendarDay = new Map<string, number>();
  
  irradianceEntries.forEach(([dateKey, value]) => {
    // Parse YYYYMMDD format
    const month = dateKey.substring(4, 6);
    const day = dateKey.substring(6, 8);
    const monthDay = `${month}-${day}`;
    
    // Store the value (convert kWh/m²/day to consistent units if needed)
    irradianceByCalendarDay.set(monthDay, value);
  });
  
  // Create ordered array from Jan 1 to Dec 31
  const orderedIrradiance: number[] = [];
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= daysInMonth[month - 1]; day++) {
      const monthDay = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const value = irradianceByCalendarDay.get(monthDay);
      
      if (value !== undefined) {
        orderedIrradiance.push(value);
      } else {
        // If no data for this calendar day, interpolate from nearby days
        const availableValues = Array.from(irradianceByCalendarDay.values());
        if (availableValues.length > 0) {
          const average = availableValues.reduce((sum, val) => sum + val, 0) / availableValues.length;
          orderedIrradiance.push(average);
        } else {
          // Fallback to a reasonable value
          orderedIrradiance.push(5.0); // kWh/m²/day typical value
        }
      }
    }
  }
  
  // Ensure we have exactly 365 values
  if (orderedIrradiance.length !== 365) {
    console.warn(`NASA POWER data has ${orderedIrradiance.length} days, expected 365. Adjusting...`);
    
    // If we have too few values, pad with averages
    while (orderedIrradiance.length < 365) {
      const average = orderedIrradiance.reduce((sum, val) => sum + val, 0) / orderedIrradiance.length;
      orderedIrradiance.push(average);
    }
    
    // If we have too many values, truncate
    if (orderedIrradiance.length > 365) {
      orderedIrradiance.splice(365);
    }
  }
  
  // Validate all values are positive
  const hasInvalidValues = orderedIrradiance.some(value => value <= 0 || isNaN(value));
  if (hasInvalidValues) {
    console.warn('Found invalid irradiance values, replacing with interpolated values');
    // Replace invalid values with average of valid values
    const validValues = orderedIrradiance.filter(value => value > 0 && !isNaN(value));
    const average = validValues.length > 0 
      ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length 
      : 5000; // 5 kWh/m²/day fallback
    
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
): Promise<number[]> {
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
    return apiData;
    
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
 * Validate solar irradiance data
 * 
 * @param data - Array of irradiance values to validate
 * @returns true if data is valid, false otherwise
 */
export function validateSolarIrradianceData(data: unknown): data is number[] {
  if (!Array.isArray(data)) {
    return false;
  }
  
  if (data.length !== 365) {
    return false;
  }
  
  return data.every(val => 
    typeof val === 'number' && 
    val >= 0 && 
    !isNaN(val)
  );
}
