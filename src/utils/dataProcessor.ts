import type { EnergyUsageEntry } from './csvProcessor.ts';
import ghiData from '../data/ghi.json';

export interface Location {
  name: string;
  lat: number;
  lng: number;
}

export interface ProcessedData {
  location: Location;
  dailyConsumption?: number[]; // 365 days in kWh
  solarIrradiance: number[];  // 365 days relative values (normalized)
}

/**
 * Process solar irradiance data from GHI data (same logic as mockData.ts)
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
  const normalizedValues = orderedGHI.map(value => value / maxGHI);
  
  return normalizedValues;
}

/**
 * Process uploaded energy usage data into the format expected by the application
 * Converts the uploaded data to match the structure of mockData
 */
export function processUploadedData(energyData: EnergyUsageEntry[]): ProcessedData {
  // Default location (Melbourne, Australia - same as mock data)
  const location: Location = {
    name: "Melbourne, Australia",
    lat: -37.54,
    lng: 144.68
  };

  // Sort by date to ensure chronological order
  const sortedData = [...energyData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Take the last 365 days of data to ensure we have a complete year
  const last365Days = sortedData.slice(-365);

  // Group data by month-day (MM-DD) regardless of year to create a standardized year
  const dataByCalendarDay = new Map<string, number>();
  
  last365Days.forEach(entry => {
    const date = new Date(entry.date);
    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    // If we have multiple years of data, take the average
    if (dataByCalendarDay.has(monthDay)) {
      const existing = dataByCalendarDay.get(monthDay)!;
      dataByCalendarDay.set(monthDay, (existing + entry.total) / 2);
    } else {
      dataByCalendarDay.set(monthDay, entry.total);
    }
  });

  // Create 365-day array starting from January 1st
  const dailyConsumption: number[] = [];
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  for (let month = 0; month < 12; month++) {
    for (let day = 1; day <= daysPerMonth[month]; day++) {
      const monthDay = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const consumption = dataByCalendarDay.get(monthDay) || 0;
      dailyConsumption.push(consumption);
    }
  }

  // Ensure we have exactly 365 days
  while (dailyConsumption.length < 365) {
    dailyConsumption.push(0);
  }
  if (dailyConsumption.length > 365) {
    dailyConsumption.splice(365);
  }

  // Use the same solar irradiance processing as mock data
  const solarIrradiance = processSolarIrradiance();

  return {
    location,
    dailyConsumption,
    solarIrradiance,
  };
}
