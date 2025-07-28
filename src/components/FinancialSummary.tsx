
import type { EnergyCalculations } from '../types'
import './FinancialSummary.css'

interface FinancialSummaryProps {
  energyCalculations?: EnergyCalculations | null
  installationCost?: number | null
  earnings?: boolean
}

function FinancialSummary({ energyCalculations, installationCost, earnings = false }: FinancialSummaryProps) {
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
      return '--'
    }
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Calculate savings only if both totalConsumption and generationSolar exist
  let savings: number | undefined = undefined;
  if (
    energyCalculations?.totalConsumption &&
    energyCalculations?.generationSolar &&
    Array.isArray(energyCalculations.originalConsumptionCost) &&
    Array.isArray(energyCalculations.consumptionCost) &&
    energyCalculations.originalConsumptionCost.length > 0 &&
    energyCalculations.consumptionCost.length > 0
  ) {
    const totalNonSolar = energyCalculations.originalConsumptionCost.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    const totalConsumption = energyCalculations.consumptionCost.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    savings = totalNonSolar - totalConsumption;
  } else if (energyCalculations?.consumptionCost && energyCalculations.consumptionCost.length > 0) {
    savings = -energyCalculations.consumptionCost.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
  }

  // Calculate ROI if installationCost and savings are valid numbers
  let roiYears: number | undefined = undefined;
  let roiPercent: number | undefined = undefined;
  if (
    typeof installationCost === 'number' && installationCost > 0 &&
    typeof savings === 'number' && savings > 0
  ) {
    roiYears = installationCost / savings;
    roiPercent = (savings / installationCost) * 100;
  }

  const formatROI = (years: number | undefined, percent: number | undefined): string => {
    if (years === undefined || percent === undefined) {
      return '--';
    }
    return `${years.toFixed(2)} years (${percent.toFixed(1)}%)`;
  };

  return (
    <div className="financial-summary-section">
      <div className="summary-header">
        <h3>Financial Summary</h3>
        <p>Overview of your solar investment</p>
      </div>
      <div className="summary-content">
        <div className="summary-item">
          <label>Installation Cost:</label>
          <span className="value">{formatCurrency(installationCost)}</span>
        </div>
        <div className="summary-item">
          <label>{earnings ? 'Earnings' : 'Savings'} (per year):</label>
          <span className="value">{savings === undefined ? '--' : formatCurrency(savings)}</span>
        </div>
        <div className="summary-item">
          <label>ROI:</label>
          <span className="value">{formatROI(roiYears, roiPercent)}</span>
        </div>
      </div>
    </div>
  )
}

export default FinancialSummary
