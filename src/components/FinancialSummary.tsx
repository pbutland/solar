
import type { EnergyCalculations } from '../types'
import InfoTooltip from './InfoTooltip'
import './FinancialSummary.css'

interface FinancialSummaryProps {
  energyCalculations?: EnergyCalculations | null
  solarInstallationCost?: number | null
  batteryInstallationCost?: number | null
  earnings?: boolean
}

function FinancialSummary({ energyCalculations, solarInstallationCost, batteryInstallationCost, earnings = false }: FinancialSummaryProps) {
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
      return '--'
    }
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // --- Hardcoded constants ---
  const DISCOUNT_RATE = 0.05;
  const SOLAR_LIFESPAN = 24; // years
  const BATTERY_LIFESPAN = 12; // years

  // Calculate savings only if both totalConsumption and generationSolar exist
  let savings: number | undefined = undefined;
  let totalNonSolar: number | undefined = undefined;
  let totalConsumption: number | undefined = undefined;
  let showCostsInsteadOfSavings = false;
  if (
    energyCalculations?.totalConsumption &&
    energyCalculations?.generationSolar &&
    Array.isArray(energyCalculations.originalConsumptionCost) &&
    Array.isArray(energyCalculations.consumptionCost) &&
    energyCalculations.originalConsumptionCost.length > 0 &&
    energyCalculations.consumptionCost.length > 0
  ) {
    totalNonSolar = energyCalculations.originalConsumptionCost.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    totalConsumption = energyCalculations.consumptionCost.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    savings = totalNonSolar - totalConsumption;
    if (totalNonSolar === totalConsumption) {
      showCostsInsteadOfSavings = true;
    }
  } else if (energyCalculations?.consumptionCost && energyCalculations.consumptionCost.length > 0) {
    savings = -energyCalculations.consumptionCost.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
  }

  const installationCost = (solarInstallationCost || 0) + (batteryInstallationCost || 0);

  // --- NPV Calculation ---
  let npv: number | undefined = undefined;
  if (typeof savings === 'number' && savings > 0) {
    npv = 0;
    // Deduct solar installation cost at year 0 if present
    if (typeof solarInstallationCost === 'number' && solarInstallationCost > 0) {
      npv -= solarInstallationCost;
    }
    // Deduct battery installation cost at year 0 if present
    if (typeof batteryInstallationCost === 'number' && batteryInstallationCost > 0) {
      npv -= batteryInstallationCost;
    }
    // Add savings for years 1-12 (battery lifespan)
    for (let i = 1; i <= Math.min(BATTERY_LIFESPAN, SOLAR_LIFESPAN); i++) {
      npv += savings / Math.pow(1 + DISCOUNT_RATE, i);
    }
    // If battery is present, deduct replacement cost at year 12
    if (typeof batteryInstallationCost === 'number' && batteryInstallationCost > 0) {
      npv += -batteryInstallationCost / Math.pow(1 + DISCOUNT_RATE, BATTERY_LIFESPAN);
    }
    // Add savings for years after battery lifespan up to solar lifespan
    for (let i = BATTERY_LIFESPAN + 1; i <= SOLAR_LIFESPAN; i++) {
      npv += savings / Math.pow(1 + DISCOUNT_RATE, i);
    }
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
          <label>Installation Cost</label>
          <span className="value">{formatCurrency(installationCost)}</span>
        </div>
        <div className="summary-item">
          {showCostsInsteadOfSavings ? (
            <>
              <label>Costs (per year) <InfoTooltip text='Excludes daily supply charge'></InfoTooltip></label>
              <span className="value">{totalConsumption === undefined ? '--' : formatCurrency(totalConsumption)}</span>
            </>
          ) : (
            <>
              <label>{earnings ? 'Earnings' : 'Savings'} (per year) <InfoTooltip text='Excludes installation costs'></InfoTooltip></label>
              <span className="value">{savings === undefined ? '--' : formatCurrency(savings)}</span>
            </>
          )}
        </div>
        <div className="summary-item">
          <label>ROI</label>
          <span className="value">{formatROI(roiYears, roiPercent)}</span>
        </div>
        <div className="summary-item">
          <label>NPV (24 years) <InfoTooltip text='Net Present Value (over 24 years for solar, 12 years for battery (includes replacement costs), discount rate 5%)'></InfoTooltip></label>
          <span className="value">{npv === undefined ? '--' : formatCurrency(npv)}</span>
        </div>
      </div>
    </div>
  )
}

export default FinancialSummary
