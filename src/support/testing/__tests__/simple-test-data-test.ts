/**
 * Simple Test Data Management Test
 * Basic verification of the test data management system
 */

import { describe, it, expect } from 'vitest';
import { GeographicTestDataGenerator } from '../GeographicTestDataGenerator';
import { ProductionDataValidator } from '../ProductionDataValidator';
import { TestMode } from '../types';

describe('Simple Test Data Management', () => {
  it('should generate controlled test locations', () => {
    const locations = GeographicTestDataGenerator.generateTestLocations(TestMode.ISOLATED, 3);
    
    expect(locations).toHaveLength(3);
    expect(locations[0].name).toBe('Test Location A');
    expect(locations[0].isTestLocation).toBe(true);
  });

  it('should validate production test data correctly', () => {
    const validTicket = {
      id: 'test-ticket-1',
      customerId: 'test-customer-1',
      customerName: 'Bugs Bunny Customer - looneyTunesTest',
      location: { lat: 42.4619, lng: -92.3426 },
      address: '123 Test Street - looneyTunesTest',
      priority: 'medium' as any,
      serviceType: 'repair' as any,
      createdAt: new Date(),
      isTestData: true
    };

    const validation = ProductionDataValidator.validateTestTicket(validTicket);
    expect(validation.isValid).toBe(true);
  });

  it('should get test service areas', () => {
    const areas = ProductionDataValidator.getTestServiceAreas();
    expect(areas.length).toBeGreaterThan(0);
    expect(areas[0]).toHaveProperty('name');
    expect(areas[0]).toHaveProperty('bounds');
  });

  it('should get valid looney tunes characters', () => {
    const characters = ProductionDataValidator.getValidCharacters();
    expect(characters.length).toBeGreaterThan(0);
    expect(characters).toContain('Bugs Bunny');
  });
});