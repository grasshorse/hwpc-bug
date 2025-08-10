const { BasePage } = require('./BasePage');

/**
 * TicketPage class handles ticket management CRUD operations
 * Provides form interactions, validation checking, and mobile touch support
 * Supports ticket creation, editing, deletion, and status management
 */
class TicketPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Ticket page URL patterns
    this.baseUrl = process.env.BASE_URL || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
    this.ticketsUrl = `${this.baseUrl}?page=tickets`;
    this.createTicketUrl = `${this.baseUrl}?page=tickets&action=create`;
    this.editTicketUrl = (ticketId) => `${this.baseUrl}?page=tickets&action=edit&id=${ticketId}`;
    
    // Ticket page selectors
    this.selectors = {
      // Page elements
      pageTitle: '[data-testid="tickets-page-title"]',
      loadingSpinner: '[data-testid="loading-spinner"]',
      errorMessage: '[data-testid="error-message"]',
      successMessage: '[data-testid="success-message"]',
      
      // Ticket list elements
      ticketsList: '[data-testid="tickets-list"]',
      ticketItem: (ticketId) => `[data-testid="ticket-item-${ticketId}"]`,
      ticketRow: '[data-testid="ticket-row"]',
      noTicketsMessage: '[data-testid="no-tickets-message"]',
      
      // List controls
      createTicketButton: '[data-testid="create-ticket-btn"]',
      searchInput: '[data-testid="tickets-search"]',
      filterDropdown: '[data-testid="tickets-filter"]',
      sortDropdown: '[data-testid="tickets-sort"]',
      refreshButton: '[data-testid="refresh-tickets-btn"]',
      
      // Ticket form elements
      ticketForm: '[data-testid="ticket-form"]',
      customerSelect: '[data-testid="customer-select"]',
      serviceTypeSelect: '[data-testid="service-type-select"]',
      scheduledDateInput: '[data-testid="scheduled-date"]',
      scheduledTimeInput: '[data-testid="scheduled-time"]',
      prioritySelect: '[data-testid="priority-select"]',
      statusSelect: '[data-testid="status-select"]',
      serviceNotesTextarea: '[data-testid="service-notes"]',
      estimatedDurationInput: '[data-testid="estimated-duration"]',
      specialInstructionsTextarea: '[data-testid="special-instructions"]',
      
      // Form buttons
      saveTicketButton: '[data-testid="save-ticket-btn"]',
      cancelButton: '[data-testid="cancel-btn"]',
      deleteTicketButton: '[data-testid="delete-ticket-btn"]',
      
      // Ticket actions
      editTicketButton: (ticketId) => `[data-testid="edit-ticket-${ticketId}"]`,
      deleteTicketIcon: (ticketId) => `[data-testid="delete-ticket-${ticketId}"]`,
      viewTicketButton: (ticketId) => `[data-testid="view-ticket-${ticketId}"]`,
      
      // Ticket details
      ticketDetails: '[data-testid="ticket-details"]',
      ticketId: '[data-testid="ticket-id"]',
      ticketCustomer: '[data-testid="ticket-customer"]',
      ticketServiceType: '[data-testid="ticket-service-type"]',
      ticketScheduledDate: '[data-testid="ticket-scheduled-date"]',
      ticketStatus: '[data-testid="ticket-status"]',
      ticketPriority: '[data-testid="ticket-priority"]',
      
      // Validation messages
      validationErrors: '[data-testid="validation-errors"]',
      fieldError: (fieldName) => `[data-testid="error-${fieldName}"]`,
      
      // Mobile elements
      mobileTicketCard: '[data-testid="mobile-ticket-card"]',
      mobileCreateButton: '[data-testid="mobile-create-ticket"]',
      mobileSearchToggle: '[data-testid="mobile-search-toggle"]',
      mobileFilterToggle: '[data-testid="mobile-filter-toggle"]',
      
      // Confirmation dialogs
      confirmDialog: '[data-testid="confirm-dialog"]',
      confirmDeleteButton: '[data-testid="confirm-delete-btn"]',
      cancelDeleteButton: '[data-testid="cancel-delete-btn"]'
    };
    
    // Form validation rules
    this.validationRules = {
      customer: { required: true, message: 'Customer is required' },
      serviceType: { required: true, message: 'Service type is required' },
      scheduledDate: { required: true, message: 'Scheduled date is required' },
      scheduledTime: { required: true, message: 'Scheduled time is required' },
      priority: { required: true, message: 'Priority is required' }
    };
  }

  /**
   * Navigate to tickets page
   * @param {boolean} waitForLoad - Whether to wait for complete page load
   */
  async navigateToTickets(waitForLoad = true) {
    try {
      await this.navigate(this.ticketsUrl);
      await this.switchToGoogleSitesFrame();
      
      if (waitForLoad) {
        await this.waitForTicketsPageLoad();
      }
      
      return true;
    } catch (error) {
      await this.handleError(error, 'tickets-navigation');
      return false;
    }
  }

  /**
   * Wait for tickets page to fully load
   */
  async waitForTicketsPageLoad() {
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
      await this.handleError(error, 'tickets-page-load');
      throw error;
    }
  }

  /**
   * Create a new ticket
   * @param {Object} ticketData - Ticket information
   * @returns {Promise<string>} Created ticket ID
   */
  async createTicket(ticketData) {
    try {
      // Navigate to create ticket form
      await this.clickCreateTicket();
      
      // Fill form with ticket data
      await this.fillTicketForm(ticketData);
      
      // Save the ticket
      await this.saveTicket();
      
      // Get the created ticket ID from success message or URL
      const ticketId = await this.getCreatedTicketId();
      
      return ticketId;
    } catch (error) {
      await this.handleError(error, 'create-ticket');
      throw error;
    }
  }

  /**
   * Click create ticket button
   */
  async clickCreateTicket() {
    try {
      const isMobile = await this.isMobileView();
      const buttonSelector = isMobile ? 
        this.selectors.mobileCreateButton : 
        this.selectors.createTicketButton;
      
      await this.click(buttonSelector);
      await this.waitForElement(this.selectors.ticketForm);
    } catch (error) {
      await this.handleError(error, 'click-create-ticket');
      throw error;
    }
  }

  /**
   * Fill ticket form with provided data
   * @param {Object} ticketData - Ticket form data
   */
  async fillTicketForm(ticketData) {
    try {
      // Add MVP user attribution to ticket data
      const mvpTicketData = this.addMVPAttribution(ticketData);
      
      // Fill customer selection
      if (mvpTicketData.customer) {
        await this.selectCustomer(mvpTicketData.customer);
      }
      
      // Fill service type
      if (mvpTicketData.serviceType) {
        await this.selectServiceType(mvpTicketData.serviceType);
      }
      
      // Fill scheduled date
      if (mvpTicketData.scheduledDate) {
        await this.setScheduledDate(mvpTicketData.scheduledDate);
      }
      
      // Fill scheduled time
      if (mvpTicketData.scheduledTime) {
        await this.setScheduledTime(mvpTicketData.scheduledTime);
      }
      
      // Fill priority
      if (mvpTicketData.priority) {
        await this.selectPriority(mvpTicketData.priority);
      }
      
      // Fill status (if editing)
      if (mvpTicketData.status) {
        await this.selectStatus(mvpTicketData.status);
      }
      
      // Fill service notes
      if (mvpTicketData.serviceNotes) {
        await this.setServiceNotes(mvpTicketData.serviceNotes);
      }
      
      // Fill estimated duration
      if (mvpTicketData.estimatedDuration) {
        await this.setEstimatedDuration(mvpTicketData.estimatedDuration);
      }
      
      // Fill special instructions
      if (mvpTicketData.specialInstructions) {
        await this.setSpecialInstructions(mvpTicketData.specialInstructions);
      }
      
    } catch (error) {
      await this.handleError(error, 'fill-ticket-form');
      throw error;
    }
  }

  /**
   * Select customer from dropdown
   * @param {string} customerName - Customer name or ID
   */
  async selectCustomer(customerName) {
    await this.click(this.selectors.customerSelect);
    const customerOption = `[data-testid="customer-option"][data-value="${customerName}"]`;
    await this.waitForElement(customerOption);
    await this.click(customerOption);
  }

  /**
   * Select service type from dropdown
   * @param {string} serviceType - Service type
   */
  async selectServiceType(serviceType) {
    await this.click(this.selectors.serviceTypeSelect);
    const serviceOption = `[data-testid="service-option"][data-value="${serviceType}"]`;
    await this.waitForElement(serviceOption);
    await this.click(serviceOption);
  }

  /**
   * Set scheduled date
   * @param {string} date - Date in YYYY-MM-DD format
   */
  async setScheduledDate(date) {
    await this.type(this.selectors.scheduledDateInput, date);
  }

  /**
   * Set scheduled time
   * @param {string} time - Time in HH:MM format
   */
  async setScheduledTime(time) {
    await this.type(this.selectors.scheduledTimeInput, time);
  }

  /**
   * Select priority from dropdown
   * @param {string} priority - Priority level (Low, Medium, High, Urgent)
   */
  async selectPriority(priority) {
    await this.click(this.selectors.prioritySelect);
    const priorityOption = `[data-testid="priority-option"][data-value="${priority}"]`;
    await this.waitForElement(priorityOption);
    await this.click(priorityOption);
  }

  /**
   * Select status from dropdown
   * @param {string} status - Ticket status
   */
  async selectStatus(status) {
    await this.click(this.selectors.statusSelect);
    const statusOption = `[data-testid="status-option"][data-value="${status}"]`;
    await this.waitForElement(statusOption);
    await this.click(statusOption);
  }

  /**
   * Set service notes
   * @param {string} notes - Service notes text
   */
  async setServiceNotes(notes) {
    await this.type(this.selectors.serviceNotesTextarea, notes);
  }

  /**
   * Set estimated duration
   * @param {number} duration - Duration in minutes
   */
  async setEstimatedDuration(duration) {
    await this.type(this.selectors.estimatedDurationInput, duration.toString());
  }

  /**
   * Set special instructions
   * @param {string} instructions - Special instructions text
   */
  async setSpecialInstructions(instructions) {
    await this.type(this.selectors.specialInstructionsTextarea, instructions);
  }

  /**
   * Save the ticket form
   */
  async saveTicket() {
    try {
      await this.click(this.selectors.saveTicketButton);
      
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
      await this.handleError(error, 'save-ticket');
      throw error;
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
   * Get created ticket ID from success message or URL
   * @returns {Promise<string>} Ticket ID
   */
  async getCreatedTicketId() {
    try {
      // Try to get ID from success message
      const successMessage = await this.getSuccessMessage();
      if (successMessage) {
        const idMatch = successMessage.match(/ticket\s+(\w+)/i);
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
      return this.generateMVPTestId('TKT');
    } catch (error) {
      return this.generateMVPTestId('TKT');
    }
  }

  /**
   * Edit an existing ticket
   * @param {string} ticketId - Ticket ID to edit
   * @param {Object} updatedData - Updated ticket data
   */
  async editTicket(ticketId, updatedData) {
    try {
      // Navigate to edit form
      await this.clickEditTicket(ticketId);
      
      // Fill form with updated data
      await this.fillTicketForm(updatedData);
      
      // Save changes
      await this.saveTicket();
      
      return true;
    } catch (error) {
      await this.handleError(error, `edit-ticket-${ticketId}`);
      throw error;
    }
  }

  /**
   * Click edit button for specific ticket
   * @param {string} ticketId - Ticket ID to edit
   */
  async clickEditTicket(ticketId) {
    try {
      const isMobile = await this.isMobileView();
      
      if (isMobile) {
        // On mobile, tap the ticket card first, then edit button
        await this.tapTicketCard(ticketId);
        await this.page.waitForTimeout(500); // Wait for card expansion
      }
      
      const editButton = this.selectors.editTicketButton(ticketId);
      await this.click(editButton);
      await this.waitForElement(this.selectors.ticketForm);
      
    } catch (error) {
      await this.handleError(error, `click-edit-ticket-${ticketId}`);
      throw error;
    }
  }

  /**
   * Delete a ticket
   * @param {string} ticketId - Ticket ID to delete
   * @param {boolean} confirm - Whether to confirm deletion
   */
  async deleteTicket(ticketId, confirm = true) {
    try {
      // Click delete button
      await this.clickDeleteTicket(ticketId);
      
      // Handle confirmation dialog
      if (confirm) {
        await this.confirmDelete();
      } else {
        await this.cancelDelete();
      }
      
      return confirm;
    } catch (error) {
      await this.handleError(error, `delete-ticket-${ticketId}`);
      throw error;
    }
  }

  /**
   * Click delete button for specific ticket
   * @param {string} ticketId - Ticket ID to delete
   */
  async clickDeleteTicket(ticketId) {
    try {
      const isMobile = await this.isMobileView();
      
      if (isMobile) {
        // On mobile, tap the ticket card first, then delete button
        await this.tapTicketCard(ticketId);
        await this.page.waitForTimeout(500);
      }
      
      const deleteButton = this.selectors.deleteTicketIcon(ticketId);
      await this.click(deleteButton);
      await this.waitForElement(this.selectors.confirmDialog);
      
    } catch (error) {
      await this.handleError(error, `click-delete-ticket-${ticketId}`);
      throw error;
    }
  }

  /**
   * Confirm ticket deletion
   */
  async confirmDelete() {
    await this.click(this.selectors.confirmDeleteButton);
    await this.page.waitForSelector(this.selectors.confirmDialog, { 
      state: 'hidden', 
      timeout: 5000 
    });
  }

  /**
   * Cancel ticket deletion
   */
  async cancelDelete() {
    await this.click(this.selectors.cancelDeleteButton);
    await this.page.waitForSelector(this.selectors.confirmDialog, { 
      state: 'hidden', 
      timeout: 5000 
    });
  }

  /**
   * Search for tickets
   * @param {string} searchTerm - Search term
   */
  async searchTickets(searchTerm) {
    try {
      const isMobile = await this.isMobileView();
      
      if (isMobile) {
        // Open mobile search
        await this.click(this.selectors.mobileSearchToggle);
      }
      
      await this.type(this.selectors.searchInput, searchTerm);
      
      // Wait for search results to load
      await this.page.waitForTimeout(1000);
      
    } catch (error) {
      await this.handleError(error, 'search-tickets');
      throw error;
    }
  }

  /**
   * Filter tickets by criteria
   * @param {string} filterValue - Filter value
   */
  async filterTickets(filterValue) {
    try {
      const isMobile = await this.isMobileView();
      
      if (isMobile) {
        await this.click(this.selectors.mobileFilterToggle);
      }
      
      await this.click(this.selectors.filterDropdown);
      const filterOption = `[data-testid="filter-option"][data-value="${filterValue}"]`;
      await this.waitForElement(filterOption);
      await this.click(filterOption);
      
      // Wait for filtered results
      await this.page.waitForTimeout(1000);
      
    } catch (error) {
      await this.handleError(error, 'filter-tickets');
      throw error;
    }
  }

  /**
   * Get ticket details
   * @param {string} ticketId - Ticket ID
   * @returns {Promise<Object>} Ticket details
   */
  async getTicketDetails(ticketId) {
    try {
      const ticketSelector = this.selectors.ticketItem(ticketId);
      await this.waitForElement(ticketSelector);
      
      const ticketData = await this.page.evaluate((selector) => {
        const ticket = document.querySelector(selector);
        if (!ticket) return null;
        
        return {
          id: ticket.querySelector('[data-testid="ticket-id"]')?.textContent || '',
          customer: ticket.querySelector('[data-testid="ticket-customer"]')?.textContent || '',
          serviceType: ticket.querySelector('[data-testid="ticket-service-type"]')?.textContent || '',
          scheduledDate: ticket.querySelector('[data-testid="ticket-scheduled-date"]')?.textContent || '',
          status: ticket.querySelector('[data-testid="ticket-status"]')?.textContent || '',
          priority: ticket.querySelector('[data-testid="ticket-priority"]')?.textContent || ''
        };
      }, ticketSelector);
      
      return ticketData;
    } catch (error) {
      await this.handleError(error, `get-ticket-details-${ticketId}`);
      throw error;
    }
  }

  /**
   * Check if ticket exists in list
   * @param {string} ticketId - Ticket ID to check
   * @returns {Promise<boolean>} True if ticket exists
   */
  async ticketExists(ticketId) {
    try {
      return await this.elementExists(this.selectors.ticketItem(ticketId));
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all tickets from current list
   * @returns {Promise<Array>} Array of ticket data
   */
  async getAllTickets() {
    try {
      await this.waitForElement(this.selectors.ticketsList);
      
      const tickets = await this.page.evaluate(() => {
        const ticketRows = document.querySelectorAll('[data-testid="ticket-row"]');
        return Array.from(ticketRows).map(row => ({
          id: row.querySelector('[data-testid="ticket-id"]')?.textContent || '',
          customer: row.querySelector('[data-testid="ticket-customer"]')?.textContent || '',
          serviceType: row.querySelector('[data-testid="ticket-service-type"]')?.textContent || '',
          scheduledDate: row.querySelector('[data-testid="ticket-scheduled-date"]')?.textContent || '',
          status: row.querySelector('[data-testid="ticket-status"]')?.textContent || '',
          priority: row.querySelector('[data-testid="ticket-priority"]')?.textContent || ''
        }));
      });
      
      return tickets;
    } catch (error) {
      await this.handleError(error, 'get-all-tickets');
      return [];
    }
  }

  /**
   * Mobile-specific: Tap on ticket card
   * @param {string} ticketId - Ticket ID to tap
   */
  async tapTicketCard(ticketId) {
    try {
      const isMobile = await this.isMobileView();
      if (!isMobile) {
        throw new Error('Not in mobile view - use click instead');
      }
      
      const ticketSelector = this.selectors.ticketItem(ticketId);
      await this.page.tap(ticketSelector);
      
    } catch (error) {
      await this.handleError(error, `tap-ticket-card-${ticketId}`);
      throw error;
    }
  }

  /**
   * Validate form before submission
   * @returns {Promise<Object>} Validation result
   */
  async validateForm() {
    try {
      const validationResult = {
        isValid: true,
        errors: []
      };
      
      // Check required fields
      for (const [field, rules] of Object.entries(this.validationRules)) {
        if (rules.required) {
          const fieldSelector = this.selectors[field + 'Select'] || this.selectors[field + 'Input'];
          const hasValue = await this.page.evaluate((selector) => {
            const element = document.querySelector(selector);
            return element && element.value && element.value.trim() !== '';
          }, fieldSelector);
          
          if (!hasValue) {
            validationResult.isValid = false;
            validationResult.errors.push({
              field: field,
              message: rules.message
            });
          }
        }
      }
      
      return validationResult;
    } catch (error) {
      return { isValid: false, errors: [{ field: 'general', message: 'Validation failed' }] };
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
      return await this.elementExists(this.selectors.mobileTicketCard);
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
   * Refresh tickets list
   */
  async refreshTickets() {
    try {
      await this.click(this.selectors.refreshButton);
      await this.waitForTicketsPageLoad();
    } catch (error) {
      await this.handleError(error, 'refresh-tickets');
      throw error;
    }
  }
}

module.exports = { TicketPage };