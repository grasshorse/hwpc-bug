/**
 * Geographic Utilities for Location Assignment Testing
 * Provides coordinate handling, validation, and distance calculations
 */

import { GeoCoordinate, GeoPolygon, ValidationResult, GeographicCalculationMode } from './location-assignment-types';

export class GeographicUtilities {
  private static readonly EARTH_RADIUS_KM = 6371;
  private static readonly VALID_LAT_RANGE = { min: -90, max: 90 };
  private static readonly VALID_LNG_RANGE = { min: -180, max: 180 };

  /**
   * Validates a geographic coordinate
   */
  public static validateCoordinate(coordinate: GeoCoordinate): ValidationResult {
    const issues: string[] = [];

    // Check latitude bounds
    if (coordinate.lat < this.VALID_LAT_RANGE.min || coordinate.lat > this.VALID_LAT_RANGE.max) {
      issues.push(`Latitude ${coordinate.lat} is outside valid range [${this.VALID_LAT_RANGE.min}, ${this.VALID_LAT_RANGE.max}]`);
    }

    // Check longitude bounds
    if (coordinate.lng < this.VALID_LNG_RANGE.min || coordinate.lng > this.VALID_LNG_RANGE.max) {
      issues.push(`Longitude ${coordinate.lng} is outside valid range [${this.VALID_LNG_RANGE.min}, ${this.VALID_LNG_RANGE.max}]`);
    }

    // Check for NaN or undefined values
    if (isNaN(coordinate.lat) || coordinate.lat === undefined || coordinate.lat === null) {
      issues.push('Latitude is not a valid number');
    }

    if (isNaN(coordinate.lng) || coordinate.lng === undefined || coordinate.lng === null) {
      issues.push('Longitude is not a valid number');
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Calculates Euclidean (straight-line) distance between two coordinates
   * Uses Haversine formula for accuracy
   */
  public static calculateEuclideanDistance(from: GeoCoordinate, to: GeoCoordinate): number {
    // Validate coordinates first
    const fromValidation = this.validateCoordinate(from);
    const toValidation = this.validateCoordinate(to);

    if (!fromValidation.isValid || !toValidation.isValid) {
      throw new Error(`Invalid coordinates: ${fromValidation.issues?.join(', ')} ${toValidation.issues?.join(', ')}`);
    }

    // Convert degrees to radians
    const lat1Rad = this.degreesToRadians(from.lat);
    const lat2Rad = this.degreesToRadians(to.lat);
    const deltaLatRad = this.degreesToRadians(to.lat - from.lat);
    const deltaLngRad = this.degreesToRadians(to.lng - from.lng);

    // Haversine formula
    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return this.EARTH_RADIUS_KM * c;
  }

  /**
   * Checks if a point is inside a polygon using ray casting algorithm
   */
  public static isPointInPolygon(point: GeoCoordinate, polygon: GeoPolygon): boolean {
    const validation = this.validateCoordinate(point);
    if (!validation.isValid) {
      return false;
    }

    if (!polygon.coordinates || polygon.coordinates.length < 3) {
      return false;
    }

    let inside = false;
    const x = point.lng;
    const y = point.lat;

    for (let i = 0, j = polygon.coordinates.length - 1; i < polygon.coordinates.length; j = i++) {
      const xi = polygon.coordinates[i].lng;
      const yi = polygon.coordinates[i].lat;
      const xj = polygon.coordinates[j].lng;
      const yj = polygon.coordinates[j].lat;

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Finds the closest point in a list of coordinates
   */
  public static findClosestPoint(target: GeoCoordinate, points: GeoCoordinate[]): {
    point: GeoCoordinate;
    distance: number;
    index: number;
  } | null {
    if (!points || points.length === 0) {
      return null;
    }

    let closestPoint = points[0];
    let closestDistance = this.calculateEuclideanDistance(target, points[0]);
    let closestIndex = 0;

    for (let i = 1; i < points.length; i++) {
      const distance = this.calculateEuclideanDistance(target, points[i]);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = points[i];
        closestIndex = i;
      }
    }

    return {
      point: closestPoint,
      distance: closestDistance,
      index: closestIndex
    };
  }

  /**
   * Creates a bounding box around a coordinate with specified radius
   */
  public static createBoundingBox(center: GeoCoordinate, radiusKm: number): {
    northEast: GeoCoordinate;
    southWest: GeoCoordinate;
  } {
    const validation = this.validateCoordinate(center);
    if (!validation.isValid) {
      throw new Error(`Invalid center coordinate: ${validation.issues?.join(', ')}`);
    }

    if (radiusKm <= 0) {
      throw new Error('Radius must be positive');
    }

    // Approximate degrees per kilometer
    const latDegreesPerKm = 1 / 111.32;
    const lngDegreesPerKm = 1 / (111.32 * Math.cos(this.degreesToRadians(center.lat)));

    const latOffset = radiusKm * latDegreesPerKm;
    const lngOffset = radiusKm * lngDegreesPerKm;

    return {
      northEast: {
        lat: center.lat + latOffset,
        lng: center.lng + lngOffset
      },
      southWest: {
        lat: center.lat - latOffset,
        lng: center.lng - lngOffset
      }
    };
  }

  /**
   * Generates test coordinates within a specified area
   */
  public static generateTestCoordinates(
    center: GeoCoordinate,
    radiusKm: number,
    count: number,
    seed?: number
  ): GeoCoordinate[] {
    const validation = this.validateCoordinate(center);
    if (!validation.isValid) {
      throw new Error(`Invalid center coordinate: ${validation.issues?.join(', ')}`);
    }

    if (count <= 0) {
      return [];
    }

    const coordinates: GeoCoordinate[] = [];
    
    // Use seed for deterministic generation in tests
    let random = seed !== undefined ? this.seededRandom(seed) : Math.random;

    for (let i = 0; i < count; i++) {
      // Generate random point within circle
      const angle = random() * 2 * Math.PI;
      const distance = Math.sqrt(random()) * radiusKm;

      // Convert to lat/lng offset
      const latOffset = (distance * Math.cos(angle)) / 111.32;
      const lngOffset = (distance * Math.sin(angle)) / (111.32 * Math.cos(this.degreesToRadians(center.lat)));

      coordinates.push({
        lat: center.lat + latOffset,
        lng: center.lng + lngOffset
      });
    }

    return coordinates;
  }

  /**
   * Creates predefined test coordinates for controlled testing
   */
  public static createControlledTestCoordinates(): GeoCoordinate[] {
    return [
      { lat: 42.5000, lng: -92.5000 }, // Test Location A
      { lat: 42.5100, lng: -92.5100 }, // Test Location B - ~1.57km from A
      { lat: 42.5200, lng: -92.5000 }, // Test Location C - ~2.22km from A
      { lat: 42.4900, lng: -92.4900 }, // Test Location D - ~1.57km from A
      { lat: 42.5050, lng: -92.4950 }, // Test Location E - ~0.79km from A
    ];
  }

  /**
   * Creates test service areas for controlled testing
   */
  public static createTestServiceAreas(): GeoPolygon[] {
    return [
      {
        name: 'Test Service Area North',
        coordinates: [
          { lat: 42.5200, lng: -92.5200 },
          { lat: 42.5200, lng: -92.4800 },
          { lat: 42.5400, lng: -92.4800 },
          { lat: 42.5400, lng: -92.5200 },
          { lat: 42.5200, lng: -92.5200 } // Close the polygon
        ]
      },
      {
        name: 'Test Service Area South',
        coordinates: [
          { lat: 42.4800, lng: -92.5200 },
          { lat: 42.4800, lng: -92.4800 },
          { lat: 42.5000, lng: -92.4800 },
          { lat: 42.5000, lng: -92.5200 },
          { lat: 42.4800, lng: -92.5200 } // Close the polygon
        ]
      }
    ];
  }

  /**
   * Validates a polygon structure
   */
  public static validatePolygon(polygon: GeoPolygon): ValidationResult {
    const issues: string[] = [];

    if (!polygon.coordinates || !Array.isArray(polygon.coordinates)) {
      issues.push('Polygon coordinates must be an array');
      return { isValid: false, issues };
    }

    if (polygon.coordinates.length < 3) {
      issues.push('Polygon must have at least 3 coordinates');
    }

    // Validate each coordinate
    for (let i = 0; i < polygon.coordinates.length; i++) {
      const coordValidation = this.validateCoordinate(polygon.coordinates[i]);
      if (!coordValidation.isValid) {
        issues.push(`Coordinate ${i}: ${coordValidation.issues?.join(', ')}`);
      }
    }

    // Check if polygon is closed (first and last points should be the same)
    if (polygon.coordinates.length > 0) {
      const first = polygon.coordinates[0];
      const last = polygon.coordinates[polygon.coordinates.length - 1];
      
      if (Math.abs(first.lat - last.lat) > 0.000001 || Math.abs(first.lng - last.lng) > 0.000001) {
        issues.push('Polygon should be closed (first and last coordinates should be the same)');
      }
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Converts degrees to radians
   */
  private static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Simple seeded random number generator for deterministic testing
   */
  private static seededRandom(seed: number): () => number {
    let currentSeed = seed;
    return function() {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }

  /**
   * Formats a coordinate for display
   */
  public static formatCoordinate(coordinate: GeoCoordinate, precision: number = 6): string {
    return `${coordinate.lat.toFixed(precision)}, ${coordinate.lng.toFixed(precision)}`;
  }

  /**
   * Calculates the center point of multiple coordinates
   */
  public static calculateCenterPoint(coordinates: GeoCoordinate[]): GeoCoordinate {
    if (!coordinates || coordinates.length === 0) {
      throw new Error('Cannot calculate center of empty coordinate array');
    }

    let totalLat = 0;
    let totalLng = 0;

    for (const coord of coordinates) {
      const validation = this.validateCoordinate(coord);
      if (!validation.isValid) {
        throw new Error(`Invalid coordinate in array: ${validation.issues?.join(', ')}`);
      }
      totalLat += coord.lat;
      totalLng += coord.lng;
    }

    return {
      lat: totalLat / coordinates.length,
      lng: totalLng / coordinates.length
    };
  }
}