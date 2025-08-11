@navigation @hwpc @catdebug
Feature: Page Navigation Testing
    As a QA engineer, I want to test page navigation functionality
    So that I can ensure users can access all main application areas reliably

  Background:
    Given user is on baseurl

  @navigation @responsive @regression @sanity
  Scenario Outline: Navigate to main pages with responsive validation
    When the user clicks "<page>"
    And I pause for debugging
    Then user should be on "<page>"
    #And the navigation interface should be responsive

    Examples:
      | page      |
      | tickets   |
      | customers |
#      | routes    |
#      | reports   |
#      | dashboard |

#   @navigation @mobile @responsive
#   Scenario Outline: Mobile navigation via mobile menu
#     Given user is on baseurl with "mobile" viewport
#     When the user navigates to "<page>" via mobile menu
#     Then user should be on "<page>"
#     And the navigation interface should be responsive
#     And all touch targets should meet minimum size requirements

#     Examples:
#       | page      |
#       | tickets   |
#       | customers |
#       | routes    |
#       | reports   |
#       | dashboard |

#   @navigation @responsive @cross-viewport
#   Scenario: Cross-viewport navigation responsiveness
#     Given user is on baseurl
#     When the user clicks "tickets"
#     Then user should be on "tickets"
#     And the navigation should adapt to viewport changes

#   @navigation @performance
#   Scenario Outline: Navigation performance validation
#     Given user is on baseurl
#     When the user clicks "<page>"
#     Then user should be on "<page>"
#     And the page should load within 8 seconds

#     Examples:
#       | page      |
#       | tickets   |
#       | customers |
#       | routes    |
#       | reports   |
#       | dashboard |

#   @navigation @error-handling
#   Scenario Outline: Navigation error recovery
#     Given user is on baseurl
#     When the user navigates to "<page>" with smart recovery
#     Then user should be on "<page>"
#     And the page should not be in an error state

#     Examples:
#       | page      |
#       | tickets   |
#       | customers |
#       | routes    |
#       | reports   |
#       | dashboard |

#   @navigation @accessibility
#   Scenario: Navigation accessibility validation
#     Given user is on baseurl
#     Then all navigation links should be accessible
#     And the navigation should be responsive for current viewport
