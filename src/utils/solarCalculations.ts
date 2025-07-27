import { solarSystemConstants } from '../config/solarConstants.js';
import type { EnergyCalculations, EnergySystemDetails } from '../types/index.js';

/**
 * Solar calculation utilities for the solar energy application
 * These functions handle the core solar energy calculations
 */

export function calculateSolarGeneration(installationSize: number, rawSolarIrradiance: number): number {
  const ghiKWh = rawSolarIrradiance / solarSystemConstants.wattsToKilowatts;
  
  // Calculate panel area from installation size
  const panelAreaM2 = (installationSize * solarSystemConstants.wattsToKilowatts) / solarSystemConstants.panelPowerDensityWPerM2; // Convert kW to W, then to m²
  
  // Calculate raw generation: GHI × Panel Area × Panel Efficiency
  const rawGeneration = ghiKWh * panelAreaM2 * solarSystemConstants.panelEfficiency;
  
  // Apply system losses (inverter efficiency, wiring losses, etc.)
  const finalGeneration = rawGeneration * (1 - solarSystemConstants.systemLosses);
  
  return Math.round(finalGeneration * 100) / 100; // Round to 2 decimal places
}

export function calculateConsumptionData(energyCalculations: EnergyCalculations, systemDetails: EnergySystemDetails): EnergyCalculations {
  // Implement the consumption data calculations based on the provided energy calculations and system details
  if (!energyCalculations || !systemDetails) {
    console.log('Energy calculations and system details are required');
    return energyCalculations;
  }
  if (!energyCalculations.generationSolar || !energyCalculations.totalConsumption) {
    console.log('generationSolar and totalConsumption arrays are required');
    return energyCalculations;
  }

  const {
    batteryCapacity = 0,
    peakCost,
    offPeakCost,
    feedInTariff
  } = systemDetails;
  let batteryLevel = 0; // in kWh

  energyCalculations.exportedSolar = [];
  energyCalculations.consumptionGrid = [];
  energyCalculations.consumptionSolar = [];
  energyCalculations.consumptionBattery = [];
  energyCalculations.consumptionCost = [];
  energyCalculations.nonSolarConsumptionCost = [];

  for (let i = 0; i < energyCalculations.totalConsumption.length; i++) {
    const consumptionEntry = energyCalculations.totalConsumption[i];
    const solarEntry = energyCalculations.generationSolar[i];
    const date = consumptionEntry.date;
    let consumption = consumptionEntry.value; // kWh
    let solar = solarEntry ? solarEntry.value : 0; // kWh

    // 1. Use solar to meet consumption
    const usedSolar = Math.min(consumption, solar);
    energyCalculations.consumptionSolar.push({ date, value: usedSolar });
    consumption -= usedSolar;
    solar -= usedSolar;

    // 2. Use battery to meet remaining consumption
    let usedBattery = 0;
    if (batteryCapacity > 0 && consumption > 0 && batteryLevel > 0) {
      usedBattery = Math.min(consumption, batteryLevel);
      batteryLevel -= usedBattery;
      consumption -= usedBattery;
    }
    energyCalculations.consumptionBattery.push({ date, value: usedBattery });

    // 3. Use grid for any remaining consumption
    let usedGrid = 0;
    if (consumption > 0) {
      usedGrid = consumption;
      consumption = 0;
    }
    energyCalculations.consumptionGrid.push({ date, value: usedGrid });

    // 4. Use excess solar to charge battery (up to capacity)
    let chargedToBattery = 0;
    if (batteryCapacity > 0 && solar > 0 && batteryLevel < batteryCapacity) {
      chargedToBattery = Math.min(solar, batteryCapacity - batteryLevel);
      batteryLevel += chargedToBattery;
      solar -= chargedToBattery;
    }

    // 5. If excess solar remains after battery is full, export solar to grid
    energyCalculations.exportedSolar.push({ date, value: solar });

    // 6. Cost/rebate calculation
    // Determine if this period is peak (2pm-8pm local time)
    const hour = new Date(date).getHours();
    const isPeak = hour >= 14 && hour < 20;
    const rate = (isPeak ? peakCost : (offPeakCost || peakCost)) || 0;
    let cost = 0;
    // Only pay for positive grid import
    if (energyCalculations.consumptionGrid[i].value > 0) {
      cost += energyCalculations.consumptionGrid[i].value * rate;
    }
    // Rebate for export
    if (feedInTariff && energyCalculations.exportedSolar[i].value > 0) {
      cost -= energyCalculations.exportedSolar[i].value * feedInTariff;
    }
    energyCalculations.consumptionCost.push(cost);
    energyCalculations.nonSolarConsumptionCost.push(energyCalculations.totalConsumption[i].value * rate);
  }

  return energyCalculations;
}