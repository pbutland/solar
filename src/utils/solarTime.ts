interface SolarTime {
  sunrise: number; // UTC minutes
  sunset: number; // UTC minutes
  solarNoon: number; // UTC minutes
}

/**
 * Calculates sunrise and sunset times (UTC minutes) for a given date and location.
 * @param date - The date for calculation (JavaScript Date object)
 * @param latitude - Latitude in degrees
 * @param longitude - Longitude in degrees (positive east of Prime Meridian)
 * @returns { sunrise: number, sunset: number, solarNoon: number }
 */
export function calculateSunriseSunset(
  date: Date,
  latitude: number,
  longitude: number,
): SolarTime {
  // Helper functions
  const toRadians = (deg: number) => deg * Math.PI / 180;
  const toDegrees = (rad: number) => rad * 180 / Math.PI;

  // Day of year
  const dayOfYear = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(date.getFullYear(), 0, 0)) / 86400000
  );

  // Fractional year (gamma)
  const hour = date.getUTCHours();
  const gamma =
    (2 * Math.PI / 365) *
    (dayOfYear - 1 + (hour - 12) / 24);

  // Equation of time (eqtime, in minutes)
  const eqtime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  // Solar declination (decl, in radians)
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  // Zenith for sunrise/sunset (degrees)
  const zenith = 90.833;

  // Calculate hour angle (ha, degrees)
  const latRad = toRadians(latitude);
  const declDeg = decl; // decl is already in radians

  const cosH =
    (Math.cos(toRadians(zenith)) /
      (Math.cos(latRad) * Math.cos(declDeg))) -
    Math.tan(latRad) * Math.tan(declDeg);

  // Clamp cosH to [-1, 1] to avoid NaN from acos
  const cosHClamped = Math.max(-1, Math.min(1, cosH));
  const ha = toDegrees(Math.acos(cosHClamped));

  // Sunrise and sunset UTC times (in minutes)
  const sunrise =
    720 - 4 * (longitude + ha) - eqtime;
  const sunset =
    720 - 4 * (longitude - ha) - eqtime;

  // Solar noon (in minutes)
  const solarNoon = 720 - 4 * longitude - eqtime;

  return { sunrise, sunset, solarNoon };
}