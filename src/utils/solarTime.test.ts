import { calculateSunriseSunset } from './solarTime';

const testCases = [
//   {
//     name: 'equator on equinox',
//     date: new Date(Date.UTC(2025, 2, 20)),
//     latitude: 0,
//     longitude: 0,
//     expected: { sunrise: 360, sunset: 1080, solarNoon: 720 }
//   },
//   {
//     name: '40°N, 105°W in summer',
//     date: new Date(Date.UTC(2025, 5, 21)),
//     latitude: 40,
//     longitude: -105,
//     expected: { sunrise: 295, sunset: 1160 }
//   },
//   {
//     name: '40°N, 105°W in winter',
//     date: new Date(Date.UTC(2025, 11, 21)),
//     latitude: 40,
//     longitude: -105,
//     expected: { sunrise: 480, sunset: 900 }
//   },
//   {
//     name: 'high latitude in summer',
//     date: new Date(Date.UTC(2025, 5, 21)),
//     latitude: 65,
//     longitude: 25,
//     expected: { sunrise: 90, sunset: 1350 }
//   },
//   {
//     name: 'high latitude in winter',
//     date: new Date(Date.UTC(2025, 11, 21)),
//     latitude: 65,
//     longitude: 25,
//     expected: { sunrise: 720, sunset: 720 }
//   },
//   {
//     name: 'solar noon for Greenwich',
//     date: new Date(Date.UTC(2025, 6, 1)),
//     latitude: 51.48,
//     longitude: 0,
//     expected: { solarNoon: 723 }
//   },
  {
    name: 'test',
    date: new Date(2025, 7, 24),
    latitude: 38.907192,
    longitude: -77.036873,
    expected: { sunrise: 629, sunset: 1433, solarNoon: 1031 }
  }
];

describe('calculateSunriseSunset', () => {
  testCases.forEach(({ name, date, latitude, longitude, expected }) => {
    it(`calculates sunrise/sunset for ${name}`, () => {
      const result = calculateSunriseSunset(date, latitude, longitude);
      if (expected.sunrise !== undefined) {
        expect(result.sunrise).toBeCloseTo(expected.sunrise, 0);
      }
      if (expected.sunset !== undefined) {
        expect(result.sunset).toBeCloseTo(expected.sunset, 0);
      }
      if (expected.solarNoon !== undefined) {
        expect(result.solarNoon).toBeCloseTo(expected.solarNoon, 0);
      }
    });
  });
});
