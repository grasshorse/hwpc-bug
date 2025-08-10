@hwpc @api
Feature: HWPC API Testing
  As a QA engineer
  I want to test HWPC API endpoints
  So that I can verify the API functionality works correctly

  Background:
    Given user has access to HWPC API

  @smoke @health
  Scenario: User can check HWPC API health
    When user checks HWPC API health
    Then user should get a successful response with status code 200
    And user should get HWPC API success response
    And user should get HWPC API response with data

  @tickets @get
  Scenario: User can retrieve all tickets via API
    When user makes a request to retrieve all HWPC tickets
    Then user should get a successful response with status code 200
    And user should get list of HWPC tickets

  @tickets @get
  Scenario: User can retrieve a specific ticket by ID
    When user makes a request to retrieve HWPC ticket with ID "47106086-7189-492b-9431-272992408b77"
    Then user should get a successful response with status code 200
    And user should get HWPC ticket with ID "47106086-7189-492b-9431-272992408b77"

  @tickets @create
  Scenario: User can create a new ticket via API
    When user creates a new HWPC ticket with title "Test API Ticket", description "This is a test ticket created via API", and priority "medium"
    Then user should get a successful response with status code 201
    And user should get created HWPC ticket with title "Test API Ticket", priority "medium", and status "open"
    And user stores HWPC ticket ID from response
    Then user cleans up the created HWPC ticket

  @tickets @update
  Scenario: User can update an existing ticket via API
    Given user creates a new HWPC ticket with title "Original Title", description "Original description", and priority "low"
    And user stores HWPC ticket ID from response
    When user updates HWPC ticket with stored ID with title "Updated Title" and status "in_progress"
    Then user should get a successful response with status code 200
    And user should get HWPC ticket with title "Updated Title"
    And user should get HWPC ticket with status "in_progress"
    Then user cleans up the created HWPC ticket

  @tickets @delete
  Scenario: User can delete a ticket via API
    Given user creates a new HWPC ticket with title "Ticket to Delete", description "This ticket will be deleted", and priority "low"
    And user stores HWPC ticket ID from response
    When user deletes HWPC ticket with stored ID
    Then user should get a successful response with status code 200

  @tickets @customer
  Scenario: User can retrieve tickets by customer
    When user retrieves HWPC tickets for customer "443364a5-ec9b-40da-94e5-63bda08de469"
    Then user should get a successful response with status code 200
    And user should get list of HWPC tickets

  @tickets @status
  Scenario: User can retrieve tickets by status
    When user retrieves HWPC tickets with status "open"
    Then user should get a successful response with status code 200
    And user should get list of HWPC tickets

  @tickets @stats
  Scenario: User can retrieve ticket statistics
    When user retrieves HWPC ticket statistics
    Then user should get a successful response with status code 200
    And user should get HWPC API success response

  @users @profile @error-handling
  Scenario: User gets error when retrieving user profile (no authenticated user)
    When user retrieves current HWPC user profile
    Then user should get an error response with status code 404
    And user should get HWPC API error with code "USER_NOT_FOUND"
    And user should get HWPC API error message containing "not found"

  @users @preferences @error-handling
  Scenario: User gets error when updating preferences (no authenticated user)
    When user updates HWPC user preferences with theme "dark" and notifications "true"
    Then user should get an error response with status code 500
    And user should get HWPC API error with code "INTERNAL_ERROR"
    And user should get HWPC API error message containing "error occurred"

  @customers @crud
  Scenario: User can manage customers via API
    When user makes a request to retrieve all HWPC customers
    Then user should get a successful response with status code 200
    And user should get list of HWPC customers
    
    When user creates a new HWPC customer with name "Test Customer", email "test@example.com", and phone "555-0123"
    Then user should get a successful response with status code 201
    And user should get HWPC API success response
    Then user cleans up the created HWPC customer

  @routes @get
  Scenario: User can retrieve routes via API
    When user makes a request to retrieve all HWPC routes
    Then user should get a successful response with status code 200
    And user should get list of HWPC routes

  @dashboard @reports
  Scenario: User can retrieve dashboard data
    When user retrieves HWPC dashboard data
    Then user should get a successful response with status code 200
    And user should get HWPC API success response

  @error-handling @tickets
  Scenario: User gets error when retrieving non-existent ticket
    When user makes a request to retrieve HWPC ticket with ID "550e8400-e29b-41d4-a716-999999999999"
    Then user should get an error response with status code 404
    And user should get HWPC API error with code "NOT_FOUND"
    And user should get HWPC API error message containing "not found"

  @error-handling @tickets
  Scenario: User gets validation error when creating ticket with missing data
    When user creates a new HWPC ticket with title "", description "Missing title", and priority "invalid_priority"
    Then user should get an error response with status code 400
    And user should get HWPC API error with code "VALIDATION_ERROR"
    And user should get validation error for field "title"
    And user should get validation error for field "priority"

  @cleanup
  Scenario: Cleanup API client
    Then user cleans up HWPC API client