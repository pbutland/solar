import { useState } from 'react'
import './LocationInput.css'

interface LocationInputProps {
  onLocationChange?: (latitude: number | null, longitude: number | null) => void
}

function LocationInput({ onLocationChange }: LocationInputProps) {
  const [latitude, setLatitude] = useState<string>('')
  const [longitude, setLongitude] = useState<string>('')

  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLatitude(value)
    
    const numValue = value === '' ? null : parseFloat(value)
    if (onLocationChange && (!isNaN(numValue!) || numValue === null)) {
      const longValue = longitude === '' ? null : parseFloat(longitude)
      onLocationChange(numValue, isNaN(longValue!) ? null : longValue)
    }
  }

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLongitude(value)
    
    const numValue = value === '' ? null : parseFloat(value)
    if (onLocationChange && (!isNaN(numValue!) || numValue === null)) {
      const latValue = latitude === '' ? null : parseFloat(latitude)
      onLocationChange(isNaN(latValue!) ? null : latValue, numValue)
    }
  }

  return (
    <div className="latlong-section">
      <h3>Location Coordinates</h3>
      {/* <label htmlFor="latitude">Latitude:</label> */}
      <input 
        type="number" 
        id="latitude" 
        name="latitude" 
        step="any" 
        min="-90" 
        max="90" 
        placeholder="Latitude (e.g. -37.8136)"
        value={latitude}
        onChange={handleLatitudeChange}
      />
      {/* <label htmlFor="longitude">Longitude:</label> */}
      <input 
        type="number" 
        id="longitude" 
        name="longitude" 
        step="any" 
        min="-180" 
        max="180" 
        placeholder="Longitude (e.g. 144.9631)"
        value={longitude}
        onChange={handleLongitudeChange}
      />
    </div>
  )
}

export default LocationInput
