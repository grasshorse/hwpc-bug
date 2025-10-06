import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page } from '../../../src/support/hooks';

// Background steps
Given('I am logged in as a dispatcher', async function () {
  // Navigate to login page and authenticate as dispatcher
  await page.goto('/login');
  await page.fill('[data-testid="username"]', 'dispatcher-test-user');
  await page.fill('[data-testid="password"]', 'test-password');
  await page.click('[data-testid="login-button"]');
  
  // Verify successful login
  await expect(page.locator('[data-testid="user-role"]')).toContainText('Dispatcher');
});

Given('the system is in dual testing mode', async function () {
  // Verify dual mode is active
  const modeIndicator = page.locator('[data-testid="test-mode-indicator"]');
  await expect(modeIndicator).toContainText('Dual Mode');
});

// Navigation steps
When('I navigate to the ticket assignment page', async function () {
  await page.click('[data-testid="nav-assignments"]');
  await page.waitForURL('**/assignments');
});

Then('I should see the assignment interface', async function () {
  await expect(page.locator('[data-testid="assignment-interface"]')).toBeVisible();
  await expect(page.locator('h1')).toContainText('Ticket Assignment');
});

Then('I should see unassigned tickets grouped by geographic proximity', async function () {
  const ticketGroups = page.locator('[data-testid="ticket-group"]');
  await expect(ticketGroups).toHaveCount({ min: 1 });
  
  // Verify geographic grouping headers
  const groupHeaders = page.locator('[data-testid="geographic-group-header"]');
  await expect(groupHeaders.first()).toBeVisible();
});

Then('I should see available routes displayed on the interface', async function () {
  const routesList = page.locator('[data-testid="available-routes"]');
  await expect(routesList).toBeVisible();
  
  const routeItems = page.locator('[data-testid="route-item"]');
  await expect(routeItems).toHaveCount({ min: 1 });
});

// Basic workflow steps
Given('I am on the ticket assignment page', async function () {
  await page.goto('/assignments');
  await expect(page.locator('[data-testid="assignment-interface"]')).toBeVisible();
});

Given('there are unassigned tickets available', async function () {
  const unassignedTickets = page.locator('[data-testid="unassigned-ticket"]');
  await expect(unassignedTickets).toHaveCount({ min: 1 });
});

When('I select a ticket from the list', async function () {
  const firstTicket = page.locator('[data-testid="unassigned-ticket"]').first();
  await firstTicket.click();
  
  // Store ticket ID for later reference
  const ticketId = await firstTicket.getAttribute('data-ticket-id');
  this.selectedTicketId = ticketId;
});

Then('I should see all available scheduled routes within the configured radius', async function () {
  const routeOptions = page.locator('[data-testid="route-option"]');
  await expect(routeOptions).toHaveCount({ min: 1 });
  
  // Verify routes show distance information
  const distanceInfo = page.locator('[data-testid="route-distance"]');
  await expect(distanceInfo.first()).toBeVisible();
});

Then('the system should highlight the suggested optimal route', async function () {
  const optimalRoute = page.locator('[data-testid="optimal-route"]');
  await expect(optimalRoute).toBeVisible();
  await expect(optimalRoute).toHaveClass(/highlighted|optimal|suggested/);
});

Then('I should be able to assign the ticket to the suggested route', async function () {
  const assignButton = page.locator('[data-testid="assign-to-optimal-route"]');
  await expect(assignButton).toBeEnabled();
  await assignButton.click();
  
  // Verify assignment confirmation
  await expect(page.locator('[data-testid="assignment-success"]')).toBeVisible();
});

// UI responsiveness steps
When('I select multiple tickets quickly', async function () {
  const tickets = page.locator('[data-testid="unassigned-ticket"]');
  const ticketCount = Math.min(3, await tickets.count());
  
  for (let i = 0; i < ticketCount; i++) {
    await tickets.nth(i).click();
    // Small delay to simulate quick selection
    await page.waitForTimeout(100);
  }
  
  this.selectedTicketCount = ticketCount;
});

Then('the interface should remain responsive', async function () {
  // Verify interface elements are still interactive
  const assignmentPanel = page.locator('[data-testid="assignment-panel"]');
  await expect(assignmentPanel).toBeVisible();
  
  // Check that loading states don't persist too long
  const loadingIndicators = page.locator('[data-testid="loading"]');
  await expect(loadingIndicators).toHaveCount(0, { timeout: 5000 });
});

Then('each selection should be visually indicated', async function () {
  const selectedTickets = page.locator('[data-testid="unassigned-ticket"].selected');
  await expect(selectedTickets).toHaveCount(this.selectedTicketCount);
});

Then('the route suggestions should update accordingly', async function () {
  const routeSuggestions = page.locator('[data-testid="route-suggestions"]');
  await expect(routeSuggestions).toBeVisible();
  
  // Verify suggestions reflect multiple ticket selection
  const bulkAssignmentOptions = page.locator('[data-testid="bulk-assignment-options"]');
  await expect(bulkAssignmentOptions).toBeVisible();
});

// CRUD operations steps
Given('I have assigned a ticket to a route', async function () {
  // Select and assign a ticket
  const ticket = page.locator('[data-testid="unassigned-ticket"]').first();
  await ticket.click();
  
  const assignButton = page.locator('[data-testid="assign-to-optimal-route"]');
  await assignButton.click();
  
  // Wait for assignment to complete
  await expect(page.locator('[data-testid="assignment-success"]')).toBeVisible();
  
  // Store assignment details
  this.assignedTicketId = await ticket.getAttribute('data-ticket-id');
});

When('I view the assignment details', async function () {
  const assignedTicket = page.locator(`[data-ticket-id="${this.assignedTicketId}"]`);
  await assignedTicket.click();
  
  const detailsButton = page.locator('[data-testid="view-assignment-details"]');
  await detailsButton.click();
});

Then('I should see the ticket information', async function () {
  const ticketDetails = page.locator('[data-testid="ticket-details"]');
  await expect(ticketDetails).toBeVisible();
  await expect(ticketDetails).toContainText(this.assignedTicketId);
});

Then('I should see the assigned route information', async function () {
  const routeDetails = page.locator('[data-testid="assigned-route-details"]');
  await expect(routeDetails).toBeVisible();
});

Then('I should be able to modify the assignment', async function () {
  const modifyButton = page.locator('[data-testid="modify-assignment"]');
  await expect(modifyButton).toBeEnabled();
});

Then('I should be able to remove the assignment', async function () {
  const removeButton = page.locator('[data-testid="remove-assignment"]');
  await expect(removeButton).toBeEnabled();
});

// Assignment validation steps
Given('I select a ticket for assignment', async function () {
  const ticket = page.locator('[data-testid="unassigned-ticket"]').first();
  await ticket.click();
  this.selectedTicketId = await ticket.getAttribute('data-ticket-id');
});

When('I assign the ticket to a route', async function () {
  const routeOption = page.locator('[data-testid="route-option"]').first();
  await routeOption.click();
  
  const confirmButton = page.locator('[data-testid="confirm-assignment"]');
  await confirmButton.click();
  
  this.assignedRouteId = await routeOption.getAttribute('data-route-id');
});

Then('the route schedule should be updated', async function () {
  // Navigate to route schedule view
  await page.click('[data-testid="view-route-schedule"]');
  
  const routeSchedule = page.locator(`[data-route-id="${this.assignedRouteId}"]`);
  await expect(routeSchedule).toContainText(this.selectedTicketId);
});

Then('the ticket status should change to assigned', async function () {
  const ticketStatus = page.locator(`[data-ticket-id="${this.selectedTicketId}"] [data-testid="ticket-status"]`);
  await expect(ticketStatus).toContainText('Assigned');
});

Then('I should see a confirmation message', async function () {
  const confirmation = page.locator('[data-testid="assignment-confirmation"]');
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText('successfully assigned');
});

Then('the assignment should appear in the route\'s ticket list', async function () {
  const routeTickets = page.locator(`[data-route-id="${this.assignedRouteId}"] [data-testid="route-tickets"]`);
  await expect(routeTickets).toContainText(this.selectedTicketId);
});

// Interface elements steps
Then('I should see a list of unassigned tickets', async function () {
  const ticketsList = page.locator('[data-testid="unassigned-tickets-list"]');
  await expect(ticketsList).toBeVisible();
});

Then('I should see route capacity indicators', async function () {
  const capacityIndicators = page.locator('[data-testid="route-capacity"]');
  await expect(capacityIndicators.first()).toBeVisible();
});

Then('I should see a map view of service areas', async function () {
  const mapView = page.locator('[data-testid="service-area-map"]');
  await expect(mapView).toBeVisible();
});

Then('I should see assignment controls', async function () {
  const assignmentControls = page.locator('[data-testid="assignment-controls"]');
  await expect(assignmentControls).toBeVisible();
});

Then('I should see search and filter options', async function () {
  const searchBox = page.locator('[data-testid="ticket-search"]');
  const filterOptions = page.locator('[data-testid="ticket-filters"]');
  
  await expect(searchBox).toBeVisible();
  await expect(filterOptions).toBeVisible();
});

// Error handling steps
When('a network error occurs during assignment', async function () {
  // Simulate network error by intercepting requests
  await page.route('**/api/assignments', route => {
    route.abort('failed');
  });
  
  const ticket = page.locator('[data-testid="unassigned-ticket"]').first();
  await ticket.click();
  
  const assignButton = page.locator('[data-testid="assign-to-optimal-route"]');
  await assignButton.click();
});

Then('I should see an appropriate error message', async function () {
  const errorMessage = page.locator('[data-testid="assignment-error"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('network error');
});

Then('the interface should remain functional', async function () {
  // Verify main interface elements are still interactive
  const ticketsList = page.locator('[data-testid="unassigned-tickets-list"]');
  await expect(ticketsList).toBeVisible();
  
  const navigationMenu = page.locator('[data-testid="navigation-menu"]');
  await expect(navigationMenu).toBeVisible();
});

Then('I should be able to retry the assignment', async function () {
  const retryButton = page.locator('[data-testid="retry-assignment"]');
  await expect(retryButton).toBeEnabled();
});

// Visual feedback steps
When('I initiate a ticket assignment', async function () {
  const ticket = page.locator('[data-testid="unassigned-ticket"]').first();
  await ticket.click();
  
  const assignButton = page.locator('[data-testid="assign-to-optimal-route"]');
  await assignButton.click();
});

Then('I should see loading indicators', async function () {
  const loadingIndicator = page.locator('[data-testid="assignment-loading"]');
  await expect(loadingIndicator).toBeVisible();
});

Then('I should see progress feedback', async function () {
  const progressIndicator = page.locator('[data-testid="assignment-progress"]');
  await expect(progressIndicator).toBeVisible();
});

When('the assignment completes', async function () {
  // Wait for assignment to complete
  await page.waitForSelector('[data-testid="assignment-success"]', { timeout: 10000 });
});

Then('I should see success confirmation', async function () {
  const successMessage = page.locator('[data-testid="assignment-success"]');
  await expect(successMessage).toBeVisible();
});

Then('the interface should update to reflect the new assignment', async function () {
  // Verify ticket moved from unassigned to assigned list
  const assignedTickets = page.locator('[data-testid="assigned-tickets"]');
  await expect(assignedTickets).toHaveCount({ min: 1 });
  
  // Verify route capacity updated
  const routeCapacity = page.locator('[data-testid="route-capacity"]').first();
  await expect(routeCapacity).toBeVisible();
});