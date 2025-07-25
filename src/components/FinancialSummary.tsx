
import type { EnergyCalculations } from '../types'
import './FinancialSummary.css'

interface FinancialSummaryProps {
  energyCalculations?: EnergyCalculations | null
  installationCost?: number | null
  peakCost?: number | null
  offPeakCost?: number | null
}

function FinancialSummary({ energyCalculations, installationCost, peakCost, offPeakCost }: FinancialSummaryProps) {
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
      return '--'
    }
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatPercentage = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
      return '--'
    }
    return `${value.toFixed(1)}%`
  }

  // TODO calculate costs
  const savings = 0;
  const roi = 0;

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
          <label>Savings (per year):</label>
          <span className="value">{formatCurrency(savings)}</span>
        </div>
        <div className="summary-item">
          <label>ROI:</label>
          <span className="value">{formatPercentage(roi)}</span>
        </div>
      </div>
    </div>
  )
}

export default FinancialSummary
