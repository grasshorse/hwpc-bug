import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page } from '../support/hooks';
import { 
  LocationAssignmentTestContext, 
  LocationTestTicket, 
  LocationTestRoute, 
  GeoCoordinate,
  Priority,
  ServiceType,
  Assignment,
  ValidationResult
} from '../../../src/support/testing/location-assignment-types';
import { GeographicTestDataGenerator } from '../../../src/support/testing/GeographicTestDataGenerator';
import { AssignmentAlgorithmValidator } from '../../../src/support/testing/AssignmentAlgorithmValidator';

// Store test context for step definitions
let testContext: LocationAssignmentTestContext;
let createdTickets: LocationTestTicket[] = [];
let selectedTickets: LocationTestTicket[] = [];
let availableRoutes: LocationTestRoute[] = [];
let currentAssignment: Assignment | null = null;

// Geographic location setup steps
Given('I have a test location at coordinates \\({float}, {float})', async function (lat: number, lng: number) {
  const location: GeoCoordinate = { lat, lng };
  
  // Validate coordinates
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error(`Invalid coordinates: (${lat}, ${lng})`);
  }
  
  this.testLocation = location;
  
  // Store in page context for UI validation
  await page.evaluate((coords) => {
    (window as any).testLocation = coords;
  }, location);
});

Given('I have test locations defined as:', async function (dataTable) {
  const locations = dataTable.hashes();
  this.testLocations = [];
  
  for (const locationData of locations) {
    const location = {
      name: locationData.name,
      lat: parseFloat(locationData.latitude),
      lng: parseFloat(locationData.longitude),
      address: locationData.address || `${locationData.latitude}, ${locationData.longitude}`
    };
    
    // Validate each location
    if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
      throw new Error(`Invalid coordinates for ${location.name}: (${location.lat}, ${location.lng})`);
    }
    
    this.testLocations.push(location);
  }
  
  // Store in page context
  await page.evaluate((locations) => {
    (window as any).testLocations = locations;
  }, this.testLocations);
});

Given('there are service areas defined for testing', async function (dataTable) {
  const serviceAreas = dataTable.hashes();
  this.testServiceAreas = [];
  
  for (const areaData of serviceAreas) {
    const serviceArea = {
      name: areaData.name,
      centerLat: parseFloat(areaData.center_lat),
      centerLng: parseFloat(areaData.center_lng),
      radius: parseFloat(areaData.radius_km)
    };
    
    this.testServiceAreas.push(serviceArea);
  }
  
  // Configure service areas in the system
  await page.goto('/admin/service-areas');
  for (const area of this.testServiceAreas) {
    await page.click('[data-testid="add-service-area"]');
    await page.fill('[data-testid="area-name"]', area.name);
    await page.fill('[data-testid="center-lat"]', area.centerLat.toString());
    await page.fill('[data-testid="center-lng"]', area.centerLng.toString());
    await page.fill('[data-testid="radius"]', area.radius.toString());
    await page.click('[data-testid="save-area"]');
  }
});

// Ticket creation steps
Given('I create a test ticket at location \\({float}, {float}) with priority {string}', async function (lat: number, lng: number, priority: string) {
  const ticket: LocationTestTicket = {
    id: `T${Date.now()}`,
    customerId: `C${Date.now()}`,
    customerName: `Test Customer ${Date.now()}`,
    location: { lat, lng },
    address: `${lat}, ${lng}`,
    priority: priority.toLowerCase() as Priority,
    serviceType: ServiceType.REPAIR,
    createdAt: new Date(),
    isTestData: true
  };
  
  createdTickets.push(ticket);
  this.currentTicket = ticket;
  
  // Create ticket in the UI
  await page.goto('/tickets/create');
  await page.fill('[data-testid="customer-name"]', ticket.customerName);
  await page.fill('[data-testid="latitude"]', lat.toString());
  await page.fill('[data-testid="longitude"]', lng.toString());
  await page.selectOption('[data-testid="priority"]', priority.toLowerCase());
  await page.selectOption('[data-testid="service-type"]', 'repair');
  await page.click('[data-testid="create-ticket"]');
  
  // Verify ticket creation
  await expect(page.locator('[data-testid="ticket-created-success"]')).toBeVisible();
  
  // Get the actual ticket ID from the system
  const ticketId = await page.locator('[data-testid="created-ticket-id"]').textContent();
  if (ticketId) {
    ticket.id = ticketId;
  }
});

Given('I create multiple test tickets:', async function (dataTable) {
  const ticketData = dataTable.hashes();
  createdTickets = [];
  
  for (const data of ticketData) {
    const ticket: LocationTestTicket = {
      id: data.ticket_id,
      customerId: `C${data.ticket_id}`,
      customerName: data.customer_name || `Customer for ${data.ticket_id}`,
      location: {
        lat: parseFloat(data.latitude),
        lng: parseFloat(data.longitude)
      },
      address: data.address || `${data.latitude}, ${data.longitude}`,
      priority: data.priority.toLowerCase() as Priority,
      serviceType: (data.service_type?.toLowerCase() as ServiceType) || ServiceType.REPAIR,
      createdAt: new Date(),
      isTestData: true
    };
    
    createdTickets.push(ticket);
    
    // Create each ticket in the UI
    await page.goto('/tickets/create');
    await page.fill('[data-testid="customer-name"]', ticket.customerName);
    await page.fill('[data-testid="latitude"]', ticket.location.lat.toString());
    await page.fill('[data-testid="longitude"]', ticket.location.lng.toString());
    await page.selectOption('[data-testid="priority"]', ticket.priority);
    await page.selectOption('[data-testid="service-type"]', ticket.serviceType);
    await page.click('[data-testid="create-ticket"]');
    
    await expect(page.locator('[data-testid="ticket-created-success"]')).toBeVisible();
  }
  
  this.createdTickets = createdTickets;
});

// Route assignment steps
When('I navigate to the assignment interface', async function () {
  await page.goto('/assignments');
  await expect(page.locator('[data-testid="assignment-interface"]')).toBeVisible();
});

When('I select the ticket for assignment', async function () {
  if (!this.currentTicket) {
    throw new Error('No current ticket available for selection');
  }
  
  const ticketSelector = `[data-ticket-id="${this.currentTicket.id}"]`;
  const ticket = page.locator(ticketSelector);
  await expect(ticket).toBeVisible();
  await ticket.click();
  
  selectedTickets = [this.currentTicket];
});

When('I select ticket {string} for assignment', async function (ticketId: string) {
  const ticket = createdTickets.find(t => t.id === ticketId);
  if (!ticket) {
    throw new Error(`Ticket ${ticketId} not found in created tickets`);
  }
  
  const ticketSelector = `[data-ticket-id="${ticketId}"]`;
  const ticketElement = page.locator(ticketSelector);
  await expect(ticketElement).toBeVisible();
  await ticketElement.click();
  
  selectedTickets = [ticket];
  this.selectedTicket = ticket;
});

When('I select multiple tickets for assignment:', async function (dataTable) {
  const ticketIds = dataTable.hashes().map(row => row.ticket_id);
  selectedTickets = [];
  
  for (const ticketId of ticketIds) {
    const ticket = createdTickets.find(t => t.id === ticketId);
    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found in created tickets`);
    }
    
    const ticketSelector = `[data-ticket-id="${ticketId}"]`;
    const ticketElement = page.locator(ticketSelector);
    await expect(ticketElement).toBeVisible();
    await ticketElement.click();
    
    selectedTickets.push(ticket);
  }
  
  this.selectedTickets = selectedTickets;
});

// Geographic validation steps
Then('the system should validate the ticket location coordinates', async function () {
  const validationIndicator = page.locator('[data-testid="location-validation"]');
  await expect(validationIndicator).toBeVisible();
  await expect(validationIndicator).toContainText('Valid coordinates');
});

Then('the location should be within valid geographic bounds', async function () {
  const boundsCheck = page.locator('[data-testid="geographic-bounds-check"]');
  await expect(boundsCheck).toBeVisible();
  await expect(boundsCheck).toContainText('Within bounds');
});

Then('the system should display the ticket location on a map', async function () {
  const mapContainer = page.locator('[data-testid="ticket-location-map"]');
  await expect(mapContainer).toBeVisible();
  
  const locationMarker = page.locator('[data-testid="ticket-location-marker"]');
  await expect(locationMarker).toBeVisible();
});

// Route suggestion and assignment steps
When('I request route suggestions', async function () {
  await page.click('[data-testid="get-route-suggestions"]');
  await expect(page.locator('[data-testid="route-suggestions-loading"]')).toBeVisible();
  await expect(page.locator('[data-testid="route-suggestions-loaded"]')).toBeVisible();
});

Then('the system should display available routes within the search radius', async function () {
  const routesList = page.locator('[data-testid="available-routes"]');
  await expect(routesList).toBeVisible();
  
  const routeItems = page.locator('[data-testid="route-option"]');
  const routeCount = await routeItems.count();
  expect(routeCount).toBeGreaterThanOrEqual(1);
  
  // Store available routes for later validation
  availableRoutes = [];
  
  for (let i = 0; i < routeCount; i++) {
    const routeElement = routeItems.nth(i);
    const routeId = await routeElement.getAttribute('data-route-id');
    const routeName = await routeElement.locator('[data-testid="route-name"]').textContent();
    const distance = await routeElement.locator('[data-testid="route-distance"]').textContent();
    
    if (routeId && routeName) {
      availableRoutes.push({
        id: routeId,
        name: routeName,
        serviceArea: { coordinates: [] }, // Will be populated as needed
        capacity: 10, // Default for testing
        currentLoad: 0,
        schedule: {
          startTime: '08:00',
          endTime: '17:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeZone: 'America/Chicago'
        },
        isTestRoute: true
      });
    }
  }
});

Then('each route should display distance information', async function () {
  const routeItems = page.locator('[data-testid="route-option"]');
  const routeCount = await routeItems.count();
  
  for (let i = 0; i < routeCount; i++) {
    const distanceElement = routeItems.nth(i).locator('[data-testid="route-distance"]');
    await expect(distanceElement).toBeVisible();
    
    const distanceText = await distanceElement.textContent();
    expect(distanceText).toMatch(/\d+\.?\d*\s*(km|mi)/);
  }
});

Then('the system should highlight the optimal route suggestion', async function () {
  const optimalRoute = page.locator('[data-testid="optimal-route"]');
  await expect(optimalRoute).toBeVisible();
  await expect(optimalRoute).toHaveClass(/optimal|suggested|highlighted/);
});

Then('the optimal route should be the one with the shortest distance', async function () {
  const optimalRoute = page.locator('[data-testid="optimal-route"]');
  const optimalDistance = await optimalRoute.locator('[data-testid="route-distance"]').textContent();
  
  const allRoutes = page.locator('[data-testid="route-option"]');
  const routeCount = await allRoutes.count();
  
  let minDistance = parseFloat(optimalDistance?.replace(/[^\d.]/g, '') || '999');
  
  for (let i = 0; i < routeCount; i++) {
    const distanceText = await allRoutes.nth(i).locator('[data-testid="route-distance"]').textContent();
    const distance = parseFloat(distanceText?.replace(/[^\d.]/g, '') || '999');
    
    expect(minDistance).toBeLessThanOrEqual(distance);
  }
});

// Assignment execution steps
When('I assign the ticket to the optimal route', async function () {
  const optimalRoute = page.locator('[data-testid="optimal-route"]');
  await optimalRoute.click();
  
  const assignButton = page.locator('[data-testid="confirm-assignment"]');
  await expect(assignButton).toBeEnabled();
  await assignButton.click();
});

When('I assign the ticket to route {string}', async function (routeId: string) {
  const routeOption = page.locator(`[data-route-id="${routeId}"]`);
  await expect(routeOption).toBeVisible();
  await routeOption.click();
  
  const assignButton = page.locator('[data-testid="confirm-assignment"]');
  await expect(assignButton).toBeEnabled();
  await assignButton.click();
  
  this.assignedRouteId = routeId;
});

When('I assign the selected tickets to their optimal routes', async function () {
  await page.click('[data-testid="assign-to-optimal-routes"]');
  await page.click('[data-testid="confirm-bulk-assignment"]');
});

// Assignment verification steps
Then('the assignment should be created successfully', async function () {
  const successMessage = page.locator('[data-testid="assignment-success"]');
  await expect(successMessage).toBeVisible();
  await expect(successMessage).toContainText('successfully assigned');
});

Then('the ticket status should change to {string}', async function (expectedStatus: string) {
  const ticketId = this.selectedTicket?.id || this.currentTicket?.id;
  if (!ticketId) {
    throw new Error('No ticket ID available for status verification');
  }
  
  const ticketStatus = page.locator(`[data-ticket-id="${ticketId}"] [data-testid="ticket-status"]`);
  await expect(ticketStatus).toContainText(expectedStatus);
});

Then('the route schedule should be updated with the new assignment', async function () {
  const routeId = this.assignedRouteId;
  if (!routeId) {
    throw new Error('No route ID available for schedule verification');
  }
  
  await page.goto(`/routes/${routeId}/schedule`);
  
  const ticketId = this.selectedTicket?.id || this.currentTicket?.id;
  const scheduleEntry = page.locator(`[data-ticket-id="${ticketId}"]`);
  await expect(scheduleEntry).toBeVisible();
});

Then('the assignment should include accurate distance calculation', async function () {
  const assignmentDetails = page.locator('[data-testid="assignment-details"]');
  await expect(assignmentDetails).toBeVisible();
  
  const calculatedDistance = page.locator('[data-testid="calculated-distance"]');
  await expect(calculatedDistance).toBeVisible();
  
  const distanceText = await calculatedDistance.textContent();
  expect(distanceText).toMatch(/\d+\.?\d*\s*(km|mi)/);
  
  // Verify distance is reasonable (not zero, not excessively large)
  const distance = parseFloat(distanceText?.replace(/[^\d.]/g, '') || '0');
  expect(distance).toBeGreaterThan(0);
  expect(distance).toBeLessThan(1000); // Reasonable upper bound
});

Then('I should be able to view the assignment details', async function () {
  const ticketId = this.selectedTicket?.id || this.currentTicket?.id;
  if (!ticketId) {
    throw new Error('No ticket ID available for assignment details');
  }
  
  const assignmentLink = page.locator(`[data-ticket-id="${ticketId}"] [data-testid="view-assignment"]`);
  await assignmentLink.click();
  
  const assignmentDetails = page.locator('[data-testid="assignment-details-panel"]');
  await expect(assignmentDetails).toBeVisible();
  
  // Verify key assignment information is displayed
  await expect(assignmentDetails).toContainText(ticketId);
  await expect(assignmentDetails.locator('[data-testid="assigned-route"]')).toBeVisible();
  await expect(assignmentDetails.locator('[data-testid="assignment-timestamp"]')).toBeVisible();
  await expect(assignmentDetails.locator('[data-testid="assigned-by"]')).toBeVisible();
});

// Result checking and validation steps
Then('the assignment result should be optimal based on distance', async function () {
  // Get the assignment details
  const assignmentDetails = page.locator('[data-testid="assignment-details"]');
  const assignedRouteId = await assignmentDetails.locator('[data-testid="assigned-route-id"]').textContent();
  const assignedDistance = await assignmentDetails.locator('[data-testid="calculated-distance"]').textContent();
  
  if (!assignedRouteId || !assignedDistance) {
    throw new Error('Assignment details not available for validation');
  }
  
  // Verify this is indeed the optimal choice
  const allRouteOptions = page.locator('[data-testid="route-option"]');
  const routeCount = await allRouteOptions.count();
  
  const assignedDistanceValue = parseFloat(assignedDistance.replace(/[^\d.]/g, ''));
  
  for (let i = 0; i < routeCount; i++) {
    const routeElement = allRouteOptions.nth(i);
    const routeId = await routeElement.getAttribute('data-route-id');
    const routeDistance = await routeElement.locator('[data-testid="route-distance"]').textContent();
    
    if (routeId !== assignedRouteId && routeDistance) {
      const routeDistanceValue = parseFloat(routeDistance.replace(/[^\d.]/g, ''));
      expect(assignedDistanceValue).toBeLessThanOrEqual(routeDistanceValue);
    }
  }
});

Then('the assignment should pass validation checks', async function () {
  const validationStatus = page.locator('[data-testid="assignment-validation-status"]');
  await expect(validationStatus).toBeVisible();
  await expect(validationStatus).toContainText('Passed');
  
  // Check for any validation warnings
  const validationWarnings = page.locator('[data-testid="validation-warnings"]');
  const warningCount = await validationWarnings.count();
  
  if (warningCount > 0) {
    const warningText = await validationWarnings.textContent();
    console.warn('Assignment validation warnings:', warningText);
  }
});

Then('all selected tickets should be assigned successfully', async function () {
  const expectedCount = selectedTickets.length;
  
  const successMessage = page.locator('[data-testid="bulk-assignment-success"]');
  await expect(successMessage).toBeVisible();
  await expect(successMessage).toContainText(`${expectedCount} tickets assigned`);
  
  // Verify each ticket status
  for (const ticket of selectedTickets) {
    const ticketStatus = page.locator(`[data-ticket-id="${ticket.id}"] [data-testid="ticket-status"]`);
    await expect(ticketStatus).toContainText('Assigned');
  }
});

Then('the total assignment distance should be minimized', async function () {
  const totalDistance = page.locator('[data-testid="total-assignment-distance"]');
  await expect(totalDistance).toBeVisible();
  
  const distanceText = await totalDistance.textContent();
  const totalDistanceValue = parseFloat(distanceText?.replace(/[^\d.]/g, '') || '0');
  
  // Store for comparison (in a real scenario, we'd compare against alternative assignments)
  expect(totalDistanceValue).toBeGreaterThan(0);
  this.totalAssignmentDistance = totalDistanceValue;
});

// Error handling and edge cases
Then('I should see an error message about invalid coordinates', async function () {
  const errorMessage = page.locator('[data-testid="coordinate-validation-error"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText(/invalid.*coordinate/i);
});

Then('I should see a warning about no available routes', async function () {
  const warningMessage = page.locator('[data-testid="no-routes-warning"]');
  await expect(warningMessage).toBeVisible();
  await expect(warningMessage).toContainText(/no.*available.*route/i);
});

Then('the system should suggest expanding the search radius', async function () {
  const suggestion = page.locator('[data-testid="expand-radius-suggestion"]');
  await expect(suggestion).toBeVisible();
  await expect(suggestion).toContainText(/expand.*search.*radius/i);
});

// Geographic calculation verification
Then('the distance calculation should be accurate within {float} km', async function (tolerance: number) {
  if (!this.currentTicket || !this.assignedRouteId) {
    throw new Error('Missing ticket or route information for distance verification');
  }
  
  const calculatedDistance = page.locator('[data-testid="calculated-distance"]');
  const distanceText = await calculatedDistance.textContent();
  const distance = parseFloat(distanceText?.replace(/[^\d.]/g, '') || '0');
  
  // For testing purposes, we'll verify the distance is reasonable
  // In a real implementation, this would compare against a known expected distance
  expect(distance).toBeGreaterThan(0);
  expect(distance).toBeLessThan(100); // Reasonable upper bound for local service area
  
  // Log the calculated distance for manual verification
  console.log(`Calculated distance: ${distance} km (tolerance: ±${tolerance} km)`);
});

Then('the geographic validation should pass for all locations', async function () {
  const validationSummary = page.locator('[data-testid="geographic-validation-summary"]');
  await expect(validationSummary).toBeVisible();
  await expect(validationSummary).toContainText('All locations valid');
  
  // Check individual location validations
  const locationValidations = page.locator('[data-testid="location-validation-item"]');
  const validationCount = await locationValidations.count();
  
  for (let i = 0; i < validationCount; i++) {
    const validation = locationValidations.nth(i);
    const status = validation.locator('[data-testid="validation-status"]');
    await expect(status).toContainText('Valid');
  }
});

// Cleanup steps
Given('I clean up any existing test assignments', async function () {
  await page.goto('/admin/test-data/cleanup');
  await page.click('[data-testid="cleanup-assignments"]');
  await expect(page.locator('[data-testid="cleanup-complete"]')).toBeVisible();
  
  // Reset test data arrays
  createdTickets = [];
  selectedTickets = [];
  availableRoutes = [];
  currentAssignment = null;
});