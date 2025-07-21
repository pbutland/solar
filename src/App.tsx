import { useState } from 'react'
import './App.css'
import EnergyChart from './components/EnergyChart'
import InstallationControls from './components/InstallationControls'
import FileUpload from './components/FileUpload'
import LocationInput from './components/LocationInput'
import type { EnergyUsageEntry, ProcessedData } from './types/index.js'
import { getApiSolarIrradiance } from './services/solarIrradianceService.js'
import { processUploadedData } from './utils/dataProcessor.ts'

function App() {
  const [installationSize, setInstallationSize] = useState(6)
  const [uploadedData, setUploadedData] = useState<ProcessedData | null>(null)
  const [solarIrradiance, setSolarIrradiance] = useState<number[] | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false)

  const handleLocationChange = async (latitude: number | null, longitude: number | null) => {
    if (latitude !== null && longitude !== null) {
      try {
        console.log('Loading solar irradiance for location:', { latitude, longitude })
        const irradiance = await getApiSolarIrradiance(latitude, longitude)
        setSolarIrradiance(irradiance)
      } catch (error) {
        console.error('Failed to load solar irradiance data:', error)
        setSolarIrradiance(null)
      }
    } else {
      setSolarIrradiance(null)
    }
  }

  const handleDataLoaded = async (data: EnergyUsageEntry[]) => {
    try {
      // Get solar irradiance data for processing
      const irradiance = solarIrradiance || await getApiSolarIrradiance()
      const processedData = processUploadedData(data, irradiance)
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
