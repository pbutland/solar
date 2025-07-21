/**
 * Solar System Configuration Constants
 * 
 * This file contains all the physical and technical constants used in solar
 * energy calculations throughout the application.
 */

/**
 * Interface defining the structure of solar system constants
 */
export interface SolarSystemConstants {
  /** Panel efficiency as a decimal (e.g., 0.2 = 20%) */
  panelEfficiency: number;
  
  /** System losses as a decimal (e.g., 0.15 = 15%) - accounts for inverter losses, wiring, etc. */
  systemLosses: number;
  
  /** Space requirement in square meters per kW of installed capacity */
  spacePerKW: number;
  
  /** Panel power density in watts per square meter */
  panelPowerDensityWPerM2: number;
  
  /** Individual panel wattage in watts */
  individualPanelWattage: number;
  
  /** Average roof size in square meters for typical residential installation */
  averageRoofSizeM2: number;
  
  /** Conversion factor from square meters to square feet */
  squareMetersToSquareFeet: number;
  
  /** Conversion factor from watts to kilowatts */
  wattsToKilowatts: number;
}

/**
 * Solar system constants with industry-standard values
 */
export const solarSystemConstants: SolarSystemConstants = {
  // Panel efficiency constant (300% - appears to be calibrated for GHI data)
  // Note: This value seems unusually high but matches the original implementation
  panelEfficiency: 3,
  
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
