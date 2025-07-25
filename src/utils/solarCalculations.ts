import { solarSystemConstants } from '../config/solarConstants.js';

/**
 * Solar calculation utilities for the solar energy application
 * These functions handle the core solar energy calculations
 */

/**
 * Calculate daily solar generation based on installation size and solar irradiance
 * @param installationSizeKW - Size of solar installation in kilowatts (1-50kW)
 * @param solarIrrdianceWh - Array of 365 daily irradiance values in Wh/m²/day
 * @param panelEfficiency - Panel efficiency factor (default: 0.2 for 20%)
 * @param systemLosses - System losses factor (default: 0.15 for 15%)
 * @returns Array of daily generation values in kWh
 */
export function calculateDailyGeneration(
  installationSizeKW: number,
  solarIrrdianceWh: number[]
): number[] {
  // Validate input parameters
  if (installationSizeKW < 1 || installationSizeKW > 50) {
    throw new Error('Installation size must be between 1kW and 50kW');
  }
  
  return solarIrrdianceWh.map(irradianceWh => {
    // Convert irradiance from Wh/m²/day to kWh/m²/day
    const dailyGhiKWh = irradianceWh / solarSystemConstants.wattsToKilowatts;
    
    // Calculate panel area from installation size
    const panelAreaM2 = (installationSizeKW * solarSystemConstants.wattsToKilowatts) / solarSystemConstants.panelPowerDensityWPerM2; // Convert kW to W, then to m²
    
    // Calculate raw generation: GHI × Panel Area × Panel Efficiency
    const rawGeneration = dailyGhiKWh * panelAreaM2 * solarSystemConstants.panelEfficiency;
    
    // Apply system losses (inverter efficiency, wiring losses, etc.)
    const finalGeneration = rawGeneration * (1 - solarSystemConstants.systemLosses);
    
    return Math.round(finalGeneration * 100) / 100; // Round to 2 decimal places
  });
}

/**
 * Calculate net energy for each day (consumption - generation)
 * Positive values indicate surplus energy, negative values indicate deficit
 * @param dailyConsumption - Array of daily consumption values in kWh
 * @param dailyGeneration - Array of daily generation values in kWh
 * @returns Array of net energy values (positive = surplus, negative = deficit)
 */
export function calculateNetEnergy(
  dailyConsumption: number[],
  dailyGeneration: number[]
): number[] {
  // if (dailyConsumption.length !== dailyGeneration.length) {
  //   throw new Error('Consumption and generation arrays must have the same length');
  // }


  return dailyConsumption.map((consumption, index) => {
    const generation = dailyGeneration[index];
    const netEnergy = generation - consumption;
    return Math.round(netEnergy * 100) / 100; // Round to 2 decimal places
  });
}
