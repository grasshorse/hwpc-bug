@dual-mode-test
Feature: Dual Mode Testing Framework
  As a developer
  I want to test the dual-mode framework integration
  So that I can verify mode detection and context setup work correctly

  @isolated
  Scenario: Test isolated mode detection
    Given I am running a test in isolated mode
    When the test framework detects the mode
    Then it should setup an isolated database context
    And the test should have access to test data

  @production
  Scenario: Test production mode detection
    Given I am running a test in production mode
    When the test framework detects the mode
    Then it should setup a production test data context
    And the test should have access to looneyTunes test data

  @dual
  Scenario: Test dual mode support
    Given I am running a test that supports dual mode
    When the test framework detects the mode
    Then it should setup the appropriate context based on environment
    And the test should work in either mode