@customer-management @hwpc
Feature: Customer Management System
  As a pest control service specialist
  I want to create, view, update, and delete customer records
  So that I can maintain accurate customer information and service history

  Background:
    Given I am authenticated as MVP user "usermvp@hwpc.net"
    And I have access to the customer management interface

  @crud @smoke @desktop
  Scenario: Create a new customer record
    Given I am on the customer management page
    When I click the "Create New Customer" button
    And I enter customer company name "ABC Pest Control Inc"
    And I enter contact name "John Smith"
    And I enter address "123 Main Street"
    And I enter city "Springfield"
    And I select state "IL"
    And I enter zip code "62701"
    And I enter phone number "555-0123"
    And I enter email "john.smith@abcpest.com"
    And I select service type "Monthly Treatment"
    And I enter special instructions "Gate code: 1234, Dog in backyard"
    And I click "Save Customer"
    Then the customer should be created successfully
    And I should see a success message "Customer created successfully"
    And the customer should appear in the customer list
    And the customer status should be "Active"
    And the Google Sheets backend should contain the new customer data
    And the customer should be marked as created by "usermvp@hwpc.net"

  @crud @desktop
  Scenario: View customer details
    Given I have a customer "DEF Services LLC" in the system
    And I am on the customer management page
    When I click on customer "DEF Services LLC"
    Then I should see the customer detail view
    And I should see company name "DEF Services LLC"
    And I should see all customer contact information
    And I should see service history section
    And I should see related tickets section
    And I should see customer status and service preferences

  @crud @desktop
  Scenario: Update existing customer information
    Given I have a customer "GHI Industries" in the system
    And I am on the customer management page
    When I click on customer "GHI Industries"
    And I click the "Edit Customer" button
    And I update the phone number to "555-9876"
    And I update the email to "updated@ghiindustries.com"
    And I update special instructions to "Updated: Use side entrance"
    And I click "Save Changes"
    Then the customer should be updated successfully
    And I should see a success message "Customer updated successfully"
    And the updated information should be displayed
    And the Google Sheets backend should reflect the changes
    And the last modified timestamp should be updated

  @crud @desktop
  Scenario: Delete customer record
    Given I have a customer "Test Customer Delete" in the system
    And I am on the customer management page
    When I click on customer "Test Customer Delete"
    And I click the "Delete Customer" button
    And I confirm the deletion in the confirmation dialog
    Then the customer should be deleted successfully
    And I should see a success message "Customer deleted successfully"
    And the customer should no longer appear in the customer list
    And the customer should be marked as deleted in Google Sheets backend

  @search @desktop
  Scenario: Search for customers by company name
    Given I have customers "Alpha Corp", "Beta LLC", and "Gamma Inc" in the system
    And I am on the customer management page
    When I enter "Beta" in the customer search field
    And I click the search button
    Then I should see only customers matching "Beta"
    And I should see "Beta LLC" in the search results
    And I should not see "Alpha Corp" or "Gamma Inc"

  @search @desktop
  Scenario: Filter customers by service type
    Given I have customers with different service types in the system
    And I am on the customer management page
    When I click the filter button
    And I select service type filter "Monthly Treatment"
    And I apply the filter
    Then I should see only customers with "Monthly Treatment" service
    And the customer count should reflect the filtered results

  @validation @desktop
  Scenario: Validate required fields when creating customer
    Given I am on the customer management page
    When I click the "Create New Customer" button
    And I leave the company name field empty
    And I leave the phone number field empty
    And I click "Save Customer"
    Then I should see validation errors
    And I should see error message "Company name is required"
    And I should see error message "Phone number is required"
    And the customer should not be created
    And no data should be sent to Google Sheets

  @validation @desktop
  Scenario: Validate email format
    Given I am on the customer management page
    When I click the "Create New Customer" button
    And I enter customer company name "Email Test Corp"
    And I enter phone number "555-0123"
    And I enter email "invalid-email-format"
    And I click "Save Customer"
    Then I should see validation error "Please enter a valid email address"
    And the customer should not be created

  @validation @desktop
  Scenario: Validate phone number format
    Given I am on the customer management page
    When I click the "Create New Customer" button
    And I enter customer company name "Phone Test Corp"
    And I enter phone number "123"
    And I click "Save Customer"
    Then I should see validation error "Please enter a valid phone number"
    And the customer should not be created

  @mobile @responsive @crud
  Scenario: Create customer on mobile device
    Given I am using a mobile device with screen size "375x667"
    And I am on the customer management page
    When I tap the "Create New Customer" button
    And I enter customer company name "Mobile Test Corp"
    And I enter contact name "Jane Doe"
    And I enter phone number "555-0456"
    And I scroll down to see more fields
    And I enter email "jane@mobiletest.com"
    And I select service type "Quarterly Treatment"
    And I tap "Save Customer"
    Then the customer should be created successfully
    And I should see a mobile-optimized success message
    And the customer should appear in the mobile customer list
    And all form fields should be touch-friendly
    And the interface should be responsive

  @mobile @responsive @touch
  Scenario: Navigate customer list on mobile with touch gestures
    Given I am using a mobile device with screen size "375x667"
    And I have multiple customers in the system
    And I am on the customer management page
    When I scroll down through the customer list
    And I tap on a customer card
    Then the customer details should open in mobile view
    And all customer information should be readable
    And action buttons should be appropriately sized for touch
    And I should be able to swipe back to the customer list

  @mobile @responsive @search
  Scenario: Search customers on mobile device
    Given I am using a mobile device with screen size "375x667"
    And I have customers "Mobile Corp A", "Mobile Corp B", and "Desktop Inc" in the system
    And I am on the customer management page
    When I tap the search icon
    And I enter "Mobile" in the search field using mobile keyboard
    And I tap the search button
    Then I should see mobile-optimized search results
    And I should see "Mobile Corp A" and "Mobile Corp B"
    And the search interface should be touch-friendly

  @mobile @responsive @edit
  Scenario: Edit customer on mobile device
    Given I am using a mobile device with screen size "375x667"
    And I have a customer "Mobile Edit Test" in the system
    And I am on the customer management page
    When I tap on customer "Mobile Edit Test"
    And I tap the "Edit" button
    And I update the phone number using mobile keyboard
    And I scroll to see the save button
    And I tap "Save Changes"
    Then the customer should be updated successfully
    And I should see mobile-optimized confirmation
    And the updated information should be displayed correctly

  @google-sheets @integration @desktop
  Scenario: Verify customer data synchronization with Google Sheets
    Given I am on the customer management page
    When I create a new customer "Sheets Sync Test Corp"
    Then the customer data should be immediately available in Google Sheets
    And the Google Sheets row should contain all customer fields
    And the created timestamp should match the UI creation time
    And the created by field should be "usermvp@hwpc.net"

  @google-sheets @integration @desktop
  Scenario: Verify customer update synchronization
    Given I have a customer "Sheets Update Test" in the system
    And the customer exists in Google Sheets
    When I update the customer's email address
    Then the Google Sheets data should be updated within 5 seconds
    And the modified timestamp should be updated in Google Sheets
    And the modified by field should be "usermvp@hwpc.net"

  @google-sheets @integration @desktop
  Scenario: Handle Google Sheets connection errors gracefully
    Given Google Sheets API is temporarily unavailable
    And I am on the customer management page
    When I try to create a new customer "Error Test Corp"
    Then I should see an error message "Unable to save customer data. Please try again."
    And the customer should not appear in the local list
    And I should have the option to retry the operation

  @data-validation @google-sheets @desktop
  Scenario: Prevent duplicate customer entries
    Given I have a customer "Duplicate Test Corp" with phone "555-1111" in the system
    And I am on the customer management page
    When I try to create another customer with phone "555-1111"
    And I click "Save Customer"
    Then I should see validation error "A customer with this phone number already exists"
    And the duplicate customer should not be created
    And no duplicate entry should be added to Google Sheets

  @performance @desktop
  Scenario: Customer list loads efficiently with large dataset
    Given I have 500+ customers in the system
    And I am on the customer management page
    When the customer list loads
    Then the page should load within 3 seconds
    And I should see the first 50 customers
    And pagination controls should be available
    And search functionality should remain responsive

  @accessibility @desktop
  Scenario: Customer management interface is accessible
    Given I am on the customer management page
    When I navigate using only keyboard controls
    Then all interactive elements should be keyboard accessible
    And form fields should have proper labels
    And error messages should be announced by screen readers
    And the interface should meet WCAG 2.1 AA standards

  @mvp @test-data
  Scenario: Test customer data is properly identified
    Given I am authenticated as MVP user "usermvp@hwpc.net"
    And I am on the customer management page
    When I create a new customer "MVP Test Customer"
    Then the customer should be marked as created by "usermvp@hwpc.net"
    And the customer should have the "mvpTestData" flag set to true
    And the customer should be easily identifiable as test data
    And the customer should have a test data prefix in Google Sheets