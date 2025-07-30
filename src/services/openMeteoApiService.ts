// Stub for Open Meteo API implementation

/**
 * Fetch solar irradiance data from Open Meteo API
 * Returns array of { date: string, value: number }
 */
export async function fetchOpenMeteoIrradianceData(latitude: number, longitude: number): Promise<{ date: string; value: number }[]> {
  // TODO: Implement Open Meteo API fetch logic
  console.log(`Fetching solar data from Open Meteo API for lat: ${latitude}, lng: ${longitude}`);
  throw new Error('Open Meteo data source not yet implemented');
}
