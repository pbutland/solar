import { useEffect, useState } from 'react'
import './CostInputs.css'

interface CostInputsProps {
  installationSize: number
  onCostChange?: (installationCost: number | null, peakCost: number | null, offPeakCost: number | null, feedInTariff: number | null) => void
}

function CostInputs({ installationSize, onCostChange }: CostInputsProps) {
  const [installationCost, setInstallationCost] = useState<string>('')
  const [peakCost, setPeakCost] = useState<string>('')
  const [offPeakCost, setOffPeakCost] = useState<string>('')
  const [feedInTariff, setFeedInTariff] = useState<string>('')

  // Set default installation cost when installationSize changes
  useEffect(() => {
    const defaultCost = (installationSize * 1000).toFixed(2)
    setInstallationCost(defaultCost)
    if (onCostChange) {
      const numValue = parseFloat(defaultCost)
      const peakValue = peakCost === '' ? null : parseFloat(peakCost)
      const offPeakValue = offPeakCost === '' ? null : parseFloat(offPeakCost)
      const feedInValue = feedInTariff === '' ? null : parseFloat(feedInTariff)
      onCostChange(numValue, isNaN(peakValue!) ? null : peakValue, isNaN(offPeakValue!) ? null : offPeakValue, isNaN(feedInValue!) ? null : feedInValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installationSize])


  // No formatting for input fields; just store the raw value

  const handleInstallationCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInstallationCost(value)
    const numValue = value === '' ? null : parseFloat(value)
    if (onCostChange && (!isNaN(numValue!) || numValue === null)) {
      const peakValue = peakCost === '' ? null : parseFloat(peakCost)
      const offPeakValue = offPeakCost === '' ? null : parseFloat(offPeakCost)
      const feedInValue = feedInTariff === '' ? null : parseFloat(feedInTariff)
      onCostChange(numValue, isNaN(peakValue!) ? null : peakValue, isNaN(offPeakValue!) ? null : offPeakValue, isNaN(feedInValue!) ? null : feedInValue)
    }
  }

  const handlePeakCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPeakCost(value)
    const numValue = value === '' ? null : parseFloat(value)
    if (onCostChange && (!isNaN(numValue!) || numValue === null)) {
      const installationValue = installationCost === '' ? null : parseFloat(installationCost)
      const offPeakValue = offPeakCost === '' ? null : parseFloat(offPeakCost)
      const feedInValue = feedInTariff === '' ? null : parseFloat(feedInTariff)
      onCostChange(isNaN(installationValue!) ? null : installationValue, numValue, isNaN(offPeakValue!) ? null : offPeakValue, isNaN(feedInValue!) ? null : feedInValue)
    }
  }

  const handleOffPeakCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setOffPeakCost(value)
    const numValue = value === '' ? null : parseFloat(value)
    if (onCostChange && (!isNaN(numValue!) || numValue === null)) {
      const installationValue = installationCost === '' ? null : parseFloat(installationCost)
      const peakValue = peakCost === '' ? null : parseFloat(peakCost)
      const feedInValue = feedInTariff === '' ? null : parseFloat(feedInTariff)
      onCostChange(isNaN(installationValue!) ? null : installationValue, isNaN(peakValue!) ? null : peakValue, numValue, isNaN(feedInValue!) ? null : feedInValue)
    }
  }

  const handleFeedInTariffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFeedInTariff(value)
    const numValue = value === '' ? null : parseFloat(value)
    if (onCostChange && (!isNaN(numValue!) || numValue === null)) {
      const installationValue = installationCost === '' ? null : parseFloat(installationCost)
      const peakValue = peakCost === '' ? null : parseFloat(peakCost)
      const offPeakValue = offPeakCost === '' ? null : parseFloat(offPeakCost)
      onCostChange(isNaN(installationValue!) ? null : installationValue, isNaN(peakValue!) ? null : peakValue, offPeakValue, numValue)
    }
  }

  return (
    <div className="cost-inputs-section">
      <h3>Cost Configuration</h3>
      <input 
        type="number" 
        id="installation-cost" 
        name="installation-cost" 
        step="any" 
        min="0" 
        placeholder="Installation cost ($)"
        value={installationCost}
        onChange={handleInstallationCostChange}
      />
      <input 
        type="number" 
        id="peak-cost" 
        name="peak-cost" 
        step="any" 
        min="0" 
        placeholder="Peak rate (c/kWh)"
        value={peakCost}
        onChange={handlePeakCostChange}
      />
      <input 
        type="number" 
        id="off-peak-cost" 
        name="off-peak-cost" 
        step="any" 
        min="0" 
        placeholder="Off-peak rate (c/kWh)"
        value={offPeakCost}
        onChange={handleOffPeakCostChange}
      />
      <input 
        type="number" 
        id="feed-in-tarriff" 
        name="feed-in-tarriff" 
        step="any" 
        min="0" 
        placeholder="Solar feed-in tariff (c/kWh)"
        value={feedInTariff}
        onChange={handleFeedInTariffChange}
      />
    </div>
  )
}

export default CostInputs
