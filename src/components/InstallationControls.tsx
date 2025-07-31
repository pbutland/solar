import React from 'react';
import './InstallationControls.css';

interface InstallationControlsProps {
  installationSize: number;
  batteryCapacity: number;
  onInstallationSizeChange: (size: number) => void;
  onBatteryCapacityChange: (size: number) => void;
}

const InstallationControls: React.FC<InstallationControlsProps> = ({
  installationSize,
  batteryCapacity,
  onInstallationSizeChange,
  onBatteryCapacityChange,
}) => {
  // Calculate space requirements (7m² per kW)
  const spaceRequired = installationSize * 7;

  // Handle installation size slider change
  const handleInstallationSizeChange = (value: number) => {
    const roundedValue = Math.round(value * 2) / 2; // Round to nearest 0.5
    onInstallationSizeChange(roundedValue);
  };

  // Handle space required slider change
  const handleSpaceRequiredChange = (value: number) => {
    const roundedSpace = Math.round(value / 3.5) * 3.5; // Round to nearest 3.5
    const calculatedKW = roundedSpace / 7; // Convert back to kW
    const roundedKW = Math.round(calculatedKW * 2) / 2; // Round to nearest 0.5 kW
    onInstallationSizeChange(roundedKW);
  };

  // Handle battery size slider change
  const handleBatteryCapacityChange = (value: number) => {
    const roundedValue = Math.round(value * 2) / 2; // Round to nearest 0.5
    onBatteryCapacityChange(roundedValue);
  };

  return (
    <div className="controls-section">
      <div className="slider-group">
        <h3>Installation Size: {installationSize.toFixed(2)} kW</h3>
        <input
          type="range"
          min="0"
          max="25"
          step="0.5"
          value={installationSize}
          onChange={(e) => handleInstallationSizeChange(Number(e.target.value))}
        />
      </div>
      
      <div className="slider-group">
        <h3>Space Required: {spaceRequired.toFixed(2)} m²</h3>
        <input
          type="range"
          min="7"
          max="175"
          step="3.5"
          value={spaceRequired}
          onChange={(e) => handleSpaceRequiredChange(Number(e.target.value))}
        />
      </div>

      <div className="slider-group">
        <h3>Battery: {batteryCapacity} kWh</h3>
        <input
          type="range"
          min="0"
          max="40"
          step="1"
          value={batteryCapacity}
          onChange={(e) => handleBatteryCapacityChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
};

export default InstallationControls;
