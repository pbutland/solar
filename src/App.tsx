import { useState, useEffect } from 'react'
import './App.css'
import EnergyChart from './components/EnergyChart'
import InstallationControls from './components/InstallationControls'
import FileUpload from './components/FileUpload'
import LocationInput from './components/LocationInput'
import type { EnergyUsageEntry, ProcessedData } from './types/index.js'
import { getApiSolarIrradiance, type SolarIrradianceData } from './services/solarIrradianceService.js'
import { processUploadedData } from './utils/dataProcessor.ts'

function App() {
  const [installationSize, setInstallationSize] = useState(6)
  const [uploadedData, setUploadedData] = useState<ProcessedData | null>(null)
  const [solarIrradiance, setSolarIrradiance] = useState<SolarIrradianceData | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false)
  const [solarError, setSolarError] = useState<string | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const [isLoadingSolar, setIsLoadingSolar] = useState<boolean>(false)

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
      setSolarIrradiance(irradiance)
    } catch (error) {
      console.error('Failed to load solar irradiance data:', error)
      setSolarIrradiance(null)
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
      setSolarIrradiance(null)
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

  const handleDataLoaded = async (data: EnergyUsageEntry[]) => {
    try {
      // Check if we have solar irradiance data
      if (!solarIrradiance) {
        throw new Error('Solar data is required for analysis. Please select a location on the map first.')
      }
      
      const processedData = processUploadedData(data, solarIrradiance.normalizedValues)
      setUploadedData(processedData)
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
      <main>
        <InstallationControls 
          installationSize={installationSize}
          onInstallationSizeChange={setInstallationSize}
        />
        <div className="chart-section">
          <EnergyChart 
            installationSizeKW={installationSize}
            uploadedData={uploadedData}
            solarIrradiance={solarIrradiance}
          />
        </div>
      </main>
    </div>
  )
}

export default App
