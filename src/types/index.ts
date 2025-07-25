/**
 * Shared TypeScript interfaces and types for the solar energy application
 */

/**
 * Energy usage entry representing a single period of energy consumption/generation
 */
export interface EnergyPeriodEntry {
  /** Date string in ISO format (YYYY-MM-DDTHH:mm) */
  date: string;
  /** Energy consumption/generation in kWh */
  value: number;
}

export interface EnergyData {
  periodInMinutes: number;
  values: EnergyPeriodEntry[];
}

export interface EnergyCalculations {
  periodInMinutes?: number; // Period in minutes for the energy data
  generationSolar?: EnergyPeriodEntry[]; // Solar generation data
  consumptionGrid?: EnergyPeriodEntry[]; // Energy grid consumption data
  consumptionSolar?: EnergyPeriodEntry[]; // Energy solar consumption data
  consumptionBattery?: EnergyPeriodEntry[]; // Energy battery consumption data
  totalConsumption?: EnergyPeriodEntry[]; // Total energy consumption data
  consumptionCost?: number[]; // Cost of energy consumption
}

export type TimePeriod = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';