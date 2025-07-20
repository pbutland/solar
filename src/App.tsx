import { useState } from 'react'
import './App.css'
import EnergyChart from './components/EnergyChart'
import InstallationControls from './components/InstallationControls'
import FileUpload from './components/FileUpload'
import type { EnergyUsageEntry } from './utils/csvProcessor.ts'
import type { ProcessedData } from './utils/dataProcessor.ts'
import { mockData } from './data/mockData.ts'
import { processUploadedData } from './utils/dataProcessor.ts'

function App() {
  const [installationSize, setInstallationSize] = useState(6)
  const [uploadedData, setUploadedData] = useState<ProcessedData | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false)

  const handleDataLoaded = (data: EnergyUsageEntry[]) => {
    try {
      const processedData = processUploadedData(data)
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
        <p>Discover your home's solar potential in Melbourne, Australia</p>
      </header>
      <FileUpload 
        onDataLoaded={handleDataLoaded}
        onError={handleUploadError}
      />
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
          {uploadedData ? (
            <EnergyChart 
              installationSizeKW={installationSize}
              uploadedData={uploadedData}
              showUsage={true}
            />
          ) : (
            <EnergyChart 
              installationSizeKW={installationSize}
              uploadedData={mockData}
              showUsage={false}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
