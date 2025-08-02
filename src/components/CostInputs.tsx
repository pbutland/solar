import { useEffect, useState } from 'react'
import './CostInputs.css'
import InfoTooltip from './InfoTooltip'

interface CostInputsProps {
  installationSize: number
  batteryCapacity: number
  onCostChange?: (
    solarCost: number | null,
    batteryCost: number | null,
    peakCost: number | null,
    offPeakCost: number | null,
    feedInTariff: number | null,
    exportLimit: number | null
  ) => void
}


function CostInputs({ installationSize, batteryCapacity, onCostChange }: CostInputsProps) {
  const [solarCost, setSolarCost] = useState<string>('1000')
  const [batteryCost, setBatteryCost] = useState<string>('1000')
  const [peakCost, setPeakCost] = useState<string>('')
  const [offPeakCost, setOffPeakCost] = useState<string>('')
  const [feedInTariff, setFeedInTariff] = useState<string>('')
  const [exportLimit, setExportLimit] = useState<string>('5')

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
      const exportLimitValue = exportLimit === '' ? null : parseFloat(exportLimit)
      onCostChange(
        isNaN(solarValue!) ? null : solarValue,
        isNaN(batteryValue!) ? null : batteryValue,
        isNaN(peakValue!) ? null : peakValue,
        isNaN(offPeakValue!) ? null : offPeakValue,
        isNaN(feedInValue!) ? null : feedInValue,
        isNaN(exportLimitValue!) ? null : exportLimitValue
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
      const exportLimitValue = exportLimit === '' ? null : parseFloat(exportLimit)
      onCostChange(
        numValue,
        isNaN(batteryValue!) ? null : batteryValue,
        isNaN(peakValue!) ? null : peakValue,
        isNaN(offPeakValue!) ? null : offPeakValue,
        isNaN(feedInValue!) ? null : feedInValue,
        isNaN(exportLimitValue!) ? null : exportLimitValue
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
      const exportLimitValue = exportLimit === '' ? null : parseFloat(exportLimit)
      onCostChange(
        isNaN(solarValue!) ? null : solarValue,
        numValue,
        isNaN(peakValue!) ? null : peakValue,
        isNaN(offPeakValue!) ? null : offPeakValue,
        isNaN(feedInValue!) ? null : feedInValue,
        isNaN(exportLimitValue!) ? null : exportLimitValue
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
      const exportLimitValue = exportLimit === '' ? null : parseFloat(exportLimit)
      // Convert cents to dollars for callback
      onCostChange(
        isNaN(solarValue!) ? null : solarValue,
        isNaN(batteryValue!) ? null : batteryValue,
        numValue === null || isNaN(numValue) ? null : numValue / 100,
        offPeakValue === null || isNaN(offPeakValue) ? null : offPeakValue / 100,
        feedInValue === null || isNaN(feedInValue) ? null : feedInValue / 100,
        isNaN(exportLimitValue!) ? null : exportLimitValue
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
      const exportLimitValue = exportLimit === '' ? null : parseFloat(exportLimit)
      // Convert cents to dollars for callback
      onCostChange(
        isNaN(solarValue!) ? null : solarValue,
        isNaN(batteryValue!) ? null : batteryValue,
        peakValue === null || isNaN(peakValue) ? null : peakValue / 100,
        numValue === null || isNaN(numValue) ? null : numValue / 100,
        feedInValue === null || isNaN(feedInValue) ? null : feedInValue / 100,
        isNaN(exportLimitValue!) ? null : exportLimitValue
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
      const exportLimitValue = exportLimit === '' ? null : parseFloat(exportLimit)
      // Convert cents to dollars for callback
      onCostChange(
        isNaN(solarValue!) ? null : solarValue,
        isNaN(batteryValue!) ? null : batteryValue,
        peakValue === null || isNaN(peakValue) ? null : peakValue / 100,
        offPeakValue === null || isNaN(offPeakValue) ? null : offPeakValue / 100,
        numValue === null || isNaN(numValue) ? null : numValue / 100,
        isNaN(exportLimitValue!) ? null : exportLimitValue
      )
    }
  }

  const handleExportLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setExportLimit(value)
    const numValue = value === '' ? null : parseFloat(value)
    if (onCostChange && (!isNaN(numValue!) || numValue === null)) {
      const solarValue = solarCost === '' ? null : parseFloat(solarCost)
      const batteryValue = batteryCost === '' ? null : parseFloat(batteryCost)
      const peakValue = peakCost === '' ? null : parseFloat(peakCost)
      const offPeakValue = offPeakCost === '' ? null : parseFloat(offPeakCost)
      const feedInValue = feedInTariff === '' ? null : parseFloat(feedInTariff)
      onCostChange(
        isNaN(solarValue!) ? null : solarValue,
        isNaN(batteryValue!) ? null : batteryValue,
        peakValue === null || isNaN(peakValue) ? null : peakValue / 100,
        offPeakValue === null || isNaN(offPeakValue) ? null : offPeakValue / 100,
        feedInValue === null || isNaN(feedInValue) ? null : feedInValue / 100,
        numValue
      )
    }
  }

  return (
    <div className="cost-inputs-section">
      <h3>Cost Configuration</h3>
      <div className="cost-input-row">
        <label htmlFor="solar-cost">Solar Cost ($/kW) <InfoTooltip text='Should include inverter cost and any government rebates'></InfoTooltip></label>
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
        <label htmlFor="battery-cost">Battery Cost ($/kWh) <InfoTooltip text='Should include any government rebates'></InfoTooltip></label>
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
      <div className="cost-input-row">
        <label htmlFor="export-limit">Daily Export Limit (kW) <InfoTooltip text='Remove value if no daily export limit'></InfoTooltip></label>
        <input
          type="number"
          id="export-limit"
          name="export-limit"
          step="any"
          min="0"
          value={exportLimit}
          placeholder='e.g. 5'
          onChange={handleExportLimitChange}
        />
      </div>
    </div>
  )
}

export default CostInputs
