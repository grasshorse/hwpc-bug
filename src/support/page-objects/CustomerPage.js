const { BasePage } = require('./BasePage');

/**
 * CustomerPage class handles customer management functionality
 * Provides CRUD operations, form interactions, and mobile support
 * Supports customer creation, editing, deletion, and search
 */
class CustomerPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Customer page URL patterns
    this.baseUrl = process.env.BASE_URL || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
    this.customersUrl = `${this.baseUrl}?page=customers`;
    this.createCustomerUrl = `${this.baseUrl}?page=customers&action=create`;
    this.editCustomerUrl = (customerId) => `${this.baseUrl}?page=customers&action=edit&id=${customerId}`;
    
    // Customer page selectors
    this.selectors = {
      // Page elements
      pageTitle: '[data-testid="customers-page-title"]',
      loadingSpinner: '[data-testid="loading-spinner"]',
      errorMessage: '[data-testid="error-message"]',
      successMessage: '[data-testid="success-message"]',
      
      // Customer list elements
      customersList: '[data-testid="customers-list"]',
      customerItem: (customerId) => `[data-testid="customer-item-${customerId}"]`,
      customerRow: '[data-testid="customer-row"]',
      noCustomersMessage: '[data-testid="no-customers-message"]',
      
      // List controls
      createCustomerButton: '[data-testid="create-customer-btn"]',
      searchInput: '[data-testid="customers-search"]',
      filterDropdown: '[data-testid="customers-filter"]',
      sortDropdown: '[data-testid="customers-sort"]',
      refreshButton: '[data-testid="refresh-customers-btn"]',
      exportButton: '[data-testid="export-customers-btn"]',
      
      // Customer form elements
      customerForm: '[data-testid="customer-form"]',
      companyNameInput: '[data-testid="company-name"]',
      contactNameInput: '[data-testid="contact-name"]',
      addressInput: '[data-testid="address"]',
      cityInput: '[data-testid="city"]',
      stateSelect: '[data-testid="state-select"]',
      zipCodeInput: '[data-testid="zip-code"]',
      phoneInput: '[data-testid="phone"]',
      emailInput: '[data-testid="email"]',
      serviceTypeSelect: '[data-testid="service-type-select"]',
      specialInstructionsTextarea: '[data-testid="special-instructions"]',
      activeCheckbox: '[data-testid="active-checkbox"]',
      
      // Form buttons
      saveCustomerButton: '[data-testid="save-customer-btn"]',
      cancelButton: '[data-testid="cancel-btn"]',
      deleteCustomerButton: '[data-testid="delete-customer-btn"]',
      
      // Customer actions
      editCustomerButton: (customerId) => `[data-testid="edit-customer-${customerId}"]`,
      deleteCustomerIcon: (customerId) => `[data-testid="delete-customer-${customerId}"]`,
      viewCustomerButton: (customerId) => `[data-testid="view-customer-${customerId}"]`,
      viewTicketsButton: (customerId) => `[data-testid="view-tickets-${customerId}"]`,
      
      // Customer details
      customerDetails: '[data-testid="customer-details"]',
      customerId: '[data-testid="customer-id"]',
      customerCompanyName: '[data-testid="customer-company-name"]',
      customerContactName: '[data-testid="customer-contact-name"]',
      customerAddress: '[data-testid="customer-address"]',
      customerPhone: '[data-testid="customer-phone"]',
      customerEmail: '[data-testid="customer-email"]',
      customerServiceType: '[data-testid="customer-service-type"]',
      customerStatus: '[data-testid="customer-status"]',
      
      // Validation messages
      validationErrors: '[data-testid="validation-errors"]',
      fieldError: (fieldName) => `[data-testid="error-${fieldName}"]`,
      
      // Mobile elements
      mobileCustomerCard: '[data-testid="mobile-customer-card"]',
      mobileCreateButton: '[data-testid="mobile-create-customer"]',
      mobileSearchToggle: '[data-testid="mobile-search-toggle"]',
      mobileFilterToggle: '[data-testid="mobile-filter-toggle"]',
      
      // Confirmation dialogs
      confirmDialog: '[data-testid="confirm-dialog"]',
      confirmDeleteButton: '[data-testid="confirm-delete-btn"]',
      cancelDeleteButton: '[data-testid="cancel-delete-btn"]',
      
      // Customer tickets section
      customerTickets: '[data-testid="customer-tickets"]',
      ticketHistoryTab: '[data-testid="ticket-history-tab"]',
      upcomingTicketsTab: '[data-testid="upcoming-tickets-tab"]'
    };
    
    // Form validation rules
    this.validationRules = {
      companyName: { required: true, message: 'Company name is required' },
      contactName: { required: true, message: 'Contact name is required' },
      address: { required: true, message: 'Address is required' },
      city: { required: true, message: 'City is required' },
      state: { required: true, message: 'State is required' },
      zipCode: { required: true, pattern: /^\d{5}(-\d{4})?$/, message: 'Valid ZIP code is required' },
      phone: { required: true, pattern: /^\(\d{3}\) \d{3}-\d{4}$/, message: 'Valid phone number is required' },
      email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Valid email is required' },
      serviceType: { required: true, message: 'Service type is required' }
    };
    
    // US States for dropdown
    this.states = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];
  }

  /**
   * Navigate to customers page
   * @param {boolean} waitForLoad - Whether to wait for complete page load
   */
  async navigateToCustomers(waitForLoad = true) {
    try {
      await this.navigate(this.customersUrl);
      await this.switchToGoogleSitesFrame();
      
      if (waitForLoad) {
        await this.waitForCustomersPageLoad();
      }
      
      return true;
    } catch (error) {
      await this.handleError(error, 'customers-navigation');
      return false;
    }
  }

  /**
   * Wait for customers page to fully load
   */
  async waitForCustomersPageLoad() {
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
      await this.handleError(error, 'customers-page-load');
      throw error;
    }
  }

  /**
   * Create a new customer
   * @param {Object} customerData - Customer information
   * @returns {Promise<string>} Created customer ID
   */
  async createCustomer(customerData) {
    try {
      // Navigate to create customer form
      await this.clickCreateCustomer();
      
      // Fill form with customer data
      await this.fillCustomerForm(customerData);
      
      // Save the customer
      await this.saveCustomer();
      
      // Get the created customer ID
      const customerId = await this.getCreatedCustomerId();
      
      return customerId;
    } catch (error) {
      await this.handleError(error, 'create-customer');
      throw error;
    }
  }

  /**
   * Click create customer button
   */
  async clickCreateCustomer() {
    try {
      const isMobile = await this.isMobileView();
      const buttonSelector = isMobile ? 
        this.selectors.mobileCreateButton : 
        this.selectors.createCustomerButton;
      
      await this.click(buttonSelector);
      await this.waitForElement(this.selectors.customerForm);
    } catch (error) {
      await this.handleError(error, 'click-create-customer');
      throw error;
    }
  }

  /**
   * Fill customer form with provided data
   * @param {Object} customerData - Customer form data
   */
  async fillCustomerForm(customerData) {
    try {
      // Add MVP user attribution to customer data
      const mvpCustomerData = this.addMVPAttribution(customerData);
      
      // Fill company name
      if (mvpCustomerData.companyName) {
        await this.type(this.selectors.companyNameInput, mvpCustomerData.companyName);
      }
      
      // Fill contact name
      if (mvpCustomerData.contactName) {
        await this.type(this.selectors.contactNameInput, mvpCustomerData.contactName);
      }
      
      // Fill address
      if (mvpCustomerData.address) {
        await this.type(this.selectors.addressInput, mvpCustomerData.address);
      }
      
      // Fill city
      if (mvpCustomerData.city) {
        await this.type(this.selectors.cityInput, mvpCustomerData.city);
      }
      
      // Select state
      if (mvpCustomerData.state) {
        await this.selectState(mvpCustomerData.state);
      }
      
      // Fill ZIP code
      if (mvpCustomerData.zipCode) {
        await this.type(this.selectors.zipCodeInput, mvpCustomerData.zipCode);
      }
      
      // Fill phone
      if (mvpCustomerData.phone) {
        await this.type(this.selectors.phoneInput, mvpCustomerData.phone);
      }
      
      // Fill email
      if (mvpCustomerData.email) {
        await this.type(this.selectors.emailInput, mvpCustomerData.email);
      }
      
      // Select service type
      if (mvpCustomerData.serviceType) {
        await this.selectServiceType(mvpCustomerData.serviceType);
      }
      
      // Fill special instructions
      if (mvpCustomerData.specialInstructions) {
        await this.type(this.selectors.specialInstructionsTextarea, mvpCustomerData.specialInstructions);
      }
      
      // Set active status
      if (mvpCustomerData.active !== undefined) {
        await this.setActiveStatus(mvpCustomerData.active);
      }
      
    } catch (error) {
      await this.handleError(error, 'fill-customer-form');
      throw error;
    }
  }

  /**
   * Select state from dropdown
   * @param {string} state - State abbreviation
   */
  async selectState(state) {
    await this.click(this.selectors.stateSelect);
    const stateOption = `[data-testid="state-option"][data-value="${state}"]`;
    await this.waitForElement(stateOption);
    await this.click(stateOption);
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
   * Set active status checkbox
   * @param {boolean} active - Whether customer is active
   */
  async setActiveStatus(active) {
    const checkbox = await this.waitForElement(this.selectors.activeCheckbox);
    const isChecked = await checkbox.isChecked();
    
    if ((active && !isChecked) || (!active && isChecked)) {
      await this.click(this.selectors.activeCheckbox);
    }
  }

  /**
   * Save the customer form
   */
  async saveCustomer() {
    try {
      await this.click(this.selectors.saveCustomerButton);
      
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
      await this.handleError(error, 'save-customer');
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
   * Get created customer ID from success message or URL
   * @returns {Promise<string>} Customer ID
   */
  async getCreatedCustomerId() {
    try {
      // Try to get ID from success message
      const successMessage = await this.getSuccessMessage();
      if (successMessage) {
        const idMatch = successMessage.match(/customer\s+(\w+)/i);
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
      return this.generateMVPTestId('CUST');
    } catch (error) {
      return this.generateMVPTestId('CUST');
    }
  }

  /**
   * Edit an existing customer
   * @param {string} customerId - Customer ID to edit
   * @param {Object} updatedData - Updated customer data
   */
  async editCustomer(customerId, updatedData) {
    try {
      // Navigate to edit form
      await this.clickEditCustomer(customerId);
      
      // Fill form with updated data
      await this.fillCustomerForm(updatedData);
      
      // Save changes
      await this.saveCustomer();
      
      return true;
    } catch (error) {
      await this.handleError(error, `edit-customer-${customerId}`);
      throw error;
    }
  }

  /**
   * Click edit button for specific customer
   * @param {string} customerId - Customer ID to edit
   */
  async clickEditCustomer(customerId) {
    try {
      const isMobile = await this.isMobileView();
      
      if (isMobile) {
        // On mobile, tap the customer card first, then edit button
        await this.tapCustomerCard(customerId);
        await this.page.waitForTimeout(500);
      }
      
      const editButton = this.selectors.editCustomerButton(customerId);
      await this.click(editButton);
      await this.waitForElement(this.selectors.customerForm);
      
    } catch (error) {
      await this.handleError(error, `click-edit-customer-${customerId}`);
      throw error;
    }
  }

  /**
   * Delete a customer
   * @param {string} customerId - Customer ID to delete
   * @param {boolean} confirm - Whether to confirm deletion
   */
  async deleteCustomer(customerId, confirm = true) {
    try {
      // Click delete button
      await this.clickDeleteCustomer(customerId);
      
      // Handle confirmation dialog
      if (confirm) {
        await this.confirmDelete();
      } else {
        await this.cancelDelete();
      }
      
      return confirm;
    } catch (error) {
      await this.handleError(error, `delete-customer-${customerId}`);
      throw error;
    }
  }

  /**
   * Click delete button for specific customer
   * @param {string} customerId - Customer ID to delete
   */
  async clickDeleteCustomer(customerId) {
    try {
      const isMobile = await this.isMobileView();
      
      if (isMobile) {
        await this.tapCustomerCard(customerId);
        await this.page.waitForTimeout(500);
      }
      
      const deleteButton = this.selectors.deleteCustomerIcon(customerId);
      await this.click(deleteButton);
      await this.waitForElement(this.selectors.confirmDialog);
      
    } catch (error) {
      await this.handleError(error, `click-delete-customer-${customerId}`);
      throw error;
    }
  }

  /**
   * Confirm customer deletion
   */
  async confirmDelete() {
    await this.click(this.selectors.confirmDeleteButton);
    await this.page.waitForSelector(this.selectors.confirmDialog, { 
      state: 'hidden', 
      timeout: 5000 
    });
  }

  /**
   * Cancel customer deletion
   */
  async cancelDelete() {
    await this.click(this.selectors.cancelDeleteButton);
    await this.page.waitForSelector(this.selectors.confirmDialog, { 
      state: 'hidden', 
      timeout: 5000 
    });
  }

  /**
   * Search for customers
   * @param {string} searchTerm - Search term
   */
  async searchCustomers(searchTerm) {
    try {
      const isMobile = await this.isMobileView();
      
      if (isMobile) {
        await this.click(this.selectors.mobileSearchToggle);
      }
      
      await this.type(this.selectors.searchInput, searchTerm);
      
      // Wait for search results to load
      await this.page.waitForTimeout(1000);
      
    } catch (error) {
      await this.handleError(error, 'search-customers');
      throw error;
    }
  }

  /**
   * Filter customers by criteria
   * @param {string} filterValue - Filter value
   */
  async filterCustomers(filterValue) {
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
      await this.handleError(error, 'filter-customers');
      throw error;
    }
  }

  /**
   * Get customer details
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Customer details
   */
  async getCustomerDetails(customerId) {
    try {
      const customerSelector = this.selectors.customerItem(customerId);
      await this.waitForElement(customerSelector);
      
      const customerData = await this.page.evaluate((selector) => {
        const customer = document.querySelector(selector);
        if (!customer) return null;
        
        return {
          id: customer.querySelector('[data-testid="customer-id"]')?.textContent || '',
          companyName: customer.querySelector('[data-testid="customer-company-name"]')?.textContent || '',
          contactName: customer.querySelector('[data-testid="customer-contact-name"]')?.textContent || '',
          address: customer.querySelector('[data-testid="customer-address"]')?.textContent || '',
          phone: customer.querySelector('[data-testid="customer-phone"]')?.textContent || '',
          email: customer.querySelector('[data-testid="customer-email"]')?.textContent || '',
          serviceType: customer.querySelector('[data-testid="customer-service-type"]')?.textContent || '',
          status: customer.querySelector('[data-testid="customer-status"]')?.textContent || ''
        };
      }, customerSelector);
      
      return customerData;
    } catch (error) {
      await this.handleError(error, `get-customer-details-${customerId}`);
      throw error;
    }
  }

  /**
   * Check if customer exists in list
   * @param {string} customerId - Customer ID to check
   * @returns {Promise<boolean>} True if customer exists
   */
  async customerExists(customerId) {
    try {
      return await this.elementExists(this.selectors.customerItem(customerId));
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all customers from current list
   * @returns {Promise<Array>} Array of customer data
   */
  async getAllCustomers() {
    try {
      await this.waitForElement(this.selectors.customersList);
      
      const customers = await this.page.evaluate(() => {
        const customerRows = document.querySelectorAll('[data-testid="customer-row"]');
        return Array.from(customerRows).map(row => ({
          id: row.querySelector('[data-testid="customer-id"]')?.textContent || '',
          companyName: row.querySelector('[data-testid="customer-company-name"]')?.textContent || '',
          contactName: row.querySelector('[data-testid="customer-contact-name"]')?.textContent || '',
          address: row.querySelector('[data-testid="customer-address"]')?.textContent || '',
          phone: row.querySelector('[data-testid="customer-phone"]')?.textContent || '',
          email: row.querySelector('[data-testid="customer-email"]')?.textContent || '',
          serviceType: row.querySelector('[data-testid="customer-service-type"]')?.textContent || '',
          status: row.querySelector('[data-testid="customer-status"]')?.textContent || ''
        }));
      });
      
      return customers;
    } catch (error) {
      await this.handleError(error, 'get-all-customers');
      return [];
    }
  }

  /**
   * View customer tickets
   * @param {string} customerId - Customer ID
   */
  async viewCustomerTickets(customerId) {
    try {
      const viewTicketsButton = this.selectors.viewTicketsButton(customerId);
      await this.click(viewTicketsButton);
      
      // Wait for tickets section to load
      await this.waitForElement(this.selectors.customerTickets);
      
    } catch (error) {
      await this.handleError(error, `view-customer-tickets-${customerId}`);
      throw error;
    }
  }

  /**
   * Mobile-specific: Tap on customer card
   * @param {string} customerId - Customer ID to tap
   */
  async tapCustomerCard(customerId) {
    try {
      const isMobile = await this.isMobileView();
      if (!isMobile) {
        throw new Error('Not in mobile view - use click instead');
      }
      
      const customerSelector = this.selectors.customerItem(customerId);
      await this.page.tap(customerSelector);
      
    } catch (error) {
      await this.handleError(error, `tap-customer-card-${customerId}`);
      throw error;
    }
  }

  /**
   * Export customers list
   * @param {string} format - Export format (csv, excel, pdf)
   */
  async exportCustomers(format = 'csv') {
    try {
      await this.click(this.selectors.exportButton);
      
      // Select export format
      const formatOption = `[data-testid="export-format-${format}"]`;
      await this.waitForElement(formatOption);
      await this.click(formatOption);
      
      // Wait for download to start
      await this.page.waitForTimeout(2000);
      
    } catch (error) {
      await this.handleError(error, `export-customers-${format}`);
      throw error;
    }
  }

  /**
   * Validate customer form before submission
   * @returns {Promise<Object>} Validation result
   */
  async validateForm() {
    try {
      const validationResult = {
        isValid: true,
        errors: []
      };
      
      // Check required fields and patterns
      for (const [field, rules] of Object.entries(this.validationRules)) {
        const fieldSelector = this.selectors[field + 'Input'] || this.selectors[field + 'Select'];
        
        const fieldValue = await this.page.evaluate((selector) => {
          const element = document.querySelector(selector);
          return element ? element.value : '';
        }, fieldSelector);
        
        // Check required
        if (rules.required && (!fieldValue || fieldValue.trim() === '')) {
          validationResult.isValid = false;
          validationResult.errors.push({
            field: field,
            message: rules.message
          });
        }
        
        // Check pattern
        if (rules.pattern && fieldValue && !rules.pattern.test(fieldValue)) {
          validationResult.isValid = false;
          validationResult.errors.push({
            field: field,
            message: rules.message
          });
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
      return await this.elementExists(this.selectors.mobileCustomerCard);
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
   * Refresh customers list
   */
  async refreshCustomers() {
    try {
      await this.click(this.selectors.refreshButton);
      await this.waitForCustomersPageLoad();
    } catch (error) {
      await this.handleError(error, 'refresh-customers');
      throw error;
    }
  }
}

module.exports = { CustomerPage };