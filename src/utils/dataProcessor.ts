import type { EnergyUsageEntry, ProcessedData } from '../types/index.js';

/**
 * Process uploaded energy usage data into the format expected by the application
 * Converts the uploaded data to match the structure of ProcessedData
 * 
 * @param energyData - Array of energy usage entries from uploaded CSV
 * @param solarIrradiance - Optional solar irradiance data; if not provided, fallback data will be used
 * @returns ProcessedData object with location, consumption, and irradiance data
 */
export function processUploadedData(
  energyData: EnergyUsageEntry[], 
  solarIrradiance?: number[]
): ProcessedData {
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

  return {
    dailyConsumption,
    solarIrradiance,
  };
}
