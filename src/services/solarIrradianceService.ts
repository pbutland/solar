import ghiData from '../data/ghi.json';

/**
 * Solar Irradiance Service
 * Handles both fallback data and NASA POWER API integration for solar irradiance data
 */

// Type definition for GHI data structure
interface GHIData {
  properties: {
    parameter: {
      ALLSKY_SFC_SW_DWN: Record<string, number>;
    };
  };
}

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
 * Extract and process solar irradiance data (GHI - Global Horizontal Irradiance)
 * Reorders data by calendar day (Jan 1 - Dec 31) and converts to relative multipliers
 */
function processSolarIrradiance(): number[] {
  const typedGhiData = ghiData as GHIData;
  const ghiEntries = Object.entries(typedGhiData.properties.parameter.ALLSKY_SFC_SW_DWN);
  
  // Group GHI data by month-day (MM-DD) regardless of year
  const ghiByCalendarDay = new Map<string, number>();
  
  ghiEntries.forEach(([dateKey, value]) => {
    // Parse YYYYMMDD format
    const month = dateKey.substring(4, 6);
    const day = dateKey.substring(6, 8);
    const monthDay = `${month}-${day}`;
    
    ghiByCalendarDay.set(monthDay, value);
  });
  
  // Create ordered array from Jan 1 to Dec 31
  const orderedGHI: number[] = [];
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= daysInMonth[month - 1]; day++) {
      const monthDay = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const value = ghiByCalendarDay.get(monthDay);
      
      if (value !== undefined) {
        orderedGHI.push(value);
      } else {
        // If no data for this calendar day, use average of available data
        const availableValues = Array.from(ghiByCalendarDay.values());
        const average = availableValues.reduce((sum, val) => sum + val, 0) / availableValues.length;
        orderedGHI.push(average);
      }
    }
  }
  
  // Calculate the maximum GHI value for normalization
  const maxGHI = Math.max(...orderedGHI);
  
  // Normalize to create relative multipliers (0-1 range)
  // These represent the relative solar potential for each day
  const normalizedValues = orderedGHI.map(value => value / maxGHI);
  
  return normalizedValues;
}

/**
 * Fetch solar irradiance data from NASA POWER API
 * 
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @returns Promise resolving to normalized solar irradiance data for 365 days
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
  
  // Calculate the maximum irradiance value for normalization
  const maxIrradiance = Math.max(...orderedIrradiance);
  
  if (maxIrradiance === 0) {
    throw new Error('All irradiance values are zero - invalid data from NASA POWER API');
  }
  
  // Normalize to create relative multipliers (0-1 range)
  const normalizedValues = orderedIrradiance.map(value => value / maxIrradiance);
  
  console.log(`Successfully processed NASA POWER data: ${normalizedValues.length} days, max irradiance: ${maxIrradiance.toFixed(2)} kWh/m²/day`);
  
  return normalizedValues;
}

/**
 * Get solar irradiance data from NASA POWER API
 * Falls back to local data if API is unavailable or coordinates are not provided
 * 
 * @param latitude - Location latitude (required for API call)
 * @param longitude - Location longitude (required for API call)
 * @returns Promise resolving to normalized solar irradiance data for 365 days
 */
export async function getApiSolarIrradiance(
  latitude?: number, 
  longitude?: number
): Promise<number[]> {
  try {
    // If coordinates are provided, try to fetch from NASA POWER API
    if (latitude !== undefined && longitude !== undefined) {
      console.log(`Attempting to fetch solar data for coordinates: ${latitude}, ${longitude}`);
      
      try {
        const apiData = await fetchNASAPowerData(latitude, longitude);
        
        // Validate the API data
        if (!Array.isArray(apiData) || apiData.length !== 365) {
          throw new Error(`Invalid API data: expected array of 365 values, got ${apiData?.length || 'invalid'}`);
        }
        
        // Validate that all values are numbers between 0 and 1
        const invalidValues = apiData.filter(val => 
          typeof val !== 'number' || val < 0 || val > 1 || isNaN(val)
        );
        
        if (invalidValues.length > 0) {
          throw new Error(`Invalid API values: ${invalidValues.length} values out of range`);
        }
        
        console.log('Successfully retrieved and validated NASA POWER API data');
        return apiData;
        
      } catch (apiError) {
        console.warn('NASA POWER API failed, falling back to local data:', apiError);
        // Fall through to use local fallback data
      }
    } else {
      console.log('No coordinates provided, using fallback solar data');
    }
    
    // Fall back to processed local data
    const irradianceData = processSolarIrradiance();
    
    // Validate the fallback data
    if (!Array.isArray(irradianceData) || irradianceData.length !== 365) {
      throw new Error('Invalid solar irradiance data: expected array of 365 values');
    }
    
    // Validate that all values are numbers between 0 and 1
    const invalidValues = irradianceData.filter(val => 
      typeof val !== 'number' || val < 0 || val > 1 || isNaN(val)
    );
    
    if (invalidValues.length > 0) {
      throw new Error(`Invalid solar irradiance values: ${invalidValues.length} values out of range`);
    }
    
    return irradianceData;
    
  } catch (error) {
    console.error('Error fetching solar irradiance data:', error);
    
    // Return fallback data in case of error
    try {
      return processSolarIrradiance();
    } catch (fallbackError) {
      console.error('Error processing fallback solar irradiance data:', fallbackError);
      
      // Return a basic fallback pattern if everything fails
      // Summer peak around day 172 (June 21st), winter low around day 355 (December 21st)
      console.log('Using mathematical fallback pattern for solar irradiance');
      return Array.from({ length: 365 }, (_, dayIndex) => {
        const angle = (dayIndex * 2 * Math.PI) / 365;
        return Math.max(0.1, 0.5 + 0.4 * Math.sin(angle - Math.PI / 2));
      });
    }
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
    val <= 1 && 
    !isNaN(val)
  );
}
