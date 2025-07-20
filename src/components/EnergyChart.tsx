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
import type { ProcessedData } from '../utils/dataProcessor.ts';
import { calculateDailyGeneration, calculateNetEnergy, calculateSolarRadiation } from '../utils/solarCalculations';
import './EnergyChart.css';

interface EnergyChartProps {
  installationSizeKW: number;
  uploadedData: ProcessedData;
  showUsage?: boolean;
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
const EnergyChart: React.FC<EnergyChartProps> = ({ installationSizeKW, uploadedData }) => {
  // Use uploaded data (no fallback to mock data)
  const dataToUse = uploadedData;
  // Usage is enabled if dailyConsumption exists and is a non-empty array
  const usageEnabled = Array.isArray(dataToUse.dailyConsumption) && dataToUse.dailyConsumption.length > 0;
  
  // Calculate daily generation based on current installation size
  const dailyGeneration = calculateDailyGeneration(
    installationSizeKW,
    dataToUse.solarIrradiance
  );

  // Calculate solar radiation data for logging
  const dailySolarRadiation = calculateSolarRadiation(dataToUse.solarIrradiance);

  // Calculate net energy only if usage is enabled
  const netEnergyData = usageEnabled && dataToUse.dailyConsumption
    ? calculateNetEnergy(dataToUse.dailyConsumption, dailyGeneration)
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
      monthlyGeneration += dailyGeneration[day] || 0;
      monthlySolarRadiation += dailySolarRadiation[day] || 0;
      if (usageEnabled && dataToUse.dailyConsumption) {
        monthlyConsumption += dataToUse.dailyConsumption[day] || 0;
        monthlyNetEnergy += netEnergyData[day] || 0;
      }
    }
    chartData.push({
      day: month + 1,
      month: shortMonthNames[month],
      consumption: usageEnabled ? Math.round(monthlyConsumption * 100) / 100 : 0,
      generation: Math.round(monthlyGeneration * 100) / 100,
      netEnergy: usageEnabled ? Math.round(monthlyNetEnergy * 100) / 100 : 0
    });
    dayIndex += daysInMonth;
  }
  
  // Calculate summary statistics for display
  const totalGeneration = dailyGeneration.reduce((sum, val) => sum + val, 0);
  let totalConsumption = 0;
  let totalNetEnergy = 0;
  let surplusDays = 0;
  let deficitDays = 0;
  if (usageEnabled && dataToUse.dailyConsumption) {
    totalConsumption = dataToUse.dailyConsumption.reduce((sum, val) => sum + val, 0);
    totalNetEnergy = totalGeneration - totalConsumption;
    surplusDays = netEnergyData.filter(net => net > 0).length;
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
          {usageEnabled ? 'Monthly Energy Analysis (Your Data)' : 'Monthly Solar Generation (No Usage Data Uploaded)'}
        </h2>
        <div className="chart-summary">
          <div className="summary-item">
            <span className="summary-label">Annual Generation:</span>
            <span className="summary-value">{Math.round(totalGeneration)} kWh</span>
          </div>
          {usageEnabled && (
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
            {usageEnabled && (
              <Bar
                yAxisId="left"
                dataKey="consumption"
                fill="#8884d8"
                name="Monthly Consumption"
                fillOpacity={0.7}
              />
            )}
            {/* Net energy line (only if usage data is available) */}
            {usageEnabled && (
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
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#82ca9d' }}></div>
          <span>Monthly Generation (Updates with slider)</span>
        </div>
        {usageEnabled && (
          <>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#8884d8' }}></div>
              <span>Monthly Consumption (Uploaded Data)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ff7300' }}></div>
              <span>Monthly Net Energy (Generation - Consumption)</span>
            </div>
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
