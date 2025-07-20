// Import the raw data files
import ghiData from './ghi.json';

/**
 * TypeScript interfaces for POC data structure
 */
export interface Location {
  name: string;
  lat: number;
  lng: number;
}

export interface EnergyUsageEntry {
  date: string;
  total: number;
}

export interface SolarSystemConstants {
  panelEfficiency: number;    // 0.2 (20%)
  systemLosses: number;       // 0.15 (15%)
  spacePerKW: number;        // 7 (m² per kW)
  panelPowerDensityWPerM2: number;  // 150 (W/m²)
  individualPanelWattage: number;   // 400 (W per panel)
  averageRoofSizeM2: number;        // 200 (m² - typical Australian home)
  squareMetersToSquareFeet: number; // 10.764 (conversion factor)
  wattsToKilowatts: number;         // 1000 (conversion factor)
}

export interface MockData {
  location: Location;
  dailyConsumption: number[]; // 365 days in kWh (optional)
  solarIrradiance: number[];  // 365 days relative values (normalized)
}

/**
 * Extract and process solar irradiance data (GHI - Global Horizontal Irradiance)
 * Reorders data by calendar day (Jan 1 - Dec 31) and converts to relative multipliers
 */
function processSolarIrradiance(): number[] {
  const ghiEntries = Object.entries(ghiData.properties.parameter.ALLSKY_SFC_SW_DWN);
  
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
 * Main mock data object with processed real data
 */
export const mockData: MockData = {
  // Location information (Melbourne, Australia based on GHI coordinates)
  location: {
    name: "Melbourne, Australia",
    lat: -37.54,
    lng: 144.68
  },
  dailyConsumption: [],
  solarIrradiance: processSolarIrradiance()
};

/**
 * Solar system constants separate from the consumption/irradiance data
 */
export const solarSystemConstants: SolarSystemConstants = {
  // Panel efficiency constant (20% - typical for modern panels)
  // GHI data appears to be wrong????
  panelEfficiency: 3,//0.2,
  
  // System losses constant (15% - accounts for inverter losses, wiring, etc.)
  systemLosses: 0.15,
  
  // Space requirement constant (7m² per kW - industry standard)
  spacePerKW: 7,
  
  // Panel power density (150W/m² - conservative estimate for modern panels)
  panelPowerDensityWPerM2: 150,
  
  // Individual panel wattage (400W - typical for residential solar panels)
  individualPanelWattage: 400,
  
  // Average Australian home roof size (200m²)
  averageRoofSizeM2: 200,
  
  // Conversion factor from square meters to square feet
  squareMetersToSquareFeet: 10.764,
  
  // Conversion factor from watts to kilowatts
  wattsToKilowatts: 1000
};

/**
 * Utility function to get a specific day's data
 */
export function getDayData(dayIndex: number): {
  consumption: number | null;
  irradiance: number;
  date?: string;
} {
  if (dayIndex < 0 || dayIndex >= 365) {
    throw new Error('Day index must be between 0 and 364');
  }
  return {
    consumption: mockData.dailyConsumption ? mockData.dailyConsumption[dayIndex] : null,
    irradiance: mockData.solarIrradiance[dayIndex]
  };
}

export default mockData;
