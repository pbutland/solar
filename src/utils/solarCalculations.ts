import { solarSystemConstants } from '../config/solarConstants.js';

/**
 * Solar calculation utilities for the solar energy application
 * These functions handle the core solar energy calculations
 */

/**
 * Calculate daily solar radiation from irradiance data
 * @param solarIrradiance - Array of 365 daily irradiance multipliers (0-1)
 * @param maxIrradianceWh - Maximum irradiance value in Wh/m²/day for this location
 * @returns Array of solar radiation values in kWh/m²/day
 */
export function calculateSolarRadiation(solarIrradiance: number[], maxIrradianceWh: number): number[] {
  // The irradiance data has been normalized (0-1) by the solar irradiance service
  // We need to convert back using the location-specific max GHI data
  // NASA GHI data is in Wh/m²/day, need to convert to kWh/m²/day
  
  return solarIrradiance.map(normalizedIrradiance => {
    // Convert back to original Wh/m²/day, then to kWh/m²/day
    const ghiWh = normalizedIrradiance * maxIrradianceWh;
    const ghiKWh = ghiWh / solarSystemConstants.wattsToKilowatts; // Convert Wh to kWh
    return Math.round(ghiKWh * 100) / 100; // Round to 2 decimal places
  });
}

/**
 * Calculate daily solar generation based on installation size and solar irradiance
 * @param installationSizeKW - Size of solar installation in kilowatts (1-50kW)
 * @param solarIrradiance - Array of 365 daily irradiance multipliers (0-1)
 * @param maxIrradianceWh - Maximum irradiance value in Wh/m²/day for this location
 * @param panelEfficiency - Panel efficiency factor (default: 0.2 for 20%)
 * @param systemLosses - System losses factor (default: 0.15 for 15%)
 * @returns Array of daily generation values in kWh
 */
export function calculateDailyGeneration(
  installationSizeKW: number,
  solarIrradiance: number[],
  maxIrradianceWh: number,
  panelEfficiency: number = solarSystemConstants.panelEfficiency,
  systemLosses: number = solarSystemConstants.systemLosses
): number[] {
  // Validate input parameters
  if (installationSizeKW < 1 || installationSizeKW > 50) {
    throw new Error('Installation size must be between 1kW and 50kW');
  }
  
  if (solarIrradiance.length !== 365) {
    throw new Error('Solar irradiance array must contain exactly 365 values');
  }

  return solarIrradiance.map(irradiance => {
    // The irradiance value is already normalized (0-1) from actual GHI data
    // GHI data already accounts for daylight hours, sun angle, and seasonal variations
    
    // Convert back to actual GHI (kWh/m²/day) using location-specific maximum
    const dailyGhiKWh = (irradiance * maxIrradianceWh) / solarSystemConstants.wattsToKilowatts; // Convert Wh to kWh per m²/day
    
    // Calculate panel area from installation size
    const panelAreaM2 = (installationSizeKW * solarSystemConstants.wattsToKilowatts) / solarSystemConstants.panelPowerDensityWPerM2; // Convert kW to W, then to m²
    
    // Calculate raw generation: GHI × Panel Area × Panel Efficiency
    const rawGeneration = dailyGhiKWh * panelAreaM2 * panelEfficiency;
    
    // Apply system losses (inverter efficiency, wiring losses, etc.)
    const finalGeneration = rawGeneration * (1 - systemLosses);
    
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
  if (dailyConsumption.length !== dailyGeneration.length) {
    throw new Error('Consumption and generation arrays must have the same length');
  }

  return dailyConsumption.map((consumption, index) => {
    const generation = dailyGeneration[index];
    const netEnergy = generation - consumption;
    return Math.round(netEnergy * 100) / 100; // Round to 2 decimal places
  });
}

/**
 * Calculate space requirements for solar installation
 * @param installationSizeKW - Size of solar installation in kilowatts
 * @param spacePerKW - Space required per kW in square meters (default: 7m²)
 * @returns Object containing space requirements in different units
 */
export function calculateSpaceRequirements(
  installationSizeKW: number,
  spacePerKW: number = solarSystemConstants.spacePerKW
): {
  squareMeters: number;
  squareFeet: number;
  approximatePanels: number;
  roofPercentage: number;
} {
  // Validate installation size
  if (installationSizeKW < 1 || installationSizeKW > 50) {
    throw new Error('Installation size must be between 1kW and 50kW');
  }

  const squareMeters = installationSizeKW * spacePerKW;
  const squareFeet = squareMeters * solarSystemConstants.squareMetersToSquareFeet; // Convert m² to ft²
  
  // Estimate number of panels
  const approximatePanels = Math.ceil((installationSizeKW * solarSystemConstants.wattsToKilowatts) / solarSystemConstants.individualPanelWattage);
  
  // Estimate roof percentage
  const roofPercentage = (squareMeters / solarSystemConstants.averageRoofSizeM2) * 100;

  return {
    squareMeters: Math.round(squareMeters * 10) / 10,
    squareFeet: Math.round(squareFeet * 10) / 10,
    approximatePanels,
    roofPercentage: Math.round(roofPercentage * 10) / 10
  };
}

/**
 * Validate installation size is within acceptable range
 * @param installationSizeKW - Size to validate
 * @returns Object with validation result and any error message
 */
export function validateInstallationSize(installationSizeKW: number): {
  isValid: boolean;
  errorMessage?: string;
  warnings?: string[];
} {
  const warnings: string[] = [];

  // Check if it's a valid number
  if (isNaN(installationSizeKW) || installationSizeKW <= 0) {
    return {
      isValid: false,
      errorMessage: 'Installation size must be a positive number'
    };
  }

  // Check range limits
  if (installationSizeKW < 1) {
    return {
      isValid: false,
      errorMessage: 'Installation size must be at least 1kW'
    };
  }

  if (installationSizeKW > 50) {
    return {
      isValid: false,
      errorMessage: 'Installation size cannot exceed 50kW for this application'
    };
  }

  // Add warnings for edge cases
  if (installationSizeKW < 3) {
    warnings.push('Small installations may have higher per-kW costs');
  }

  if (installationSizeKW > 30) {
    warnings.push('Large installations may require special electrical upgrades');
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Calculate annual summary statistics
 * @param dailyConsumption - Array of daily consumption values
 * @param dailyGeneration - Array of daily generation values
 * @returns Summary statistics for the year
 */
export function calculateAnnualSummary(
  dailyConsumption: number[],
  dailyGeneration: number[]
): {
  totalConsumption: number;
  totalGeneration: number;
  netEnergy: number;
  selfSufficiencyPercentage: number;
  surplusDays: number;
  deficitDays: number;
  averageDailyConsumption: number;
  averageDailyGeneration: number;
} {
  const totalConsumption = dailyConsumption.reduce((sum, val) => sum + val, 0);
  const totalGeneration = dailyGeneration.reduce((sum, val) => sum + val, 0);
  const netEnergy = totalGeneration - totalConsumption;
  
  const netEnergyDaily = calculateNetEnergy(dailyConsumption, dailyGeneration);
  const surplusDays = netEnergyDaily.filter(net => net > 0).length;
  const deficitDays = netEnergyDaily.filter(net => net < 0).length;
  
  // Self-sufficiency: how much of consumption is met by generation
  const selfSufficiencyPercentage = Math.min((totalGeneration / totalConsumption) * 100, 100);

  return {
    totalConsumption: Math.round(totalConsumption * 100) / 100,
    totalGeneration: Math.round(totalGeneration * 100) / 100,
    netEnergy: Math.round(netEnergy * 100) / 100,
    selfSufficiencyPercentage: Math.round(selfSufficiencyPercentage * 10) / 10,
    surplusDays,
    deficitDays,
    averageDailyConsumption: Math.round((totalConsumption / 365) * 100) / 100,
    averageDailyGeneration: Math.round((totalGeneration / 365) * 100) / 100
  };
}

/**
 * Helper function to get monthly aggregated data for charting
 * @param dailyData - Array of daily values
 * @returns Array of monthly totals
 */
export function aggregateToMonthly(dailyData: number[]): number[] {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const monthlyData: number[] = [];
  
  let dayIndex = 0;
  
  for (let month = 0; month < 12; month++) {
    let monthlyTotal = 0;
    const days = daysInMonth[month];
    
    for (let day = 0; day < days && dayIndex < dailyData.length; day++) {
      monthlyTotal += dailyData[dayIndex];
      dayIndex++;
    }
    
    monthlyData.push(Math.round(monthlyTotal * 100) / 100);
  }
  
  return monthlyData;
}

/**
 * Get daily solar radiation data for the current location
 * @param solarIrradiance - Array of 365 daily irradiance multipliers (0-1)
 * @param maxIrradianceWh - Maximum irradiance value in Wh/m²/day for this location
 * @returns Array of 365 daily solar radiation values in kWh/m²/day
 */
export function getDailySolarRadiation(solarIrradiance: number[], maxIrradianceWh: number): number[] {
  return calculateSolarRadiation(solarIrradiance, maxIrradianceWh);
}

/**
 * Main calculation function that combines all calculations for a given installation size
 * This is the primary function that components will use
 * @param installationSizeKW - Size of solar installation in kilowatts
 * @param dailyConsumption - Array of daily consumption values in kWh
 * @param solarIrradiance - Array of 365 daily irradiance multipliers (0-1)
 * @param maxIrradianceWh - Maximum irradiance value in Wh/m²/day for this location
 * @returns Complete calculation results including solar radiation
 */
export function calculateSolarSystem(
  installationSizeKW: number,
  dailyConsumption: number[],
  solarIrradiance: number[],
  maxIrradianceWh: number
) {
  // Validate installation size
  const validation = validateInstallationSize(installationSizeKW);
  if (!validation.isValid) {
    throw new Error(validation.errorMessage);
  }

  // Validate input data
  if (!Array.isArray(dailyConsumption) || dailyConsumption.length !== 365) {
    throw new Error('Daily consumption must be an array of 365 values');
  }

  if (!Array.isArray(solarIrradiance) || solarIrradiance.length !== 365) {
    throw new Error('Solar irradiance must be an array of 365 values');
  }

  if (typeof maxIrradianceWh !== 'number' || maxIrradianceWh <= 0) {
    throw new Error('Maximum irradiance must be a positive number');
  }

  // Perform all calculations
  const dailyGeneration = calculateDailyGeneration(
    installationSizeKW,
    solarIrradiance,
    maxIrradianceWh,
    solarSystemConstants.panelEfficiency,
    solarSystemConstants.systemLosses
  );

  const solarRadiation = calculateSolarRadiation(solarIrradiance, maxIrradianceWh);
  
  const netEnergy = calculateNetEnergy(dailyConsumption, dailyGeneration);
  const spaceRequirements = calculateSpaceRequirements(installationSizeKW);
  const annualSummary = calculateAnnualSummary(dailyConsumption, dailyGeneration);

  return {
    installationSize: installationSizeKW,
    dailyGeneration,
    solarRadiation,
    netEnergy,
    spaceRequirements,
    annualSummary,
    validation
  };
}
