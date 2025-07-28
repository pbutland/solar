import { useEffect, useState } from 'react'
import './CostInputs.css'

interface CostInputsProps {
  installationSize: number
  batteryCapacity: number
  onCostChange?: (solarCost: number | null, batteryCost: number | null, peakCost: number | null, offPeakCost: number | null, feedInTariff: number | null) => void
}

function CostInputs({ installationSize, batteryCapacity, onCostChange }: CostInputsProps) {
  const [solarCost, setSolarCost] = useState<string>('1000')
  const [batteryCost, setBatteryCost] = useState<string>('1000')
  // Store cents in UI, but convert to dollars for logic
  const [peakCost, setPeakCost] = useState<string>('')
  const [offPeakCost, setOffPeakCost] = useState<string>('')
  const [feedInTariff, setFeedInTariff] = useState<string>('')

  // Set default solar and battery cost when installationSize or batteryCapacity changes
  useEffect(() => {
    setSolarCost('1000')
    setBatteryCost('1000')
    if (onCostChange) {
      const solarValue = solarCost === '' ? null : parseFloat(solarCost)
      const batteryValue = batteryCost === '' ? null : parseFloat(batteryCost)
      // Convert cents to dollars for callback
      const peakValue = peakCost === '' ? null : parseFloat(peakCost) / 100
      const offPeakValue = offPeakCost === '' ? null : parseFloat(offPeakCost) / 100
      const feedInValue = feedInTariff === '' ? null : parseFloat(feedInTariff) / 100
      onCostChange(
        isNaN(solarValue!) ? null : solarValue,
        isNaN(batteryValue!) ? null : batteryValue,
        isNaN(peakValue!) ? null : peakValue,
        isNaN(offPeakValue!) ? null : offPeakValue,
        isNaN(feedInValue!) ? null : feedInValue
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installationSize, batteryCapacity])


  // No formatting for input fields; just store the raw value

  const handleSolarCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSolarCost(value)
    const numValue = value === '' ? null : parseFloat(value)
    if (onCostChange && (!isNaN(numValue!) || numValue === null)) {
      const batteryValue = batteryCost === '' ? null : parseFloat(batteryCost)
      const peakValue = peakCost === '' ? null : parseFloat(peakCost)
      const offPeakValue = offPeakCost === '' ? null : parseFloat(offPeakCost)
      const feedInValue = feedInTariff === '' ? null : parseFloat(feedInTariff)
      onCostChange(
        numValue,
        isNaN(batteryValue!) ? null : batteryValue,
        isNaN(peakValue!) ? null : peakValue,
        isNaN(offPeakValue!) ? null : offPeakValue,
        isNaN(feedInValue!) ? null : feedInValue
      )
    }
  }

  const handleBatteryCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBatteryCost(value)
    const numValue = value === '' ? null : parseFloat(value)
    if (onCostChange && (!isNaN(numValue!) || numValue === null)) {
      const solarValue = solarCost === '' ? null : parseFloat(solarCost)
      const peakValue = peakCost === '' ? null : parseFloat(peakCost)
      const offPeakValue = offPeakCost === '' ? null : parseFloat(offPeakCost)
      const feedInValue = feedInTariff === '' ? null : parseFloat(feedInTariff)
      onCostChange(
        isNaN(solarValue!) ? null : solarValue,
        numValue,
        isNaN(peakValue!) ? null : peakValue,
        isNaN(offPeakValue!) ? null : offPeakValue,
        isNaN(feedInValue!) ? null : feedInValue
      )
    }
  }

  const handlePeakCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPeakCost(value)
    const numValue = value === '' ? null : parseFloat(value)
    if (onCostChange && (!isNaN(numValue!) || numValue === null)) {
      const solarValue = solarCost === '' ? null : parseFloat(solarCost)
      const batteryValue = batteryCost === '' ? null : parseFloat(batteryCost)
      const offPeakValue = offPeakCost === '' ? null : parseFloat(offPeakCost)
      const feedInValue = feedInTariff === '' ? null : parseFloat(feedInTariff)
      // Convert cents to dollars for callback
      onCostChange(
        isNaN(solarValue!) ? null : solarValue,
        isNaN(batteryValue!) ? null : batteryValue,
        numValue === null || isNaN(numValue) ? null : numValue / 100,
        offPeakValue === null || isNaN(offPeakValue) ? null : offPeakValue / 100,
        feedInValue === null || isNaN(feedInValue) ? null : feedInValue / 100
      )
    }
  }

  const handleOffPeakCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setOffPeakCost(value)
    const numValue = value === '' ? null : parseFloat(value)
    if (onCostChange && (!isNaN(numValue!) || numValue === null)) {
      const solarValue = solarCost === '' ? null : parseFloat(solarCost)
      const batteryValue = batteryCost === '' ? null : parseFloat(batteryCost)
      const peakValue = peakCost === '' ? null : parseFloat(peakCost)
      const feedInValue = feedInTariff === '' ? null : parseFloat(feedInTariff)
      // Convert cents to dollars for callback
      onCostChange(
        isNaN(solarValue!) ? null : solarValue,
        isNaN(batteryValue!) ? null : batteryValue,
        peakValue === null || isNaN(peakValue) ? null : peakValue / 100,
        numValue === null || isNaN(numValue) ? null : numValue / 100,
        feedInValue === null || isNaN(feedInValue) ? null : feedInValue / 100
      )
    }
  }

  const handleFeedInTariffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFeedInTariff(value)
    const numValue = value === '' ? null : parseFloat(value)
    if (onCostChange && (!isNaN(numValue!) || numValue === null)) {
      const solarValue = solarCost === '' ? null : parseFloat(solarCost)
      const batteryValue = batteryCost === '' ? null : parseFloat(batteryCost)
      const peakValue = peakCost === '' ? null : parseFloat(peakCost)
      const offPeakValue = offPeakCost === '' ? null : parseFloat(offPeakCost)
      // Convert cents to dollars for callback
      onCostChange(
        isNaN(solarValue!) ? null : solarValue,
        isNaN(batteryValue!) ? null : batteryValue,
        peakValue === null || isNaN(peakValue) ? null : peakValue / 100,
        offPeakValue === null || isNaN(offPeakValue) ? null : offPeakValue / 100,
        numValue === null || isNaN(numValue) ? null : numValue / 100
      )
    }
  }

  return (
    <div className="cost-inputs-section">
      <h3>Cost Configuration</h3>
      <div className="cost-input-row">
        <label htmlFor="solar-cost">Solar Cost ($/kW)</label>
        <input
          type="number"
          id="solar-cost"
          name="solar-cost"
          step="any"
          min="0"
          value={solarCost}
          placeholder='e.g. 1000'
          onChange={handleSolarCostChange}
        />
      </div>
      <div className="cost-input-row">
        <label htmlFor="battery-cost">Battery Cost ($/kWh)</label>
        <input
          type="number"
          id="battery-cost"
          name="battery-cost"
          step="any"
          min="0"
          value={batteryCost}
          placeholder='e.g. 1000'
          onChange={handleBatteryCostChange}
        />
      </div>
      <div className="cost-input-row">
        <label htmlFor="peak-cost">Peak rate (c/kWh)</label>
        <input
          type="number"
          id="peak-cost"
          name="peak-cost"
          step="any"
          min="0"
          value={peakCost}
          placeholder='e.g. 29.72'
          onChange={handlePeakCostChange}
        />
      </div>
      <div className="cost-input-row">
        <label htmlFor="off-peak-cost">Off-peak rate (c/kWh)</label>
        <input
          type="number"
          id="off-peak-cost"
          name="off-peak-cost"
          step="any"
          min="0"
          value={offPeakCost}
          placeholder='e.g. 23.14'
          onChange={handleOffPeakCostChange}
        />
      </div>
      <div className="cost-input-row">
        <label htmlFor="feed-in-tarriff">Solar feed-in tariff (c/kWh)</label>
        <input
          type="number"
          id="feed-in-tarriff"
          name="feed-in-tarriff"
          step="any"
          min="0"
          value={feedInTariff}
          placeholder='e.g. 10'
          onChange={handleFeedInTariffChange}
        />
      </div>
    </div>
  )
}

export default CostInputs
