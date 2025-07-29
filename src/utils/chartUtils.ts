
import type { EnergyCalculations, TimePeriod, EnergyPeriodEntry } from '../types/index';

/**
 * Aggregates all EnergyPeriodEntry[] arrays in an EnergyCalculations object to the specified TimePeriod.
 * Throws if requested TimePeriod granularity is greater than the data's periodInMinutes.
 * @param calculations - The input EnergyCalculations object
 * @param timePeriod - The desired aggregation period
 * @returns Aggregated EnergyCalculations
 */
export function aggregateEnergyCalculationsToPeriod(
  calculations: EnergyCalculations,
  timePeriod: TimePeriod
): EnergyCalculations {
  const periodMap: Record<TimePeriod, number> = {
    minute: 1,
    hour: 60,
    day: 1440,
    week: 10080,
    month: 43200, // 30 days
    year: 525600 // 365 days
  };
  const targetPeriod = periodMap[timePeriod];
  if (!targetPeriod) throw new Error(`Unknown TimePeriod: ${timePeriod}`);

  // Helper to aggregate a single array
  function aggregateArray(
    entries: EnergyPeriodEntry[] | undefined,
    periodInMinutes: number | undefined
  ): EnergyPeriodEntry[] | undefined {
    if (!entries || !periodInMinutes) return entries;
    if (targetPeriod < periodInMinutes) {
      throw new Error(
        `Cannot aggregate to a finer period (${timePeriod}) than data granularity (${periodInMinutes} min)`
      );
    }
    if (targetPeriod === periodInMinutes) {
      return entries;
    }
    const aggregated: EnergyPeriodEntry[] = [];
    let block: EnergyPeriodEntry[] = [];
    let blockStart: Date | null = null;
    for (const entry of entries) {
      const entryDate = new Date(entry.date);
      if (!blockStart) {
        blockStart = entryDate;
      }
      block.push(entry);
      const blockElapsed = (entryDate.getTime() - blockStart.getTime()) / 60000; // minutes
      if (blockElapsed >= targetPeriod - periodInMinutes) {
        const sum = block.reduce((acc, e) => acc + e.value, 0);
        aggregated.push({ date: blockStart.toISOString(), value: sum });
        block = [];
        blockStart = null;
      }
    }
    if (block.length > 0 && blockStart) {
      const sum = block.reduce((acc, e) => acc + e.value, 0);
      aggregated.push({ date: blockStart.toISOString(), value: sum });
    }
    return aggregated;
  }

  // Aggregate all relevant arrays in the object
  const periodInMinutes = calculations.periodInMinutes;
  return {
    ...calculations,
    periodInMinutes: targetPeriod,
    exportedSolar: aggregateArray(calculations.exportedSolar, periodInMinutes),
    unusedSolar: aggregateArray(calculations.unusedSolar, periodInMinutes),
    generationSolar: aggregateArray(calculations.generationSolar, periodInMinutes),
    consumptionGrid: aggregateArray(calculations.consumptionGrid, periodInMinutes),
    consumptionSolar: aggregateArray(calculations.consumptionSolar, periodInMinutes),
    consumptionBattery: aggregateArray(calculations.consumptionBattery, periodInMinutes),
    totalConsumption: aggregateArray(calculations.totalConsumption, periodInMinutes)
    // consumptionCost is left unchanged (number[])
  };
}
