import React from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { EnergyCalculations, TimePeriod } from '../types/index';
import { aggregateEnergyCalculationsToPeriod } from '../utils/chartUtils';
import './EnergyChart.css';

interface EnergyChartProps {
  energyCalculations: EnergyCalculations | null;
  timePeriod?: TimePeriod;
}

interface ChartDataPoint {
  month: string;
  consumptionGrid?: number;
  consumptionSolar?: number;
  consumptionBattery?: number;
  exportedSolar?: number;
  totalConsumption?: number;
  generationSolar?: number;
}

/**
 * EnergyChart Component
 * Displays daily consumption and solar generation data with dual y-axis
 * Shows net energy calculation and uses color coding for surplus/deficit days
 */


const EnergyChart: React.FC<EnergyChartProps> = ({ energyCalculations, timePeriod = 'day' }) => {
  const hasConsumptionData = Array.isArray(energyCalculations?.totalConsumption) && energyCalculations.totalConsumption.length > 0;
  const hasSolarData = Array.isArray(energyCalculations?.generationSolar) && energyCalculations.generationSolar.length > 0;
  const hasStacked =
    hasConsumptionData &&
    hasSolarData &&
    Array.isArray(energyCalculations?.consumptionGrid) && energyCalculations.consumptionGrid.length > 0 &&
    Array.isArray(energyCalculations?.consumptionSolar) && energyCalculations.consumptionSolar.length > 0 &&
    Array.isArray(energyCalculations?.consumptionBattery) && energyCalculations.consumptionBattery.length > 0 &&
    Array.isArray(energyCalculations?.exportedSolar) && energyCalculations.exportedSolar.length > 0;
  if (!hasConsumptionData && !hasSolarData) {
    return null;
  }

  const aggregated = energyCalculations ? aggregateEnergyCalculationsToPeriod(energyCalculations, timePeriod) : null;
  const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayIndex = 0;
  const chartData: ChartDataPoint[] = [];

  for (let month = 0; month < 12; month++) {
    const daysInMonth = daysPerMonth[month];
    const startDay = dayIndex;
    const endDay = Math.min(dayIndex + daysInMonth, 365);

    // Stacked case
    if (hasStacked && aggregated) {
      let consumptionGrid = 0, consumptionSolar = 0, consumptionBattery = 0, exportedSolar = 0;
      for (let day = startDay; day < endDay; day++) {
        consumptionGrid += aggregated.consumptionGrid?.[day]?.value || 0;
        consumptionSolar += aggregated.consumptionSolar?.[day]?.value || 0;
        consumptionBattery += aggregated.consumptionBattery?.[day]?.value || 0;
        exportedSolar += aggregated.exportedSolar?.[day]?.value || 0;
      }
      chartData.push({
        month: shortMonthNames[month],
        consumptionGrid: Math.round(consumptionGrid * 100) / 100,
        consumptionSolar: Math.round(consumptionSolar * 100) / 100,
        consumptionBattery: Math.round(consumptionBattery * 100) / 100,
        exportedSolar: Math.round(exportedSolar * 100) / 100
      });
    } else if (hasConsumptionData && aggregated?.totalConsumption) {
      // Only consumption
      let totalConsumption = 0;
      for (let day = startDay; day < endDay; day++) {
        totalConsumption += aggregated.totalConsumption[day]?.value || 0;
      }
      chartData.push({
        month: shortMonthNames[month],
        totalConsumption: Math.round(totalConsumption * 100) / 100
      });
    } else if (hasSolarData && aggregated?.generationSolar) {
      // Only solar
      let generationSolar = 0;
      for (let day = startDay; day < endDay; day++) {
        generationSolar += aggregated.generationSolar[day]?.value || 0;
      }
      chartData.push({
        month: shortMonthNames[month],
        generationSolar: Math.round(generationSolar * 100) / 100
      });
    }
    dayIndex += daysInMonth;
  }

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{`${label}`}</p>
          {typeof data.consumptionGrid === 'number' && (
            <p className="tooltip-consumption"><span style={{ color: '#8884d8' }}>●</span>&nbsp;Grid: {data.consumptionGrid} kWh</p>
          )}
          {typeof data.consumptionSolar === 'number' && (
            <p className="tooltip-consumption"><span style={{ color: '#82ca9d' }}>●</span>&nbsp;Solar Used: {data.consumptionSolar} kWh</p>
          )}
          {typeof data.consumptionBattery === 'number' && (
            <p className="tooltip-consumption"><span style={{ color: '#FFD700' }}>●</span>&nbsp;Battery: {data.consumptionBattery} kWh</p>
          )}
          {typeof data.exportedSolar === 'number' && (
            <p className="tooltip-consumption"><span style={{ color: '#ff7300' }}>●</span>&nbsp;Exported: {data.exportedSolar} kWh</p>
          )}
          {typeof data.totalConsumption === 'number' && (
            <p className="tooltip-consumption"><span style={{ color: '#8884d8' }}>●</span>&nbsp;Consumption: {data.totalConsumption} kWh</p>
          )}
          {typeof data.generationSolar === 'number' && (
            <p className="tooltip-consumption"><span style={{ color: '#82ca9d' }}>●</span>&nbsp;Generation: {data.generationSolar} kWh</p>
          )}
        </div>
      );
    }
    return null;
  };

  // --- Summary stats logic (using aggregated daily values) ---
  const dailyGeneration = Array.isArray(aggregated?.generationSolar) ? aggregated.generationSolar : [];
  const dailyConsumption = Array.isArray(aggregated?.totalConsumption) ? aggregated.totalConsumption : [];
  const hasDailyGeneration = dailyGeneration.length > 0;
  const hasDailyConsumption = dailyConsumption.length > 0;
  const totalGeneration = hasDailyGeneration ? dailyGeneration.reduce((sum, e) => sum + (e.value || 0), 0) : 0;
  const totalConsumption = hasDailyConsumption ? dailyConsumption.reduce((sum, e) => sum + (e.value || 0), 0) : 0;
  const netEnergy = hasDailyGeneration && hasDailyConsumption ? totalGeneration - totalConsumption : 0;
  // Surplus/deficit days: only if both exist
  let surplusDays = 0, deficitDays = 0;
  if (hasDailyGeneration && hasDailyConsumption) {
    const minDays = Math.min(dailyGeneration.length, dailyConsumption.length);
    for (let i = 0; i < minDays; i++) {
      const net = (dailyGeneration[i]?.value || 0) - (dailyConsumption[i]?.value || 0);
      if (net > 0) surplusDays++;
      else deficitDays++;
    }
  }

  return (
    <div className="energy-chart-container">
      <div className="chart-header">
        <h2>Monthly Energy Flows</h2>
        <div className="chart-summary">
          {hasDailyGeneration && (
            <div className="summary-item">
              <span className="summary-label">Annual Generation:</span>
              <span className="summary-value">{Math.round(totalGeneration)} kWh</span>
            </div>
          )}
          {hasDailyConsumption && (
            <div className="summary-item">
              <span className="summary-label">Annual Consumption:</span>
              <span className="summary-value">{Math.round(totalConsumption)} kWh</span>
            </div>
          )}
          {hasDailyGeneration && hasDailyConsumption && (
            <>
              <div className="summary-item">
                <span className="summary-label">Net Energy:</span>
                <span className={`summary-value ${netEnergy >= 0 ? 'surplus' : 'deficit'}`}>{netEnergy >= 0 ? '+' : ''}{Math.round(netEnergy)} kWh</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Surplus Days:</span>
                <span className="summary-value surplus">{surplusDays}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Deficit Days:</span>
                <span className="summary-value deficit">{deficitDays}</span>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={{ stroke: '#ccc' }} />
            <YAxis label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 12 }} axisLine={{ stroke: '#ccc' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '10px' }} />
            {/* Stacked bars for all flows if both data sets exist */}
            {hasStacked && (
              <>
                <Bar dataKey="consumptionGrid" stackId="a" fill="#8884d8" name="Grid Consumption" />
                <Bar dataKey="consumptionSolar" stackId="a" fill="#82ca9d" name="Solar Used" />
                <Bar dataKey="consumptionBattery" stackId="a" fill="#FFD700" name="Battery Consumption" />
                <Bar dataKey="exportedSolar" stackId="a" fill="#ff7300" name="Exported Solar" />
              </>
            )}
            {/* Only total consumption */}
            {!hasStacked && hasConsumptionData && (
              <Bar dataKey="totalConsumption" fill="#8884d8" name="Total Consumption" />
            )}
            {/* Only solar generation */}
            {!hasStacked && !hasConsumptionData && hasSolarData && (
              <Bar dataKey="generationSolar" fill="#82ca9d" name="Solar Generation" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {/* <div style={{ clear: 'both' }}></div>
      <div className="chart-legend-extended">
        {hasStacked && (
          <>
            <div className="legend-item"><div className="legend-color" style={{ backgroundColor: '#8884d8' }}></div><span>Grid Consumption</span></div>
            <div className="legend-item"><div className="legend-color" style={{ backgroundColor: '#82ca9d' }}></div><span>Solar Used</span></div>
            <div className="legend-item"><div className="legend-color" style={{ backgroundColor: '#FFD700' }}></div><span>Battery Consumption</span></div>
            <div className="legend-item"><div className="legend-color" style={{ backgroundColor: '#ff7300' }}></div><span>Exported Solar</span></div>
          </>
        )}
        {!hasStacked && hasConsumptionData && (
          <div className="legend-item"><div className="legend-color" style={{ backgroundColor: '#8884d8' }}></div><span>Total Consumption</span></div>
        )}
        {!hasStacked && !hasConsumptionData && hasSolarData && (
          <div className="legend-item"><div className="legend-color" style={{ backgroundColor: '#82ca9d' }}></div><span>Solar Generation</span></div>
        )}
      </div> */}
    </div>
  );
};

export default EnergyChart;
