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
import type { ProcessedData } from '../types/index.js';
import { calculateDailyGeneration, calculateNetEnergy, calculateSolarRadiation } from '../utils/solarCalculations';
import type { SolarIrradianceData } from '../services/solarIrradianceService.js';
import './EnergyChart.css';

interface EnergyChartProps {
  installationSizeKW: number;
  uploadedData: ProcessedData | null;
  solarIrradiance: SolarIrradianceData | null;
}

interface ChartDataPoint {
  day: number;
  month: string;
  consumption: number;
  generation: number;
  netEnergy: number;
}

/**
 * EnergyChart Component
 * Displays daily consumption and solar generation data with dual y-axis
 * Shows net energy calculation and uses color coding for surplus/deficit days
 */
const EnergyChart: React.FC<EnergyChartProps> = ({ installationSizeKW, uploadedData, solarIrradiance }) => {
  // Check what data is available
  const hasConsumptionData = uploadedData?.dailyConsumption && uploadedData.dailyConsumption.length > 0;
  const hasSolarData = solarIrradiance && solarIrradiance.normalizedValues.length === 365;
  
  // If no data is available, show a message
  if (!hasConsumptionData && !hasSolarData) {
    return (
      <div className="energy-chart">
        <div className="chart-header">
          <h2>Energy Analysis</h2>
          <p>Please select a location and upload your energy usage data to see the analysis.</p>
        </div>
      </div>
    );
  }
  
  // Calculate daily generation only if we have solar irradiance data
  const dailyGeneration = hasSolarData 
    ? calculateDailyGeneration(
        installationSizeKW, 
        solarIrradiance.normalizedValues, 
        solarIrradiance.maxIrradianceWh
      )
    : [];
  
  // Calculate solar radiation data for display
  const dailySolarRadiation = hasSolarData
    ? calculateSolarRadiation(solarIrradiance.normalizedValues, solarIrradiance.maxIrradianceWh)
    : [];
  
  // Calculate net energy only if we have both consumption and generation data
  const netEnergyData = hasConsumptionData && hasSolarData && uploadedData.dailyConsumption
    ? calculateNetEnergy(uploadedData.dailyConsumption, dailyGeneration)
    : [];

  // Month names for x-axis labels
  const shortMonthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Prepare chart data - aggregate values by month
  const chartData: ChartDataPoint[] = [];
  
  // Calculate days per month (approximate)
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayIndex = 0;
  
  for (let month = 0; month < 12; month++) {
    const daysInMonth = daysPerMonth[month];
    const startDay = dayIndex;
    const endDay = Math.min(dayIndex + daysInMonth, 365);
    
    let monthlyGeneration = 0;
    let monthlyConsumption = 0;
    let monthlyNetEnergy = 0;
    let monthlySolarRadiation = 0;
    for (let day = startDay; day < endDay; day++) {
      if (hasSolarData) {
        monthlyGeneration += dailyGeneration[day] || 0;
        monthlySolarRadiation += dailySolarRadiation[day] || 0;
      }
      if (hasConsumptionData && uploadedData.dailyConsumption) {
        monthlyConsumption += uploadedData.dailyConsumption[day] || 0;
        monthlyNetEnergy += netEnergyData[day] || 0;
      }
    }
    chartData.push({
      day: month + 1,
      month: shortMonthNames[month],
      consumption: hasConsumptionData ? Math.round(monthlyConsumption * 100) / 100 : 0,
      generation: hasSolarData ? Math.round(monthlyGeneration * 100) / 100 : 0,
      netEnergy: hasConsumptionData && hasSolarData ? Math.round(monthlyNetEnergy * 100) / 100 : 0
    });
    dayIndex += daysInMonth;
  }
  
  // Calculate summary statistics for display
  const totalGeneration = hasSolarData ? dailyGeneration.reduce((sum: number, val: number) => sum + val, 0) : 0;
  let totalConsumption = 0;
  let totalNetEnergy = 0;
  let surplusDays = 0;
  let deficitDays = 0;
  if (hasConsumptionData && uploadedData.dailyConsumption) {
    totalConsumption = uploadedData.dailyConsumption.reduce((sum: number, val: number) => sum + val, 0);
    totalNetEnergy = totalGeneration - totalConsumption;
    surplusDays = netEnergyData.filter((net: number) => net > 0).length;
    deficitDays = 365 - surplusDays;
  }

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{`${label}`}</p>
          {typeof data.consumption === 'number' && data.consumption !== 0 && (
            <p className="tooltip-consumption">
              <span style={{ color: '#8884d8' }}>●</span>
              {` Consumption: ${data.consumption} kWh`}
            </p>
          )}
          {typeof data.generation === 'number' && data.generation !== 0 && (
            <p className="tooltip-generation">
              <span style={{ color: '#82ca9d' }}>●</span>
              {` Generation: ${data.generation} kWh`}
            </p>
          )}
          {typeof data.netEnergy === 'number' && data.netEnergy !== 0 && (
            <p className="tooltip-net" style={{ 
              color: data.netEnergy >= 0 ? '#4CAF50' : '#F44336',
              fontWeight: 'bold'
            }}>
              {`Net: ${data.netEnergy >= 0 ? '+' : ''}${data.netEnergy} kWh`}
              {data.netEnergy >= 0 ? ' (Surplus)' : ' (Deficit)'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="energy-chart-container">
      <div className="chart-header">
        <h2>
          {hasConsumptionData ? 'Monthly Energy Analysis (Your Data)' : 
           hasSolarData ? 'Monthly Solar Generation (Select location for solar data)' : 
           'Energy Analysis'}
        </h2>
        <div className="chart-summary">
          {hasSolarData && (
            <div className="summary-item">
              <span className="summary-label">Annual Generation:</span>
              <span className="summary-value">{Math.round(totalGeneration)} kWh</span>
            </div>
          )}
          {hasConsumptionData && (
            <>
              <div className="summary-item">
                <span className="summary-label">Annual Consumption:</span>
                <span className="summary-value">{Math.round(totalConsumption)} kWh</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Net Energy:</span>
                <span className={`summary-value ${totalNetEnergy >= 0 ? 'surplus' : 'deficit'}`}>
                  {totalNetEnergy >= 0 ? '+' : ''}{Math.round(totalNetEnergy)} kWh
                </span>
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
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#ccc' }}
            />
            <YAxis 
              yAxisId="left"
              label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#ccc' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              label={{ value: 'Net Energy (kWh)', angle: 90, position: 'insideRight' }}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#ccc' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{ paddingBottom: '10px' }}
            />
            
            {/* Monthly solar generation bars (always shown) */}
            <Bar
              yAxisId="left"
              dataKey="generation"
              fill="#82ca9d"
              name="Monthly Generation"
              fillOpacity={0.7}
            />
            {/* Monthly consumption bars (only if usage data is available) */}
            {hasConsumptionData && (
              <Bar
                yAxisId="left"
                dataKey="consumption"
                fill="#8884d8"
                name="Monthly Consumption"
                fillOpacity={0.7}
              />
            )}
            {/* Net energy line (only if usage data is available) */}
            {hasConsumptionData && hasSolarData && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="netEnergy"
                stroke="#ff7300"
                strokeWidth={2}
                name="Monthly Net Energy"
                dot={{ fill: '#ff7300', strokeWidth: 1, r: 3 }}
                connectNulls={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend-extended">
        {hasSolarData && (
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#82ca9d' }}></div>
            <span>Monthly Generation (Updates with slider)</span>
          </div>
        )}
        {hasConsumptionData && (
          <>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#8884d8' }}></div>
              <span>Monthly Consumption (Uploaded Data)</span>
            </div>
            {hasSolarData && (
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#ff7300' }}></div>
                <span>Monthly Net Energy (Generation - Consumption)</span>
              </div>
            )}
            <div className="legend-note">
              <p><strong>Surplus months:</strong> When generation exceeds consumption (positive net energy)</p>
              <p><strong>Deficit months:</strong> When consumption exceeds generation (negative net energy)</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EnergyChart;
