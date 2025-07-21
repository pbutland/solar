/**
 * Shared TypeScript interfaces and types for the solar energy application
 */

/**
 * Geographic location interface
 */
export interface Location {
  /** Human-readable location name */
  name: string;
  /** Latitude coordinate */
  lat: number;
  /** Longitude coordinate */
  lng: number;
}

/**
 * Energy usage entry from CSV data
 */
export interface EnergyUsageEntry {
  /** Date string in ISO format (YYYY-MM-DD) */
  date: string;
  /** Total energy consumption in kWh */
  total: number;
}

/**
 * Processed data structure used throughout the application
 */
export interface ProcessedData {
  /** Daily energy consumption for 365 days in kWh (optional - may not be available) */
  dailyConsumption?: number[];
  /** Solar irradiance values for 365 days (normalized 0-1 range) */
  solarIrradiance?: number[];
}

// Re-export solar system constants interface
export type { SolarSystemConstants } from '../config/solarConstants.js';
