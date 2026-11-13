/**
 * geo.test.ts
 *
 * Jest unit tests (jest-expo preset) of src/utils/geo.ts, the distance helpers of the tours screens.
 * - getDistance: haversine distance in meters. Checked against values that follow from the Earth radius used
 *   (1 degree of latitude = about 111.195 km), plus symmetry and the shrinking of longitude degrees away from the
 *   equator.
 * - formatDistance: m under 1 km (rounded to 10 m), km with one decimal under 10 km, whole km above.
 * Run with `npm test` (watch mode) or `npx jest --ci`.
 */

/* global describe, it, expect */
import { formatDistance, getDistance } from "@/src/utils/geo" // Helpers under test

// One degree of arc on the sphere of radius 6371 km
const ONE_DEGREE_M = 111195

// Distance between two coordinates
describe("getDistance", () => {
   it("is 0 between a point and itself", () => {
      const brussels = { latitude: 50.8503, longitude: 4.3517 }
      expect(getDistance(brussels, brussels)).toBe(0)
   })

   it("measures one degree of latitude", () => {
      const d = getDistance({ latitude: 50, longitude: 4 }, { latitude: 51, longitude: 4 })
      expect(d).toBeGreaterThan(ONE_DEGREE_M - 5)
      expect(d).toBeLessThan(ONE_DEGREE_M + 5)
   })

   it("measures one degree of longitude at the equator like one of latitude", () => {
      const d = getDistance({ latitude: 0, longitude: 10 }, { latitude: 0, longitude: 11 })
      expect(d).toBeGreaterThan(ONE_DEGREE_M - 5)
      expect(d).toBeLessThan(ONE_DEGREE_M + 5)
   })

   it("shrinks longitude degrees away from the equator (half at 60 degrees)", () => {
      const d = getDistance({ latitude: 60, longitude: 10 }, { latitude: 60, longitude: 11 })
      expect(d).toBeGreaterThan(ONE_DEGREE_M / 2 - 100)
      expect(d).toBeLessThan(ONE_DEGREE_M / 2 + 100)
   })

   it("gives the same distance in both directions", () => {
      const brussels = { latitude: 50.8503, longitude: 4.3517 }
      const ghent = { latitude: 51.0543, longitude: 3.7174 }
      expect(getDistance(brussels, ghent)).toBeCloseTo(getDistance(ghent, brussels), 6)
   })

   it("gives a realistic distance between two Belgian cities (Brussels to Ghent, about 50 km)", () => {
      const d = getDistance({ latitude: 50.8503, longitude: 4.3517 }, { latitude: 51.0543, longitude: 3.7174 })
      expect(d).toBeGreaterThan(48000)
      expect(d).toBeLessThan(52000)
   })
})

// Display of a distance
describe("formatDistance", () => {
   it("rounds to the nearest 10 m under 1 km", () => {
      expect(formatDistance(0)).toBe("0 m")
      expect(formatDistance(4)).toBe("0 m")
      expect(formatDistance(250)).toBe("250 m")
      expect(formatDistance(734)).toBe("730 m")
   })

   it("shows km with one decimal from 1 km to 10 km", () => {
      expect(formatDistance(1000)).toBe("1.0 km")
      expect(formatDistance(1540)).toBe("1.5 km")
      expect(formatDistance(9400)).toBe("9.4 km")
   })

   it("shows whole km from 10 km", () => {
      expect(formatDistance(10000)).toBe("10 km")
      expect(formatDistance(12600)).toBe("13 km")
      expect(formatDistance(250000)).toBe("250 km")
   })
})
