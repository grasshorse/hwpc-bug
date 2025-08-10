const { BasePage } = require('./BasePage');

/**
 * RoutePage class handles route planning and organization functionality
 * Provides route creation, editing, ticket assignment, and drag-and-drop interactions
 * Supports both desktop and mobile route management
 */
class RoutePage extends BasePage {
  constructor(page) {
    super(page);
    
    // Route page URL patterns
    this.baseUrl = process.env.BASE_URL || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
    this.routesUrl = `${this.baseUrl}?page=routes`;
    this.createRouteUrl = `${this.baseUrl}?page=routes&action=create`;
    this.editRouteUrl = (routeId) => `${this.baseUrl}?page=routes&action=edit&id=${routeId}`;
    this.planRouteUrl = (routeId) => `${this.baseUrl}?page=routes&action=plan&id=${routeId}`;
    
    // Route page selectors
    this.selectors = {
      // Page elements
      pageTitle: '[data-testid="routes-page-title"]',
      loadingSpinner: '[data-testid="loading-spinner"]',
      errorMessage: '[data-testid="error-message"]',
      successMessage: '[data-testid="success-message"]',
      
      // Route list elements
      routesList: '[data-testid="routes-list"]',
      routeItem: (routeId) => `[data-testid="route-item-${routeId}"]`,
      routeRow: '[data-testid="route-row"]',
      noRoutesMessage: '[data-testid="no-routes-message"]',
      
      // List controls
      createRouteButton: '[data-testid="create-route-btn"]',
      searchInput: '[data-testid="routes-search"]',
      filterDropdown: '[data-testid="routes-filter"]',
      sortDropdown: '[data-testid="routes-sort"]',
      refreshButton: '[data-testid="refresh-routes-btn"]',
      optimizeAllButton: '[data-testid="optimize-all-routes-btn"]',
      
      // Route form elements
      routeForm: '[data-testid="route-form"]',
      routeNameInput: '[data-testid="route-name"]',
      routeDateInput: '[data-testid="route-date"]',
      driverSelect: '[data-testid="driver-select"]',
      vehicleSelect: '[data-testid="vehicle-select"]',
      startTimeInput: '[data-testid="start-time"]',
      endTimeInput: '[data-testid="end-time"]',
      notesTextarea: '[data-testid="route-notes"]',
      
      // Form buttons
      saveRouteButton: '[data-testid="save-route-btn"]',
      cancelButton: '[data-testid="cancel-btn"]',
      deleteRouteButton: '[data-testid="delete-route-btn"]',
      
      // Route actions
      editRouteButton: (routeId) => `[data-testid="edit-route-${routeId}"]`,
      deleteRouteIcon: (routeId) => `[data-testid="delete-route-${routeId}"]`,
      viewRouteButton: (routeId) => `[data-testid="view-route-${routeId}"]`,
      planRouteButton: (routeId) => `[data-testid="plan-route-${routeId}"]`,
      optimizeRouteButton: (routeId) => `[data-testid="optimize-route-${routeId}"]`,
      printRouteButton: (routeId) => `[data-testid="print-route-${routeId}"]`,
      
      // Route details
      routeDetails: '[data-testid="route-details"]',
      routeId: '[data-testid="route-id"]',
      routeName: '[data-testid="route-name"]',
      routeDate: '[data-testid="route-date"]',
      routeDriver: '[data-testid="route-driver"]',
      routeStatus: '[data-testid="route-status"]',
      routeTicketCount: '[data-testid="route-ticket-count"]',
      routeEstimatedTime: '[data-testid="route-estimated-time"]',
      
      // Route planning interface
      routePlanningContainer: '[data-testid="route-planning-container"]',
      unassignedTickets: '[data-testid="unassigned-tickets"]',
      assignedTickets: '[data-testid="assigned-tickets"]',
      routeMap: '[data-testid="route-map"]',
      
      // Ticket assignment
      ticketItem: (ticketId) => `[data-testid="ticket-${ticketId}"]`,
      unassignedTicketItem: (ticketId) => `[data-testid="unassigned-ticket-${ticketId}"]`,
      assignedTicketItem: (ticketId) => `[data-testid="assigned-ticket-${ticketId}"]`,
      ticketDropZone: '[data-testid="ticket-drop-zone"]',
      
      // Drag and drop elements
      draggableTicket: '[data-testid="draggable-ticket"]',
      dropTarget: '[data-testid="drop-target"]',
      dragHandle: '[data-testid="drag-handle"]',
      sortableList: '[data-testid="sortable-list"]',
      
      // Route optimization
      optimizationPanel: '[data-testid="optimization-panel"]',
      optimizeButton: '[data-testid="optimize-button"]',
      optimizationResults: '[data-testid="optimization-results"]',
      acceptOptimizationButton: '[data-testid="accept-optimization-btn"]',
      rejectOptimizationButton: '[data-testid="reject-optimization-btn"]',
      
      // Mobile elements
      mobileRouteCard: '[data-testid="mobile-route-card"]',
      mobileCreateButton: '[data-testid="mobile-create-route"]',
      mobileSearchToggle: '[data-testid="mobile-search-toggle"]',
      mobileFilterToggle: '[data-testid="mobile-filter-toggle"]',
      mobileDragHandle: '[data-testid="mobile-drag-handle"]',
      
      // Confirmation dialogs
      confirmDialog: '[data-testid="confirm-dialog"]',
      confirmDeleteButton: '[data-testid="confirm-delete-btn"]',
      cancelDeleteButton: '[data-testid="cancel-delete-btn"]',
      
      // Validation messages
      validationErrors: '[data-testid="validation-errors"]',
      fieldError: (fieldName) => `[data-testid="error-${fieldName}"]`
    };
    
    // Form validation rules
    this.validationRules = {
      routeName: { required: true, message: 'Route name is required' },
      routeDate: { required: true, message: 'Route date is required' },
      driver: { required: true, message: 'Driver is required' },
      startTime: { required: true, message: 'Start time is required' },
      endTime: { required: true, message: 'End time is required' }
    };
  }

  /**
   * Navigate to routes page
   * @param {boolean} waitForLoad - Whether to wait for complete page load
   */
  async navigateToRoutes(waitForLoad = true) {
    try {
      await this.navigate(this.routesUrl);
      await this.switchToGoogleSitesFrame();
      
      if (waitForLoad) {
        await this.waitForRoutesPageLoad();
      }
      
      return true;
    } catch (error) {
      await this.handleError(error, 'routes-navigation');
      return false;
    }
  }

  /**
   * Wait for routes page to fully load
   */
  async waitForRoutesPageLoad() {
    try {
      await this.waitForElement(this.selectors.pageTitle);
      
      // Wait for loading spinner to disappear
      await this.page.waitForSelector(this.selectors.loadingSpinner, { 
        state: 'hidden', 
        timeout: 5000 
      }).catch(() => {
        // Loading spinner might not be present
      });
      
      // Ensure MVP authentication
      await this.ensureMVPAuthentication();
      
      return true;
    } catch (error) {
      await this.handleError(error, 'routes-page-load');
      throw error;
    }
  }

  /**
   * Create a new route
   * @param {Object} routeData - Route information
   * @returns {Promise<string>} Created route ID
   */
  async createRoute(routeData) {
    try {
      // Navigate to create route form
      await this.clickCreateRoute();
      
      // Fill form with route data
      await this.fillRouteForm(routeData);
      
      // Save the route
      await this.saveRoute();
      
      // Get the created route ID
      const routeId = await this.getCreatedRouteId();
      
      return routeId;
    } catch (error) {
      await this.handleError(error, 'create-route');
      throw error;
    }
  }

  /**
   * Click create route button
   */
  async clickCreateRoute() {
    try {
      const isMobile = await this.isMobileView();
      const buttonSelector = isMobile ? 
        this.selectors.mobileCreateButton : 
        this.selectors.createRouteButton;
      
      await this.click(buttonSelector);
      await this.waitForElement(this.selectors.routeForm);
    } catch (error) {
      await this.handleError(error, 'click-create-route');
      throw error;
    }
  }

  /**
   * Fill route form with provided data
   * @param {Object} routeData - Route form data
   */
  async fillRouteForm(routeData) {
    try {
      // Add MVP user attribution to route data
      const mvpRouteData = this.addMVPAttribution(routeData);
      
      // Fill route name
      if (mvpRouteData.routeName) {
        await this.type(this.selectors.routeNameInput, mvpRouteData.routeName);
      }
      
      // Fill route date
      if (mvpRouteData.routeDate) {
        await this.type(this.selectors.routeDateInput, mvpRouteData.routeDate);
      }
      
      // Select driver
      if (mvpRouteData.driver) {
        await this.selectDriver(mvpRouteData.driver);
      }
      
      // Select vehicle
      if (mvpRouteData.vehicle) {
        await this.selectVehicle(mvpRouteData.vehicle);
      }
      
      // Fill start time
      if (mvpRouteData.startTime) {
        await this.type(this.selectors.startTimeInput, mvpRouteData.startTime);
      }
      
      // Fill end time
      if (mvpRouteData.endTime) {
        await this.type(this.selectors.endTimeInput, mvpRouteData.endTime);
      }
      
      // Fill notes
      if (mvpRouteData.notes) {
        await this.type(this.selectors.notesTextarea, mvpRouteData.notes);
      }
      
    } catch (error) {
      await this.handleError(error, 'fill-route-form');
      throw error;
    }
  }

  /**
   * Select driver from dropdown
   * @param {string} driverName - Driver name
   */
  async selectDriver(driverName) {
    await this.click(this.selectors.driverSelect);
    const driverOption = `[data-testid="driver-option"][data-value="${driverName}"]`;
    await this.waitForElement(driverOption);
    await this.click(driverOption);
  }

  /**
   * Select vehicle from dropdown
   * @param {string} vehicleName - Vehicle name or ID
   */
  async selectVehicle(vehicleName) {
    await this.click(this.selectors.vehicleSelect);
    const vehicleOption = `[data-testid="vehicle-option"][data-value="${vehicleName}"]`;
    await this.waitForElement(vehicleOption);
    await this.click(vehicleOption);
  }

  /**
   * Save the route form
   */
  async saveRoute() {
    try {
      await this.click(this.selectors.saveRouteButton);
      
      // Wait for save operation to complete
      await this.page.waitForSelector(this.selectors.loadingSpinner, { 
        state: 'hidden', 
        timeout: 10000 
      }).catch(() => {
        // Loading spinner might not be present
      });
      
      // Check for validation errors
      const hasErrors = await this.elementExists(this.selectors.validationErrors);
      if (hasErrors) {
        const errors = await this.getValidationErrors();
        throw new Error(`Validation errors: ${JSON.stringify(errors)}`);
      }
      
      // Wait for success message or redirect
      await this.waitForElement(this.selectors.successMessage, 5000).catch(() => {
        // Success message might not be present if redirected
      });
      
    } catch (error) {
      await this.handleError(error, 'save-route');
      throw error;
    }
  }

  /**
   * Get created route ID from success message or URL
   * @returns {Promise<string>} Route ID
   */
  async getCreatedRouteId() {
    try {
      // Try to get ID from success message
      const successMessage = await this.getSuccessMessage();
      if (successMessage) {
        const idMatch = successMessage.match(/route\s+(\w+)/i);
        if (idMatch) {
          return idMatch[1];
        }
      }
      
      // Try to get ID from URL
      const currentUrl = await this.getCurrentUrl();
      const urlMatch = currentUrl.match(/id=([^&]+)/);
      if (urlMatch) {
        return urlMatch[1];
      }
      
      // Generate test ID if not found
      return this.generateMVPTestId('ROUTE');
    } catch (error) {
      return this.generateMVPTestId('ROUTE');
    }
  }

  /**
   * Navigate to route planning interface
   * @param {string} routeId - Route ID to plan
   */
  async navigateToRoutePlanning(routeId) {
    try {
      await this.navigate(this.planRouteUrl(routeId));
      await this.switchToGoogleSitesFrame();
      await this.waitForElement(this.selectors.routePlanningContainer);
      
      return true;
    } catch (error) {
      await this.handleError(error, `navigate-route-planning-${routeId}`);
      throw error;
    }
  }

  /**
   * Assign ticket to route using drag and drop
   * @param {string} ticketId - Ticket ID to assign
   * @param {string} routeId - Route ID to assign to
   * @param {number} position - Position in route (optional)
   */
  async assignTicketToRoute(ticketId, routeId, position = null) {
    try {
      const isMobile = await this.isMobileView();
      
      if (isMobile) {
        await this.assignTicketMobile(ticketId, routeId, position);
      } else {
        await this.assignTicketDesktop(ticketId, routeId, position);
      }
      
      // Wait for assignment to complete
      await this.page.waitForTimeout(1000);
      
      return true;
    } catch (error) {
      await this.handleError(error, `assign-ticket-${ticketId}-to-route-${routeId}`);
      throw error;
    }
  }

  /**
   * Desktop drag and drop ticket assignment
   * @param {string} ticketId - Ticket ID
   * @param {string} routeId - Route ID
   * @param {number} position - Position in route
   */
  async assignTicketDesktop(ticketId, routeId, position) {
    try {
      const sourceSelector = this.selectors.unassignedTicketItem(ticketId);
      const targetSelector = position !== null ? 
        `${this.selectors.assignedTickets} [data-position="${position}"]` :
        this.selectors.ticketDropZone;
      
      // Get source and target elements
      const sourceElement = await this.waitForElement(sourceSelector);
      const targetElement = await this.waitForElement(targetSelector);
      
      // Get bounding boxes for drag calculation
      const sourceBounds = await sourceElement.boundingBox();
      const targetBounds = await targetElement.boundingBox();
      
      if (sourceBounds && targetBounds) {
        // Perform drag and drop
        await this.page.mouse.move(
          sourceBounds.x + sourceBounds.width / 2,
          sourceBounds.y + sourceBounds.height / 2
        );
        await this.page.mouse.down();
        
        // Move to target
        await this.page.mouse.move(
          targetBounds.x + targetBounds.width / 2,
          targetBounds.y + targetBounds.height / 2,
          { steps: 10 }
        );
        
        await this.page.mouse.up();
      }
      
    } catch (error) {
      await this.handleError(error, `assign-ticket-desktop-${ticketId}`);
      throw error;
    }
  }

  /**
   * Mobile touch-based ticket assignment
   * @param {string} ticketId - Ticket ID
   * @param {string} routeId - Route ID
   * @param {number} position - Position in route
   */
  async assignTicketMobile(ticketId, routeId, position) {
    try {
      // On mobile, use long press and drag
      const sourceSelector = this.selectors.unassignedTicketItem(ticketId);
      const targetSelector = position !== null ? 
        `${this.selectors.assignedTickets} [data-position="${position}"]` :
        this.selectors.ticketDropZone;
      
      // Long press on source ticket
      await this.page.touchscreen.tap(sourceSelector);
      await this.page.waitForTimeout(500); // Long press duration
      
      // Drag to target
      const sourceBounds = await this.page.locator(sourceSelector).boundingBox();
      const targetBounds = await this.page.locator(targetSelector).boundingBox();
      
      if (sourceBounds && targetBounds) {
        await this.page.touchscreen.tap(
          sourceBounds.x + sourceBounds.width / 2,
          sourceBounds.y + sourceBounds.height / 2
        );
        
        await this.page.touchscreen.tap(
          targetBounds.x + targetBounds.width / 2,
          targetBounds.y + targetBounds.height / 2
        );
      }
      
    } catch (error) {
      await this.handleError(error, `assign-ticket-mobile-${ticketId}`);
      throw error;
    }
  }

  /**
   * Reorder tickets within a route
   * @param {string} ticketId - Ticket ID to move
   * @param {number} fromPosition - Current position
   * @param {number} toPosition - Target position
   */
  async reorderTicketInRoute(ticketId, fromPosition, toPosition) {
    try {
      const isMobile = await this.isMobileView();
      
      const sourceSelector = `${this.selectors.assignedTickets} [data-position="${fromPosition}"]`;
      const targetSelector = `${this.selectors.assignedTickets} [data-position="${toPosition}"]`;
      
      if (isMobile) {
        // Mobile reordering using touch
        await this.page.touchscreen.tap(sourceSelector);
        await this.page.waitForTimeout(500);
        await this.page.touchscreen.tap(targetSelector);
      } else {
        // Desktop drag and drop reordering
        const sourceElement = await this.waitForElement(sourceSelector);
        const targetElement = await this.waitForElement(targetSelector);
        
        const sourceBounds = await sourceElement.boundingBox();
        const targetBounds = await targetElement.boundingBox();
        
        if (sourceBounds && targetBounds) {
          await this.page.mouse.move(
            sourceBounds.x + sourceBounds.width / 2,
            sourceBounds.y + sourceBounds.height / 2
          );
          await this.page.mouse.down();
          
          await this.page.mouse.move(
            targetBounds.x + targetBounds.width / 2,
            targetBounds.y + targetBounds.height / 2,
            { steps: 10 }
          );
          
          await this.page.mouse.up();
        }
      }
      
      // Wait for reorder to complete
      await this.page.waitForTimeout(1000);
      
    } catch (error) {
      await this.handleError(error, `reorder-ticket-${ticketId}`);
      throw error;
    }
  }

  /**
   * Remove ticket from route
   * @param {string} ticketId - Ticket ID to remove
   */
  async removeTicketFromRoute(ticketId) {
    try {
      const assignedTicketSelector = this.selectors.assignedTicketItem(ticketId);
      const unassignedDropZone = this.selectors.unassignedTickets;
      
      const isMobile = await this.isMobileView();
      
      if (isMobile) {
        // Mobile: tap and drag back to unassigned
        await this.page.touchscreen.tap(assignedTicketSelector);
        await this.page.waitForTimeout(500);
        await this.page.touchscreen.tap(unassignedDropZone);
      } else {
        // Desktop: drag back to unassigned tickets
        const sourceElement = await this.waitForElement(assignedTicketSelector);
        const targetElement = await this.waitForElement(unassignedDropZone);
        
        const sourceBounds = await sourceElement.boundingBox();
        const targetBounds = await targetElement.boundingBox();
        
        if (sourceBounds && targetBounds) {
          await this.page.mouse.move(
            sourceBounds.x + sourceBounds.width / 2,
            sourceBounds.y + sourceBounds.height / 2
          );
          await this.page.mouse.down();
          
          await this.page.mouse.move(
            targetBounds.x + targetBounds.width / 2,
            targetBounds.y + targetBounds.height / 2,
            { steps: 10 }
          );
          
          await this.page.mouse.up();
        }
      }
      
      // Wait for removal to complete
      await this.page.waitForTimeout(1000);
      
    } catch (error) {
      await this.handleError(error, `remove-ticket-${ticketId}`);
      throw error;
    }
  }

  /**
   * Optimize route order
   * @param {string} routeId - Route ID to optimize
   * @returns {Promise<Object>} Optimization results
   */
  async optimizeRoute(routeId) {
    try {
      // Click optimize button
      const optimizeButton = this.selectors.optimizeRouteButton(routeId);
      await this.click(optimizeButton);
      
      // Wait for optimization to complete
      await this.waitForElement(this.selectors.optimizationResults);
      
      // Get optimization results
      const results = await this.page.evaluate(() => {
        const resultsElement = document.querySelector('[data-testid="optimization-results"]');
        if (!resultsElement) return null;
        
        return {
          originalDistance: resultsElement.querySelector('[data-testid="original-distance"]')?.textContent || '',
          optimizedDistance: resultsElement.querySelector('[data-testid="optimized-distance"]')?.textContent || '',
          timeSaved: resultsElement.querySelector('[data-testid="time-saved"]')?.textContent || '',
          fuelSaved: resultsElement.querySelector('[data-testid="fuel-saved"]')?.textContent || ''
        };
      });
      
      return results;
    } catch (error) {
      await this.handleError(error, `optimize-route-${routeId}`);
      throw error;
    }
  }

  /**
   * Accept route optimization
   */
  async acceptOptimization() {
    try {
      await this.click(this.selectors.acceptOptimizationButton);
      
      // Wait for optimization to be applied
      await this.page.waitForSelector(this.selectors.optimizationPanel, { 
        state: 'hidden', 
        timeout: 5000 
      });
      
    } catch (error) {
      await this.handleError(error, 'accept-optimization');
      throw error;
    }
  }

  /**
   * Reject route optimization
   */
  async rejectOptimization() {
    try {
      await this.click(this.selectors.rejectOptimizationButton);
      
      // Wait for optimization panel to close
      await this.page.waitForSelector(this.selectors.optimizationPanel, { 
        state: 'hidden', 
        timeout: 5000 
      });
      
    } catch (error) {
      await this.handleError(error, 'reject-optimization');
      throw error;
    }
  }

  /**
   * Get route details
   * @param {string} routeId - Route ID
   * @returns {Promise<Object>} Route details
   */
  async getRouteDetails(routeId) {
    try {
      const routeSelector = this.selectors.routeItem(routeId);
      await this.waitForElement(routeSelector);
      
      const routeData = await this.page.evaluate((selector) => {
        const route = document.querySelector(selector);
        if (!route) return null;
        
        return {
          id: route.querySelector('[data-testid="route-id"]')?.textContent || '',
          name: route.querySelector('[data-testid="route-name"]')?.textContent || '',
          date: route.querySelector('[data-testid="route-date"]')?.textContent || '',
          driver: route.querySelector('[data-testid="route-driver"]')?.textContent || '',
          status: route.querySelector('[data-testid="route-status"]')?.textContent || '',
          ticketCount: route.querySelector('[data-testid="route-ticket-count"]')?.textContent || '',
          estimatedTime: route.querySelector('[data-testid="route-estimated-time"]')?.textContent || ''
        };
      }, routeSelector);
      
      return routeData;
    } catch (error) {
      await this.handleError(error, `get-route-details-${routeId}`);
      throw error;
    }
  }

  /**
   * Get assigned tickets for a route
   * @param {string} routeId - Route ID
   * @returns {Promise<Array>} Array of assigned tickets
   */
  async getAssignedTickets(routeId) {
    try {
      await this.navigateToRoutePlanning(routeId);
      
      const tickets = await this.page.evaluate(() => {
        const assignedTickets = document.querySelectorAll('[data-testid="assigned-ticket-item"]');
        return Array.from(assignedTickets).map((ticket, index) => ({
          id: ticket.getAttribute('data-ticket-id') || '',
          position: index + 1,
          customer: ticket.querySelector('[data-testid="ticket-customer"]')?.textContent || '',
          address: ticket.querySelector('[data-testid="ticket-address"]')?.textContent || '',
          estimatedTime: ticket.querySelector('[data-testid="ticket-estimated-time"]')?.textContent || ''
        }));
      });
      
      return tickets;
    } catch (error) {
      await this.handleError(error, `get-assigned-tickets-${routeId}`);
      return [];
    }
  }

  /**
   * Get unassigned tickets
   * @returns {Promise<Array>} Array of unassigned tickets
   */
  async getUnassignedTickets() {
    try {
      await this.waitForElement(this.selectors.unassignedTickets);
      
      const tickets = await this.page.evaluate(() => {
        const unassignedTickets = document.querySelectorAll('[data-testid="unassigned-ticket-item"]');
        return Array.from(unassignedTickets).map(ticket => ({
          id: ticket.getAttribute('data-ticket-id') || '',
          customer: ticket.querySelector('[data-testid="ticket-customer"]')?.textContent || '',
          address: ticket.querySelector('[data-testid="ticket-address"]')?.textContent || '',
          priority: ticket.querySelector('[data-testid="ticket-priority"]')?.textContent || ''
        }));
      });
      
      return tickets;
    } catch (error) {
      await this.handleError(error, 'get-unassigned-tickets');
      return [];
    }
  }

  /**
   * Check if current view is mobile
   * @returns {Promise<boolean>} True if mobile view
   */
  async isMobileView() {
    try {
      const viewport = this.page.viewportSize();
      return viewport.width <= 768;
    } catch (error) {
      return await this.elementExists(this.selectors.mobileRouteCard);
    }
  }

  /**
   * Get validation errors from form
   * @returns {Promise<Array>} Array of validation error messages
   */
  async getValidationErrors() {
    try {
      const errors = await this.page.evaluate(() => {
        const errorElements = document.querySelectorAll('[data-testid^="error-"]');
        return Array.from(errorElements).map(el => ({
          field: el.getAttribute('data-testid').replace('error-', ''),
          message: el.textContent
        }));
      });
      
      return errors;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get success message
   * @returns {Promise<string|null>} Success message if present
   */
  async getSuccessMessage() {
    try {
      const hasSuccess = await this.elementExists(this.selectors.successMessage);
      if (hasSuccess) {
        return await this.getText(this.selectors.successMessage);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get error message
   * @returns {Promise<string|null>} Error message if present
   */
  async getErrorMessage() {
    try {
      const hasError = await this.elementExists(this.selectors.errorMessage);
      if (hasError) {
        return await this.getText(this.selectors.errorMessage);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Print route
   * @param {string} routeId - Route ID to print
   */
  async printRoute(routeId) {
    try {
      const printButton = this.selectors.printRouteButton(routeId);
      await this.click(printButton);
      
      // Wait for print dialog or preview to open
      await this.page.waitForTimeout(2000);
      
    } catch (error) {
      await this.handleError(error, `print-route-${routeId}`);
      throw error;
    }
  }

  /**
   * Delete a route
   * @param {string} routeId - Route ID to delete
   * @param {boolean} confirm - Whether to confirm deletion
   */
  async deleteRoute(routeId, confirm = true) {
    try {
      // Click delete button
      const deleteButton = this.selectors.deleteRouteIcon(routeId);
      await this.click(deleteButton);
      await this.waitForElement(this.selectors.confirmDialog);
      
      // Handle confirmation dialog
      if (confirm) {
        await this.click(this.selectors.confirmDeleteButton);
      } else {
        await this.click(this.selectors.cancelDeleteButton);
      }
      
      // Wait for dialog to close
      await this.page.waitForSelector(this.selectors.confirmDialog, { 
        state: 'hidden', 
        timeout: 5000 
      });
      
      return confirm;
    } catch (error) {
      await this.handleError(error, `delete-route-${routeId}`);
      throw error;
    }
  }

  /**
   * Refresh routes list
   */
  async refreshRoutes() {
    try {
      await this.click(this.selectors.refreshButton);
      await this.waitForRoutesPageLoad();
    } catch (error) {
      await this.handleError(error, 'refresh-routes');
      throw error;
    }
  }
}

module.exports = { RoutePage };