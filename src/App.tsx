import { useState, useEffect } from 'react'
import './App.css'
import EnergyChart from './components/EnergyChart'
import InstallationControls from './components/InstallationControls'
import FileUpload from './components/FileUpload'
import LocationMapInput from './components/LocationMapInput'
import HelpSection from './components/HelpSection'
import CostInputs from './components/CostInputs'
import FinancialSummary from './components/FinancialSummary'
import type { EnergyData, EnergyCalculations, EnergySystemDetails } from './types/index'
import { getSolarIrradiance, SolarIrradianceSource } from './services/solarIrradianceService'
import { calculateConsumptionData, calculateSolarGeneration } from './utils/solarCalculations'


function App() {
  const [isLoadingUpload, setIsLoadingUpload] = useState<boolean>(false);
  const [installationSize, setInstallationSize] = useState(6)
  const [batteryCapacity, setBatteryCapacity] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false)
  const [solarError, setSolarError] = useState<string | null>(null)
  const [chartExpanded, setChartExpanded] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const [isLoadingSolar, setIsLoadingSolar] = useState<boolean>(false)
  const [energyCalculations, setEnergyCalculations] = useState<EnergyCalculations | null>(null)
  const [rawSolarIrradiance, setRawSolarIrradiance] = useState<EnergyData | null>(null)

  // Financial state (grouped)
  const [costDetails, setCostDetails] = useState({
    solarInstallationCost: null as number | null,
    batteryInstallationCost: null as number | null,
    peakCost: null as number | null,
    offPeakCost: null as number | null,
    feedInTariff: null as number | null,
    exportLimit: 5 as number | null,
  });

  // Update energyCalculations with both solar and consumption calculations together
  useEffect(() => {
    if (rawSolarIrradiance) {
      const generationSolar = rawSolarIrradiance.values.map(entry => ({
        date: entry.date,
        value: calculateSolarGeneration(installationSize, entry.value)
      }));
      // If we have consumption data, use it, otherwise empty array
      const totalConsumption = energyCalculations && energyCalculations.totalConsumption ? energyCalculations.totalConsumption : [];
      const base: EnergyCalculations = {
        periodInMinutes: rawSolarIrradiance.periodInMinutes,
        generationSolar,
        totalConsumption,
      };
      // Always run calculateConsumptionData so the state is always fully processed
      const systemDetails: EnergySystemDetails = {
        installationSize,
        batteryCapacity,
        rawSolarIrradiance: rawSolarIrradiance.values,
        peakCost: costDetails.peakCost,
        offPeakCost: costDetails.offPeakCost,
        feedInTariff: costDetails.feedInTariff,
        exportLimit: costDetails.exportLimit,
      };
      setEnergyCalculations(calculateConsumptionData(base, systemDetails));
    }
  }, [
    installationSize,
    batteryCapacity,
    rawSolarIrradiance,
    costDetails.peakCost,
    costDetails.offPeakCost,
    costDetails.feedInTariff,
    costDetails.exportLimit,
  ]);

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
      const irradiance = await getSolarIrradiance(latitude, longitude, SolarIrradianceSource.NASA_POWER_API);
      setRawSolarIrradiance(irradiance)
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
        const generationSolar = energyCalculations && energyCalculations.generationSolar ? energyCalculations.generationSolar : [];
        const base: EnergyCalculations = {
          periodInMinutes: data.periodInMinutes,
          totalConsumption: data.values,
          generationSolar,
        };
        const systemDetails: EnergySystemDetails = {
          installationSize,
          batteryCapacity,
          rawSolarIrradiance: rawSolarIrradiance ? rawSolarIrradiance.values : [],
          peakCost: costDetails.peakCost,
          offPeakCost: costDetails.offPeakCost,
          feedInTariff: costDetails.feedInTariff,
          exportLimit: costDetails.exportLimit,
        };
        setEnergyCalculations(calculateConsumptionData(base, systemDetails));
      }
      setUploadError(null);
      setUploadSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      if (error instanceof Error) {
        setUploadError(`Error processing data: ${error.message}`);
      } else {
        setUploadError('An unknown error occurred while processing the data.');
      }
      setUploadSuccess(false);
    } finally {
      setIsLoadingUpload(false);
    }
  };

  const handleUploadError = (error: string) => {
    setIsLoadingUpload(false);
    setUploadError(error);
    setUploadSuccess(false);
  };

  const handleCostChange = (
    solarCost: number | null,
    batteryCost: number | null,
    peak: number | null,
    offPeak: number | null,
    feedInTariff: number | null,
    exportLimit: number | null
  ) => {
    setCostDetails({
      solarInstallationCost: (solarCost || 0) * installationSize,
      batteryInstallationCost: (batteryCost || 0) * batteryCapacity,
      peakCost: peak,
      offPeakCost: offPeak,
      feedInTariff: feedInTariff,
      exportLimit: exportLimit,
    });
  }

  const hasConsumptionData = energyCalculations && energyCalculations?.totalConsumption && energyCalculations.totalConsumption.length > 0;
  const hasSolarData = energyCalculations && energyCalculations?.generationSolar && energyCalculations.generationSolar.length > 0;

  return (
    <div className="app">
      <header>
        <h1>☀️ Solar Power Optimizer</h1>
        <p>Discover your home's solar potential</p>
        <div className="github-link-container">
          <a
            href="https://github.com/pbutland/solar"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
            aria-label="View source on GitHub"
          >
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="github-icon">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            <span className="github-link-text">View on GitHub</span>
          </a>
        </div>
      </header>
      <div className="input-section">
        <LocationMapInput onLocationChange={handleLocationChange} />
        {/* <LocationInput onLocationChange={handleLocationChange} /> */}
        <FileUpload 
          onDataLoaded={handleDataLoaded}
          onError={handleUploadError}
          onUploadStart={() => setIsLoadingUpload(true)}
        />
      </div>
      {uploadSuccess && (
        <div className="upload-success">
          ✅ Energy data uploaded successfully!
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
      {isLoadingUpload && (
        <div className="loading-message">
          ⏳ Processing your energy data...
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
          {!chartExpanded && (
            <InstallationControls 
              installationSize={installationSize}
              batteryCapacity={batteryCapacity}
              onInstallationSizeChange={setInstallationSize}
              onBatteryCapacityChange={setBatteryCapacity}
            />
          )}
          <div className="chart-section">
            <EnergyChart 
              energyCalculations={energyCalculations}
              chartExpanded={chartExpanded}
              onToggleChartExpanded={() => setChartExpanded(!chartExpanded)}
            />
          </div>
        </main>
      )}
      {hasSolarData && (
        <div className="input-section">
          <CostInputs installationSize={installationSize} batteryCapacity={batteryCapacity} onCostChange={handleCostChange} />
          <FinancialSummary
            energyCalculations={energyCalculations}
            solarInstallationCost={costDetails.solarInstallationCost}
            batteryInstallationCost={costDetails.batteryInstallationCost}
            earnings={costDetails.peakCost === null && costDetails.feedInTariff !== null}
          />
        </div>
      )}
      <HelpSection />
    </div>
  )
}

export default App
