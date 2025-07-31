import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
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
  chartExpanded?: boolean;
  onToggleChartExpanded?: () => void;
}

interface ChartDataPoint {
  month: string;
  consumptionGrid?: number;
  consumptionSolar?: number;
  consumptionBattery?: number;
  exportedSolar?: number;
  unusedSolar?: number;
  totalConsumption?: number;
  generationSolar?: number;
}

/**
 * EnergyChart Component
 * Displays daily consumption and solar generation data with dual y-axis
 * Shows net energy calculation and uses color coding for surplus/deficit days
 */

const EnergyChart: React.FC<EnergyChartProps> = ({
  energyCalculations, 
  timePeriod = 'month', 
  chartExpanded = false, 
  onToggleChartExpanded 
}) => {
  const [localTimePeriod, setLocalTimePeriod] = React.useState<TimePeriod>(timePeriod);
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

  const effectiveTimePeriod = localTimePeriod;
  const aggregated = energyCalculations ? aggregateEnergyCalculationsToPeriod(energyCalculations, effectiveTimePeriod) : null;

  // Always aggregate daily values for surplus/deficit calculation
  const dailyAggregated = energyCalculations
    ? aggregateEnergyCalculationsToPeriod(energyCalculations, 'day')
    : null;
  // Helper to generate chart data for any period
  function makeChartData(
    aggregated: any,
    count: number,
    labelFn: (i: number) => string,
    hasStacked: boolean,
    hasConsumptionData: boolean,
    hasSolarData: boolean,
    tooltipLabelFn?: (i: number) => string
  ): ChartDataPoint[] {
    const data: ChartDataPoint[] = [];
    for (let i = 0; i < count; i++) {
      const dataPoint: ChartDataPoint = { month: labelFn(i) };
      // Add a tooltipLabel property for week/day
      if (tooltipLabelFn) {
        (dataPoint as any).tooltipLabel = tooltipLabelFn(i);
      }
      if (hasStacked) {
        dataPoint.consumptionGrid = Math.round((aggregated.consumptionGrid?.[i]?.value || 0) * 100) / 100;
        dataPoint.consumptionSolar = Math.round((aggregated.consumptionSolar?.[i]?.value || 0) * 100) / 100;
        dataPoint.consumptionBattery = Math.round((aggregated.consumptionBattery?.[i]?.value || 0) * 100) / 100;
        dataPoint.exportedSolar = Math.round((aggregated.exportedSolar?.[i]?.value || 0) * 100) / 100;
        dataPoint.unusedSolar = Math.round((aggregated.unusedSolar?.[i]?.value || 0) * 100) / 100;
        // Always set totalConsumption if available
        if (aggregated.totalConsumption) {
          dataPoint.totalConsumption = Math.round((aggregated.totalConsumption[i]?.value || 0) * 100) / 100;
        }
      } else if (hasConsumptionData && aggregated.totalConsumption) {
        dataPoint.totalConsumption = Math.round((aggregated.totalConsumption[i]?.value || 0) * 100) / 100;
      } else if (hasSolarData) {
        if (aggregated.generationSolar) {
          dataPoint.generationSolar = Math.round((aggregated.generationSolar[i]?.value || 0) * 100) / 100;
        }
        if (aggregated.exportedSolar) {
          dataPoint.exportedSolar = Math.round((aggregated.exportedSolar[i]?.value || 0) * 100) / 100;
        }
        if (aggregated.unusedSolar) {
          dataPoint.unusedSolar = Math.round((aggregated.unusedSolar[i]?.value || 0) * 100) / 100;
        }
      }
      data.push(dataPoint);
    }
    return data;
  }

  let chartData: ChartDataPoint[] = [];
  if (effectiveTimePeriod === 'month' && aggregated) {
    chartData = makeChartData(
      aggregated,
      12,
      i => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      hasStacked,
      hasConsumptionData,
      hasSolarData
    );
  } else if (effectiveTimePeriod === 'week' && aggregated) {
    const numWeeks = Array.isArray(aggregated.totalConsumption) && aggregated.totalConsumption.length > 0
      ? aggregated.totalConsumption.length
      : (Array.isArray(aggregated.generationSolar) && aggregated.generationSolar.length > 0 ? aggregated.generationSolar.length : 52);
    chartData = makeChartData(
      aggregated,
      numWeeks,
      i => `${i + 1}`,
      hasStacked,
      hasConsumptionData,
      hasSolarData,
      i => `Week ${i + 1}`
    );
  } else if (effectiveTimePeriod === 'day' && aggregated) {
    const numDays = Array.isArray(aggregated.totalConsumption) && aggregated.totalConsumption.length > 0
      ? aggregated.totalConsumption.length
      : (Array.isArray(aggregated.generationSolar) && aggregated.generationSolar.length > 0 ? aggregated.generationSolar.length : 365);
    chartData = makeChartData(
      aggregated,
      numDays,
      i => `${i + 1}`,
      hasStacked,
      hasConsumptionData,
      hasSolarData,
      i => `Day ${i + 1}`
    );
  } else {
    chartData = [];
  }

  // Helper to format numbers with thousands separators
  const formatNumber = (num: number | undefined) =>
    typeof num === 'number' ? num.toLocaleString() : '';

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      // Use tooltipLabel if present, otherwise fallback to label
      const tooltipLabel = data.tooltipLabel || label;
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{tooltipLabel}</p>
          {typeof data.consumptionGrid === 'number' && (
            <p className="tooltip-consumption"><span style={{ color: '#8884d8' }}>●</span>&nbsp;Grid: {formatNumber(data.consumptionGrid)} kWh</p>
          )}
          {typeof data.consumptionSolar === 'number' && (
            <p className="tooltip-consumption"><span style={{ color: '#82ca9d' }}>●</span>&nbsp;Solar: {formatNumber(data.consumptionSolar)} kWh</p>
          )}
          {typeof data.consumptionBattery === 'number' && (
            <p className="tooltip-consumption"><span style={{ color: '#FFD700' }}>●</span>&nbsp;Battery: {formatNumber(data.consumptionBattery)} kWh</p>
          )}
          {typeof data.exportedSolar === 'number' && (
            <p className="tooltip-consumption"><span style={{ color: '#ff7300' }}>●</span>&nbsp;Exported: {formatNumber(data.exportedSolar)} kWh</p>
          )}
          {typeof data.unusedSolar === 'number' && (
            <p className="tooltip-consumption"><span style={{ color: '#A9A9A9' }}>●</span>&nbsp;Unused Solar: {formatNumber(data.unusedSolar)} kWh</p>
          )}
          {typeof data.totalConsumption === 'number' && (
            <p className="tooltip-consumption"><span style={{ color: '#0057b8' }}>●</span>&nbsp;Consumption: {formatNumber(data.totalConsumption)} kWh</p>
          )}
          {typeof data.generationSolar === 'number' && (
            <p className="tooltip-consumption"><span style={{ color: '#0057b8' }}>●</span>&nbsp;Total Generated: {formatNumber(data.generationSolar)} kWh</p>
          )}
        </div>
      );
    }
    return null;
  };

  // --- Summary stats logic (using daily aggregated values only) ---
  const dailyGeneration = Array.isArray(dailyAggregated?.generationSolar) ? dailyAggregated.generationSolar : [];
  const dailyConsumption = Array.isArray(dailyAggregated?.totalConsumption) ? dailyAggregated.totalConsumption : [];
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
      <div className="chart-header chart-header-rel">
        <h2 className="chart-title-inline">Energy Flows</h2>
        <select
          value={localTimePeriod}
          onChange={e => setLocalTimePeriod(e.target.value as TimePeriod)}
          className="chart-period-select"
          aria-label="Select time period"
        >
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
        {onToggleChartExpanded && (
          <button
            onClick={onToggleChartExpanded}
            className="chart-expand-button"
            aria-label={chartExpanded ? "Hide controls" : "Show controls"}
            title={chartExpanded ? "Hide controls" : "Show controls"}
          >
            {chartExpanded ? '–' : '⛶'}
          </button>
        )}
        <div className="chart-summary">
          {hasDailyGeneration && (
            <div className="summary-item">
              <span className="summary-label">Annual Generation:</span>
              <span className="summary-value">{formatNumber(Math.round(totalGeneration))} kWh</span>
            </div>
          )}
          {hasDailyConsumption && (
            <div className="summary-item">
              <span className="summary-label">Annual Consumption:</span>
              <span className="summary-value">{formatNumber(Math.round(totalConsumption))} kWh</span>
            </div>
          )}
          {hasDailyGeneration && hasDailyConsumption && (
            <>
              <div className="summary-item">
                <span className="summary-label">Net Energy:</span>
                <span className={`summary-value ${netEnergy >= 0 ? 'surplus' : 'deficit'}`}>{netEnergy >= 0 ? '+' : ''}{formatNumber(Math.round(netEnergy))} kWh</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Surplus Days:</span>
                <span className="summary-value surplus">{formatNumber(surplusDays)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Deficit Days:</span>
                <span className="summary-value deficit">{formatNumber(deficitDays)}</span>
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
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#ccc' }}
              label={{
                value:
                  timePeriod === 'month'
                    ? 'Month'
                    : timePeriod === 'week'
                    ? 'Week'
                    : timePeriod === 'day'
                    ? 'Day'
                    : '',
                position: 'insideBottom',
                offset: -5,
                fontSize: 14
              }}
            />
            <YAxis label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 12 }} axisLine={{ stroke: '#ccc' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '10px' }} />
            {/* Stacked bars for all flows if both data sets exist */}
            {hasStacked && (
              <>
                <Bar dataKey="consumptionGrid" stackId="a" fill="#8884d8" name="Grid Consumption" />
                <Bar dataKey="consumptionSolar" stackId="a" fill="#82ca9d" name="Solar Used" />
                <Bar dataKey="consumptionBattery" stackId="a" fill="#FFD700" name="Battery Consumption" />
                <Bar dataKey="exportedSolar" stackId="a" fill="#ff7300" name="Exported Solar" />
                <Bar dataKey="unusedSolar" stackId="a" fill="#A9A9A9" name="Unused Solar" />
              </>
            )}
            {/* Only total consumption as bar (when not stacked) */}
            {!hasStacked && hasConsumptionData && (
              <Bar dataKey="totalConsumption" fill="#8884d8" name="Total Consumption" />
            )}
            {/* Only solar data: show exported + unused as stacked bar and total as line */}
            {!hasStacked && !hasConsumptionData && hasSolarData && (
              <>
                <Bar dataKey="exportedSolar" stackId="solarOnly" fill="#ff7300" name="Exported Solar" />
                <Bar dataKey="unusedSolar" stackId="solarOnly" fill="#A9A9A9" name="Unused Solar" />
                <Line type="monotone" dataKey="generationSolar" stroke="#0057b8" strokeWidth={2} dot={false} name="Total Generated" />
              </>
            )}
            {/* Show totalConsumption as a line only when stacked (i.e., both solar and consumption data are present) */}
            {hasStacked && hasConsumptionData && (
              <Line type="monotone" dataKey="totalConsumption" stroke="#0057b8" strokeWidth={2} dot={false} name="Total Consumption" />
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
