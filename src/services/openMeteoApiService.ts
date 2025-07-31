// Interface for Open-Meteo solar irradiance JSON response
export interface OpenMeteoSolarIrradianceResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly: {
    time: string[];
    direct_normal_irradiance: number[];
    diffuse_radiation: number[];
    global_tilted_irradiance: number[];
    global_horizontal_irradiance: number[];
  };
}

/**
 * Fetch solar irradiance data from Open Meteo API
 * Returns array of { date: string, value: number }
 */
export async function fetchOpenMeteoIrradianceData(latitude: number, longitude: number): Promise<{ date: string; value: number }[]> {
  // Get date range for the past year (API has 5-day delay)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 5); // Account for API delay
  const startDate = new Date(endDate);
  startDate.setFullYear(startDate.getFullYear() - 1);
  startDate.setDate(startDate.getDate() + 1);

  // Format dates as YYYY-MM-DD for Open-Meteo API
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);

  // Construct Open-Meteo API URL
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDateStr}&end_date=${endDateStr}&hourly=shortwave_radiation&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo API request failed: ${response.status} ${response.statusText}`);
  }

  const data: any = await response.json();
  // Expect data.hourly.time (string[]), data.hourly.shortwave_radiation (number[])
  if (!data.hourly || !Array.isArray(data.hourly.time) || !Array.isArray(data.hourly.shortwave_radiation)) {
    throw new Error('Invalid Open-Meteo API response structure');
  }

  // Aggregate hourly values into daily totals
  const dailyTotals: Record<string, number> = {};
  for (let i = 0; i < data.hourly.time.length; i++) {
    const dateTime = data.hourly.time[i]; // e.g., "2024-07-27T00:00"
    const date = dateTime.split('T')[0].replace(/-/g, ''); // e.g., "20240727"
    const value = data.hourly.shortwave_radiation[i];
    if (!dailyTotals[date]) {
      dailyTotals[date] = 0;
    }
    dailyTotals[date] += value;
  }

  // Convert to array of { date, value }
  const result = Object.entries(dailyTotals)
    .map(([date, value]) => ({ date, value }));

  // If not 365 values, throw error
  if (result.length !== 365) {
    throw new Error(`Open-Meteo API did not return 365 daily values, received ${result.length}`);
  }

  // Validate all values are positive
  const hasInvalidValues = result.some(entry => entry.value <= 0 || isNaN(entry.value));
  if (hasInvalidValues) {
    console.warn('Found invalid irradiance values, replacing with interpolated values');
    const validValues = result.filter(entry => entry.value > 0 && !isNaN(entry.value)).map(entry => entry.value);
    const average = validValues.length > 0
      ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length
      : 5.0; // fallback
    for (let i = 0; i < result.length; i++) {
      if (result[i].value <= 0 || isNaN(result[i].value)) {
        result[i].value = average;
      }
    }
  }

  return result;
}
