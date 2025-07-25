import './FinancialSummary.css'

interface FinancialSummaryProps {
  totalCost?: number | null
  savings?: number | null
  roi?: number | null
}

function FinancialSummary({ totalCost, savings, roi }: FinancialSummaryProps) {
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

  return (
    <div className="financial-summary-section">
      <div className="summary-header">
        <h3>Financial Summary</h3>
        <p>Overview of your solar investment</p>
      </div>
      <div className="summary-content">
        <div className="summary-item">
          <label>Total Cost:</label>
          <span className="value">{formatCurrency(totalCost)}</span>
        </div>
        <div className="summary-item">
          <label>Savings:</label>
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
