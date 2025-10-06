import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page } from '../support/hooks';
import { 
  LocationTestTicket, 
  LocationTestRoute, 
  Assignment,
  Priority,
  ServiceType,
  ConflictResolution
} from '../../../src/support/testing/location-assignment-types';

// Store bulk assignment context
let bulkTickets: LocationTestTicket[] = [];
let bulkRoutes: LocationTestRoute[] = [];
let bulkAssignments: Assignment[] = [];
let capacityConstraints: Map<string, { current: number; maximum: number }> = new Map();
let conflictResolutions: ConflictResolution[] = [];

// Bulk ticket selection steps
Given('I have {int} unassigned tickets in the system', async function (ticketCount: number) {
  bulkTickets = [];
  
  // Navigate to bulk ticket creation
  await page.goto('/admin/bulk-data/tickets');
  await page.fill('[data-testid="ticket-count"]', ticketCount.toString());
  await page.selectOption('[data-testid="distribution-pattern"]', 'random');
  await page.click('[data-testid="generate-tickets"]');
  
  await expect(page.locator('[data-testid="generation-complete"]')).toBeVisible();
  
  // Verify tickets were created
  await page.goto('/assignments');
  const unassignedTickets = page.locator('[data-testid="unassigned-ticket"]');
  const actualCount = await unassignedTickets.count();
  expect(actualCount).toBeGreaterThanOrEqual(ticketCount);
  
  // Store ticket information
  for (let i = 0; i < Math.min(actualCount, ticketCount); i++) {
    const ticketElement = unassignedTickets.nth(i);
    const ticketId = await ticketElement.getAttribute('data-ticket-id');
    const customerName = await ticketElement.locator('[data-testid="customer-name"]').textContent();
    
    if (ticketId && customerName) {
      bulkTickets.push({
        id: ticketId,
        customerId: `C${ticketId}`,
        customerName,
        location: { lat: 42.5, lng: -92.5 }, // Default test location
        address: 'Test Address',
        priority: Priority.MEDIUM,
        serviceType: ServiceType.REPAIR,
        createdAt: new Date(),
        isTestData: true
      });
    }
  }
  
  this.bulkTicketCount = bulkTickets.length;
});

Given('I have tickets distributed across different geographic areas:', async function (dataTable) {
  const ticketData = dataTable.hashes();
  bulkTickets = [];
  
  for (const data of ticketData) {
    const ticket: LocationTestTicket = {
      id: data.ticket_id,
      customerId: `C${data.ticket_id}`,
      customerName: data.customer_name || `Customer ${data.ticket_id}`,
      location: {
        lat: parseFloat(data.latitude),
        lng: parseFloat(data.longitude)
      },
      address: data.address || `${data.latitude}, ${data.longitude}`,
      priority: (data.priority?.toLowerCase() as Priority) || Priority.MEDIUM,
      serviceType: (data.service_type?.toLowerCase() as ServiceType) || ServiceType.REPAIR,
      createdAt: new Date(),
      isTestData: true
    };
    
    bulkTickets.push(ticket);
    
    // Create ticket in the system
    await page.goto('/tickets/create');
    await page.fill('[data-testid="customer-name"]', ticket.customerName);
    await page.fill('[data-testid="latitude"]', ticket.location.lat.toString());
    await page.fill('[data-testid="longitude"]', ticket.location.lng.toString());
    await page.selectOption('[data-testid="priority"]', ticket.priority);
    await page.selectOption('[data-testid="service-type"]', ticket.serviceType);
    await page.click('[data-testid="create-ticket"]');
    
    await expect(page.locator('[data-testid="ticket-created-success"]')).toBeVisible();
  }
  
  this.bulkTickets = bulkTickets;
});

Given('I have tickets with different priority levels:', async function (dataTable) {
  const priorityData = dataTable.hashes();
  bulkTickets = [];
  
  for (const data of priorityData) {
    const ticket: LocationTestTicket = {
      id: data.ticket_id,
      customerId: `C${data.ticket_id}`,
      customerName: `Customer ${data.ticket_id}`,
      location: {
        lat: parseFloat(data.latitude),
        lng: parseFloat(data.longitude)
      },
      address: `${data.latitude}, ${data.longitude}`,
      priority: data.priority.toLowerCase() as Priority,
      serviceType: ServiceType.REPAIR,
      createdAt: new Date(),
      isTestData: true
    };
    
    bulkTickets.push(ticket);
    
    // Create ticket with specific priority
    await page.goto('/tickets/create');
    await page.fill('[data-testid="customer-name"]', ticket.customerName);
    await page.fill('[data-testid="latitude"]', ticket.location.lat.toString());
    await page.fill('[data-testid="longitude"]', ticket.location.lng.toString());
    await page.selectOption('[data-testid="priority"]', ticket.priority);
    await page.click('[data-testid="create-ticket"]');
    
    await expect(page.locator('[data-testid="ticket-created-success"]')).toBeVisible();
  }
});

// Bulk selection operations
When('I select all unassigned tickets', async function () {
  await page.goto('/assignments');
  await page.click('[data-testid="select-all-tickets"]');
  
  // Verify selection
  const selectedTickets = page.locator('[data-testid="unassigned-ticket"].selected');
  const selectedCount = await selectedTickets.count();
  
  expect(selectedCount).toBeGreaterThan(0);
  this.selectedTicketCount = selectedCount;
});

When('I select tickets by geographic area {string}', async function (areaName: string) {
  await page.goto('/assignments');
  await page.selectOption('[data-testid="area-filter"]', areaName);
  await page.click('[data-testid="apply-area-filter"]');
  
  // Select all tickets in the filtered area
  await page.click('[data-testid="select-filtered-tickets"]');
  
  const selectedTickets = page.locator('[data-testid="unassigned-ticket"].selected');
  const selectedCount = await selectedTickets.count();
  
  this.selectedTicketCount = selectedCount;
});

When('I select tickets with priority {string}', async function (priority: string) {
  await page.goto('/assignments');
  await page.selectOption('[data-testid="priority-filter"]', priority.toLowerCase());
  await page.click('[data-testid="apply-priority-filter"]');
  
  // Select all tickets with the specified priority
  await page.click('[data-testid="select-filtered-tickets"]');
  
  const selectedTickets = page.locator('[data-testid="unassigned-ticket"].selected');
  const selectedCount = await selectedTickets.count();
  
  this.selectedTicketCount = selectedCount;
});

When('I select {int} tickets randomly', async function (count: number) {
  await page.goto('/assignments');
  
  const availableTickets = page.locator('[data-testid="unassigned-ticket"]');
  const availableCount = await availableTickets.count();
  const selectCount = Math.min(count, availableCount);
  
  // Select random tickets
  for (let i = 0; i < selectCount; i++) {
    await availableTickets.nth(i).click();
  }
  
  this.selectedTicketCount = selectCount;
});

// Bulk assignment operations
When('I initiate bulk assignment mode', async function () {
  await page.click('[data-testid="bulk-assignment-mode"]');
  await expect(page.locator('[data-testid="bulk-assignment-panel"]')).toBeVisible();
});

When('I request optimal route distribution', async function () {
  await page.click('[data-testid="optimize-distribution"]');
  await expect(page.locator('[data-testid="optimization-in-progress"]')).toBeVisible();
  await expect(page.locator('[data-testid="optimization-complete"]')).toBeVisible();
});

When('I confirm the bulk assignment', async function () {
  await page.click('[data-testid="confirm-bulk-assignment"]');
  await expect(page.locator('[data-testid="bulk-assignment-processing"]')).toBeVisible();
});

When('I execute the bulk assignment', async function () {
  await page.click('[data-testid="execute-bulk-assignment"]');
  
  // Wait for processing to complete
  await expect(page.locator('[data-testid="bulk-assignment-complete"]')).toBeVisible({ timeout: 30000 });
});

// Route capacity setup and validation
Given('I have routes with the following capacities:', async function (dataTable) {
  const routeData = dataTable.hashes();
  bulkRoutes = [];
  capacityConstraints.clear();
  
  for (const data of routeData) {
    const route: LocationTestRoute = {
      id: data.route_id,
      name: data.route_name,
      serviceArea: { coordinates: [] }, // Simplified for testing
      capacity: parseInt(data.capacity),
      currentLoad: parseInt(data.current_load || '0'),
      schedule: {
        startTime: '08:00',
        endTime: '17:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        timeZone: 'America/Chicago'
      },
      isTestRoute: true
    };
    
    bulkRoutes.push(route);
    capacityConstraints.set(route.id, {
      current: route.currentLoad,
      maximum: route.capacity
    });
    
    // Create or update route in the system
    await page.goto('/admin/routes');
    await page.fill('[data-testid="route-search"]', route.name);
    await page.click('[data-testid="search-button"]');
    
    const existingRoute = page.locator(`[data-route-name="${route.name}"]`);
    const routeExists = await existingRoute.count() > 0;
    
    if (!routeExists) {
      await page.click('[data-testid="add-route"]');
      await page.fill('[data-testid="route-name"]', route.name);
    } else {
      await existingRoute.click();
      await page.click('[data-testid="edit-route"]');
    }
    
    await page.fill('[data-testid="route-capacity"]', route.capacity.toString());
    await page.fill('[data-testid="current-load"]', route.currentLoad.toString());
    await page.click('[data-testid="save-route"]');
  }
  
  this.bulkRoutes = bulkRoutes;
});

Given('route {string} is at full capacity', async function (routeId: string) {
  const route = bulkRoutes.find(r => r.id === routeId);
  if (!route) {
    throw new Error(`Route ${routeId} not found`);
  }
  
  // Set route to full capacity
  route.currentLoad = route.capacity;
  capacityConstraints.set(routeId, {
    current: route.capacity,
    maximum: route.capacity
  });
  
  // Update in the system
  await page.goto('/admin/routes');
  await page.fill('[data-testid="route-search"]', route.name);
  await page.click('[data-testid="search-button"]');
  
  const routeElement = page.locator(`[data-route-id="${routeId}"]`);
  await routeElement.click();
  await page.click('[data-testid="edit-route"]');
  await page.fill('[data-testid="current-load"]', route.capacity.toString());
  await page.click('[data-testid="save-route"]');
});

Given('route {string} has {int} available slots', async function (routeId: string, availableSlots: number) {
  const route = bulkRoutes.find(r => r.id === routeId);
  if (!route) {
    throw new Error(`Route ${routeId} not found`);
  }
  
  route.currentLoad = route.capacity - availableSlots;
  capacityConstraints.set(routeId, {
    current: route.currentLoad,
    maximum: route.capacity
  });
  
  // Update in the system
  await page.goto('/admin/routes');
  await page.fill('[data-testid="route-search"]', route.name);
  await page.click('[data-testid="search-button"]');
  
  const routeElement = page.locator(`[data-route-id="${routeId}"]`);
  await routeElement.click();
  await page.click('[data-testid="edit-route"]');
  await page.fill('[data-testid="current-load"]', route.currentLoad.toString());
  await page.click('[data-testid="save-route"]');
});

// Capacity validation steps
Then('I should see capacity warnings for routes approaching limits', async function () {
  const capacityWarnings = page.locator('[data-testid="capacity-warning"]');
  const warningCount = await capacityWarnings.count();
  expect(warningCount).toBeGreaterThanOrEqual(1);
  
  // Verify warning content
  const warningText = await capacityWarnings.first().textContent();
  expect(warningText).toMatch(/capacity|limit|full/i);
});

Then('I should see capacity indicators for each route', async function () {
  const routeItems = page.locator('[data-testid="route-option"]');
  const routeCount = await routeItems.count();
  
  for (let i = 0; i < routeCount; i++) {
    const capacityIndicator = routeItems.nth(i).locator('[data-testid="capacity-indicator"]');
    await expect(capacityIndicator).toBeVisible();
    
    const capacityText = await capacityIndicator.textContent();
    expect(capacityText).toMatch(/\d+\/\d+/); // Format: current/maximum
  }
});

Then('routes at full capacity should be highlighted', async function () {
  const fullRoutes = page.locator('[data-testid="route-option"].full-capacity');
  const fullRouteCount = await fullRoutes.count();
  
  if (fullRouteCount > 0) {
    // Verify highlighting
    for (let i = 0; i < fullRouteCount; i++) {
      const route = fullRoutes.nth(i);
      await expect(route).toHaveClass(/full-capacity|at-limit|warning/);
    }
  }
});

Then('I should not be able to assign to full capacity routes without override', async function () {
  const fullCapacityRoutes = page.locator('[data-testid="route-option"].full-capacity');
  const fullRouteCount = await fullCapacityRoutes.count();
  
  for (let i = 0; i < fullRouteCount; i++) {
    const route = fullCapacityRoutes.nth(i);
    const assignButton = route.locator('[data-testid="assign-to-route"]');
    await expect(assignButton).toBeDisabled();
  }
});

// Conflict resolution steps
When('I encounter a capacity conflict during assignment', async function () {
  // This step simulates a conflict scenario
  const conflictDialog = page.locator('[data-testid="capacity-conflict-dialog"]');
  await expect(conflictDialog).toBeVisible();
});

When('I choose to override the capacity constraint', async function () {
  await page.click('[data-testid="override-capacity"]');
  await page.fill('[data-testid="override-reason"]', 'Emergency assignment - approved by supervisor');
  await page.click('[data-testid="confirm-override"]');
});

When('I choose to find alternative routes', async function () {
  await page.click('[data-testid="find-alternatives"]');
  await expect(page.locator('[data-testid="alternative-routes-loading"]')).toBeVisible();
  await expect(page.locator('[data-testid="alternative-routes-loaded"]')).toBeVisible();
});

When('I choose to reschedule the assignment', async function () {
  await page.click('[data-testid="reschedule-assignment"]');
  await page.selectOption('[data-testid="reschedule-date"]', '2024-01-02');
  await page.selectOption('[data-testid="reschedule-time"]', '09:00');
  await page.click('[data-testid="confirm-reschedule"]');
});

// Override handling steps
Given('I have supervisor override permissions', async function () {
  // Verify user has override permissions
  await page.goto('/profile/permissions');
  const overridePermission = page.locator('[data-testid="override-permission"]');
  await expect(overridePermission).toContainText('Enabled');
});

When('I provide override reason {string}', async function (reason: string) {
  const overrideDialog = page.locator('[data-testid="override-dialog"]');
  await expect(overrideDialog).toBeVisible();
  
  await page.fill('[data-testid="override-reason"]', reason);
  await page.click('[data-testid="confirm-override"]');
});

When('I attempt to assign without providing override reason', async function () {
  await page.click('[data-testid="override-capacity"]');
  // Don't fill in the reason
  await page.click('[data-testid="confirm-override"]');
});

Then('I should see an override reason validation error', async function () {
  const validationError = page.locator('[data-testid="override-reason-error"]');
  await expect(validationError).toBeVisible();
  await expect(validationError).toContainText(/reason.*required/i);
});

Then('the override should be logged with timestamp and user information', async function () {
  await page.goto('/admin/audit-log');
  await page.selectOption('[data-testid="log-type-filter"]', 'capacity-override');
  await page.click('[data-testid="apply-filter"]');
  
  const overrideLog = page.locator('[data-testid="audit-entry"]').first();
  await expect(overrideLog).toBeVisible();
  
  // Verify log contains required information
  await expect(overrideLog).toContainText('capacity override');
  await expect(overrideLog.locator('[data-testid="timestamp"]')).toBeVisible();
  await expect(overrideLog.locator('[data-testid="user-id"]')).toBeVisible();
  await expect(overrideLog.locator('[data-testid="override-reason"]')).toBeVisible();
});

// Bulk assignment validation steps
Then('all selected tickets should be processed', async function () {
  const processingSummary = page.locator('[data-testid="processing-summary"]');
  await expect(processingSummary).toBeVisible();
  
  const processedCount = await processingSummary.locator('[data-testid="processed-count"]').textContent();
  const expectedCount = this.selectedTicketCount;
  
  expect(parseInt(processedCount || '0')).toBe(expectedCount);
});

Then('tickets should be distributed optimally across available routes', async function () {
  const distributionSummary = page.locator('[data-testid="distribution-summary"]');
  await expect(distributionSummary).toBeVisible();
  
  // Verify distribution is balanced
  const routeAssignments = page.locator('[data-testid="route-assignment-count"]');
  const assignmentCounts: number[] = [];
  
  const routeCount = await routeAssignments.count();
  for (let i = 0; i < routeCount; i++) {
    const countText = await routeAssignments.nth(i).textContent();
    assignmentCounts.push(parseInt(countText || '0'));
  }
  
  // Check that distribution is reasonably balanced (no route has more than 2x others)
  const maxAssignments = Math.max(...assignmentCounts);
  const minAssignments = Math.min(...assignmentCounts);
  
  if (minAssignments > 0) {
    expect(maxAssignments / minAssignments).toBeLessThanOrEqual(2);
  }
});

Then('no route should exceed its capacity', async function () {
  const capacityViolations = page.locator('[data-testid="capacity-violation"]');
  await expect(capacityViolations).toHaveCount(0);
  
  // Verify each route's capacity
  const routeCapacities = page.locator('[data-testid="route-capacity-status"]');
  const routeCount = await routeCapacities.count();
  
  for (let i = 0; i < routeCount; i++) {
    const capacityStatus = routeCapacities.nth(i);
    const statusText = await capacityStatus.textContent();
    
    // Parse current/maximum format
    const match = statusText?.match(/(\d+)\/(\d+)/);
    if (match) {
      const current = parseInt(match[1]);
      const maximum = parseInt(match[2]);
      expect(current).toBeLessThanOrEqual(maximum);
    }
  }
});

Then('I should see a summary of the bulk assignment results', async function () {
  const resultsSummary = page.locator('[data-testid="bulk-assignment-results"]');
  await expect(resultsSummary).toBeVisible();
  
  // Verify summary contains key metrics
  await expect(resultsSummary.locator('[data-testid="total-assigned"]')).toBeVisible();
  await expect(resultsSummary.locator('[data-testid="total-distance"]')).toBeVisible();
  await expect(resultsSummary.locator('[data-testid="average-distance"]')).toBeVisible();
  await expect(resultsSummary.locator('[data-testid="routes-utilized"]')).toBeVisible();
});

Then('high priority tickets should be assigned before lower priority ones', async function () {
  const assignmentOrder = page.locator('[data-testid="assignment-order"]');
  await expect(assignmentOrder).toBeVisible();
  
  const assignmentItems = page.locator('[data-testid="assignment-item"]');
  const itemCount = await assignmentItems.count();
  
  let lastPriority = 'urgent'; // Start with highest priority
  
  for (let i = 0; i < itemCount; i++) {
    const item = assignmentItems.nth(i);
    const priority = await item.locator('[data-testid="ticket-priority"]').textContent();
    
    if (priority) {
      // Verify priority order (urgent > high > medium > low)
      const priorityOrder = ['urgent', 'high', 'medium', 'low'];
      const currentIndex = priorityOrder.indexOf(priority.toLowerCase());
      const lastIndex = priorityOrder.indexOf(lastPriority.toLowerCase());
      
      expect(currentIndex).toBeGreaterThanOrEqual(lastIndex);
      lastPriority = priority.toLowerCase();
    }
  }
});

Then('I should see conflict resolution options for capacity constraints', async function () {
  const conflictOptions = page.locator('[data-testid="conflict-resolution-options"]');
  await expect(conflictOptions).toBeVisible();
  
  // Verify available resolution options
  await expect(conflictOptions.locator('[data-testid="override-capacity-option"]')).toBeVisible();
  await expect(conflictOptions.locator('[data-testid="find-alternatives-option"]')).toBeVisible();
  await expect(conflictOptions.locator('[data-testid="reschedule-option"]')).toBeVisible();
});

Then('alternative routes should be suggested for conflicted assignments', async function () {
  const alternativeRoutes = page.locator('[data-testid="alternative-routes"]');
  await expect(alternativeRoutes).toBeVisible();
  
  const alternatives = page.locator('[data-testid="alternative-route-option"]');
  const alternativeCount = await alternatives.count();
  expect(alternativeCount).toBeGreaterThanOrEqual(1);
  
  // Verify alternatives show capacity and distance information
  const firstAlternative = alternatives.first();
  await expect(firstAlternative.locator('[data-testid="route-capacity"]')).toBeVisible();
  await expect(firstAlternative.locator('[data-testid="route-distance"]')).toBeVisible();
});

// Performance and efficiency validation
Then('the bulk assignment should complete within {int} seconds', async function (maxSeconds: number) {
  const startTime = Date.now();
  
  await expect(page.locator('[data-testid="bulk-assignment-complete"]')).toBeVisible({ 
    timeout: maxSeconds * 1000 
  });
  
  const endTime = Date.now();
  const actualSeconds = (endTime - startTime) / 1000;
  
  expect(actualSeconds).toBeLessThanOrEqual(maxSeconds);
  console.log(`Bulk assignment completed in ${actualSeconds.toFixed(2)} seconds`);
});

Then('the total travel distance should be optimized', async function () {
  const totalDistance = page.locator('[data-testid="total-travel-distance"]');
  await expect(totalDistance).toBeVisible();
  
  const distanceText = await totalDistance.textContent();
  const distance = parseFloat(distanceText?.replace(/[^\d.]/g, '') || '0');
  
  // Store optimized distance for comparison
  this.optimizedDistance = distance;
  expect(distance).toBeGreaterThan(0);
  
  // Log for manual verification
  console.log(`Optimized total travel distance: ${distance} km`);
});

Then('route utilization should be balanced across available routes', async function () {
  const utilizationChart = page.locator('[data-testid="route-utilization-chart"]');
  await expect(utilizationChart).toBeVisible();
  
  const utilizationBars = page.locator('[data-testid="utilization-bar"]');
  const utilizationValues: number[] = [];
  
  const barCount = await utilizationBars.count();
  for (let i = 0; i < barCount; i++) {
    const bar = utilizationBars.nth(i);
    const percentage = await bar.getAttribute('data-utilization-percentage');
    if (percentage) {
      utilizationValues.push(parseFloat(percentage));
    }
  }
  
  // Calculate standard deviation to measure balance
  const mean = utilizationValues.reduce((sum, val) => sum + val, 0) / utilizationValues.length;
  const variance = utilizationValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / utilizationValues.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Standard deviation should be reasonable (less than 25% for good balance)
  expect(standardDeviation).toBeLessThan(25);
  console.log(`Route utilization balance (std dev): ${standardDeviation.toFixed(2)}%`);
});

// Cleanup steps
Given('I clean up bulk assignment test data', async function () {
  await page.goto('/admin/test-data/cleanup');
  await page.click('[data-testid="cleanup-bulk-assignments"]');
  await expect(page.locator('[data-testid="cleanup-complete"]')).toBeVisible();
  
  // Reset bulk assignment data
  bulkTickets = [];
  bulkRoutes = [];
  bulkAssignments = [];
  capacityConstraints.clear();
  conflictResolutions = [];
});