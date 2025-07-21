import ghiData from '../data/ghi.json';

/**
 * Solar Irradiance Service
 * Handles both fallback data and future API integration for solar irradiance data
 */

// Type definition for GHI data structure
interface GHIData {
  properties: {
    parameter: {
      ALLSKY_SFC_SW_DWN: Record<string, number>;
    };
  };
}

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
 * Get solar irradiance data from API
 * Currently returns fallback data - will be updated for real API integration
 * 
 * @param _latitude - Location latitude (currently unused, for future API integration)
 * @param _longitude - Location longitude (currently unused, for future API integration)
 * @returns Promise resolving to normalized solar irradiance data for 365 days
 */
export async function getApiSolarIrradiance(
  _latitude?: number, 
  _longitude?: number
): Promise<number[]> {
  try {
    // TODO: Replace with actual API call when available
    // _latitude and _longitude will be used for API calls in future implementation
    
    // For now, return the processed fallback data
    const irradianceData = processSolarIrradiance();
    
    // Validate the data
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
