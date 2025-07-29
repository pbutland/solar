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
  periodInMinutes?: number;
  generationSolar?: EnergyPeriodEntry[];
  exportedSolar?: EnergyPeriodEntry[];
  unusedSolar?: EnergyPeriodEntry[];
  consumptionGrid?: EnergyPeriodEntry[];
  consumptionSolar?: EnergyPeriodEntry[];
  consumptionBattery?: EnergyPeriodEntry[];
  totalConsumption?: EnergyPeriodEntry[];
  consumptionCost?: number[];
  originalConsumptionCost?: number[];
}

export interface EnergySystemDetails {
  installationSize?: number;
  batteryCapacity?: number;
  rawSolarIrradiance?: EnergyPeriodEntry[];
  peakCost?: number | null;
  offPeakCost?: number | null;
  feedInTariff?: number | null;
  exportLimit?: number | null;
}

export interface FinancialSummary {
  installationCost?: number;
  savings?: number;
  paybackPeriod?: number;
  returnOnInvestment?: number;
}

export type TimePeriod = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';