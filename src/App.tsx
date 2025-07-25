import { useState, useEffect } from 'react'
import './App.css'
import EnergyChart from './components/EnergyChart'
import InstallationControls from './components/InstallationControls'
import FileUpload from './components/FileUpload'
import LocationInput from './components/LocationInput'
import HelpSection from './components/HelpSection'
import CostInputs from './components/CostInputs'
import FinancialSummary from './components/FinancialSummary'
import type { EnergyData, EnergyCalculations } from './types/index'
import { getApiSolarIrradiance } from './services/solarIrradianceService'

function App() {
  const [installationSize, setInstallationSize] = useState(6)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false)
  const [solarError, setSolarError] = useState<string | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const [isLoadingSolar, setIsLoadingSolar] = useState<boolean>(false)
  const [energyCalculations, setEnergyCalculations] = useState<EnergyCalculations | null>(null)

  // Financial state
  const [installationCost, setInstallationCost] = useState<number | null>(null)
  const [peakCost, setPeakCost] = useState<number | null>(null)
  const [offPeakCost, setOffPeakCost] = useState<number | null>(null)
  const [feedInTariff, setFeedInTariff] = useState<number | null>(null)

  const validateCoordinates = (latitude: number | null, longitude: number | null): boolean => {
    if (latitude === null || longitude === null) {
      return false
    }
    
    // Validate latitude range
    if (latitude < -90 || latitude > 90) {
      return false
    }
    
    // Validate longitude range
    if (longitude < -180 || longitude > 180) {
      return false
    }
    
    return true
  }

  const fetchSolarData = async (latitude: number, longitude: number) => {
    setIsLoadingSolar(true)
    try {
      console.log('Loading solar irradiance for location:', { latitude, longitude })
      setSolarError(null) // Clear any previous errors
      const irradiance = await getApiSolarIrradiance(latitude, longitude)
      if (energyCalculations) {
        // Update calculations with new data
        energyCalculations.periodInMinutes = irradiance.periodInMinutes
        energyCalculations.generationSolar = irradiance.values;
        setEnergyCalculations(energyCalculations);
      } else {
        // Initialize calculations if not already done
        const newCalculations = {
          periodInMinutes: irradiance.periodInMinutes,
          generationSolar: irradiance.values,
        };
        setEnergyCalculations(newCalculations);
      }
    } catch (error) {
      console.error('Failed to load solar irradiance data:', error)
      if (energyCalculations) {
        energyCalculations.generationSolar = undefined;
        setEnergyCalculations(energyCalculations);
      }
      if (error instanceof Error) {
        setSolarError(error.message)
      } else {
        setSolarError('An unknown error occurred while fetching solar data for this location.')
      }
    } finally {
      setIsLoadingSolar(false)
    }
  }

  const handleLocationChange = async (latitude: number | null, longitude: number | null) => {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      setDebounceTimer(null)
    }

    // Validate coordinates first
    if (validateCoordinates(latitude, longitude)) {
      // Set debounce timer for 750ms delay
      const timer = setTimeout(() => {
        fetchSolarData(latitude!, longitude!)
      }, 750)
      
      setDebounceTimer(timer)
    } else {
      // Clear data and errors for invalid/incomplete coordinates
      if (energyCalculations) {
        energyCalculations.generationSolar = undefined;
        setEnergyCalculations(energyCalculations);
      }
      setSolarError(null)
    }
  }

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  const handleDataLoaded = async (data: EnergyData) => {
    try {
      if (data) {
        const calculations = energyCalculations;
        if (calculations) {
          // Update calculations with new data
          calculations.periodInMinutes = data.periodInMinutes
          calculations.totalConsumption = data.values;
          setEnergyCalculations(calculations);
        } else {
          // Initialize calculations if not already done
          const newCalculations = {
            periodInMinutes: data.periodInMinutes,
            totalConsumption: data.values,
          };
          setEnergyCalculations(newCalculations);
        }
      }
      setUploadError(null)
      setUploadSuccess(true)
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (error) {
      if (error instanceof Error) {
        setUploadError(`Error processing data: ${error.message}`)
      } else {
        setUploadError('An unknown error occurred while processing the data.')
      }
      setUploadSuccess(false)
    }
  }

  const handleUploadError = (error: string) => {
    setUploadError(error)
    setUploadSuccess(false)
  }

  const handleCostChange = (instCost: number | null, peak: number | null, offPeak: number | null) => {
    setInstallationCost(instCost)
    setPeakCost(peak)
    setOffPeakCost(offPeak)
    setFeedInTariff(feedInTariff)
  }

  const hasConsumptionData = energyCalculations && energyCalculations?.totalConsumption && energyCalculations.totalConsumption.length > 0;
  const hasSolarData = energyCalculations && energyCalculations?.generationSolar && energyCalculations.generationSolar.length > 0;

  return (
    <div className="app">
      <header>
        <h1>☀️ Solar Power Optimizer</h1>
        <p>Discover your home's solar potential</p>
      </header>
      <div className="input-section">
        <LocationInput onLocationChange={handleLocationChange} />
        <FileUpload 
          onDataLoaded={handleDataLoaded}
          onError={handleUploadError}
        />
      </div>
      {uploadSuccess && (
        <div className="upload-success">
          ✅ Energy data uploaded successfully! Analysis updated with your data.
        </div>
      )}
      {uploadError && (
        <div className="upload-error">
          ❌ {uploadError}
        </div>
      )}
      {isLoadingSolar && (
        <div className="loading-message">
          🌞 Fetching solar data for your location...
        </div>
      )}
      {solarError && (
        <div className="upload-error">
          ⚠️ {solarError}
        </div>
      )}
      {(!hasConsumptionData && !hasSolarData) ? (
        <div className="no-data-message">
          <p>Please select a location and upload your<br/>energy usage data to see the analysis.</p>
        </div>
      ) : (
        <main>
          <InstallationControls 
            installationSize={installationSize}
            onInstallationSizeChange={setInstallationSize}
          />
          <div className="chart-section">
            <EnergyChart 
              installationSizeKW={installationSize}
              energyCalculations={energyCalculations}
            />
          </div>
        </main>
      )}
      {/* {hasSolarData && (
        <div className="input-section">
          <CostInputs installationSize={installationSize} onCostChange={handleCostChange} />
          <FinancialSummary
            totalCost={installationCost}
            savings={null}
            roi={null}
          />
        </div>
      )} */}
      <HelpSection />
    </div>
  )
}

export default App
