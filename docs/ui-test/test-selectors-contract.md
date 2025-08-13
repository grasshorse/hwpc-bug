# Test Selectors Contract

This document defines the agreed-upon selectors for UI testing between Development and QA teams.

## Navigation Elements

| Element | data-testid | Description | Status |
|---------|-------------|-------------|---------|
| Main Navigation | `main-nav` | Primary navigation container | ✅ Implemented |
| Tickets Link | `nav-tickets` | Navigation link to tickets page | ❌ Needs Implementation |
| Customers Link | `nav-customers` | Navigation link to customers page | ❌ Needs Implementation |
| Routes Link | `nav-routes` | Navigation link to routes page | ❌ Needs Implementation |
| Reports Link | `nav-reports` | Navigation link to reports page | ❌ Needs Implementation |
| Dashboard Link | `nav-dashboard` | Navigation link to dashboard page | ❌ Needs Implementation |
| Mobile Menu Toggle | `mobile-menu-toggle` | Hamburger menu for mobile | ❌ Needs Implementation |

## Page Identifiers

| Page | data-testid | Description | Status |
|------|-------------|-------------|---------|
| Tickets Page | `tickets-page` | Main tickets page container | ❌ Needs Implementation |
| Customers Page | `customers-page` | Main customers page container | ❌ Needs Implementation |
| Routes Page | `routes-page` | Main routes page container | ❌ Needs Implementation |
| Reports Page | `reports-page` | Main reports page container | ❌ Needs Implementation |
| Dashboard Page | `dashboard-page` | Main dashboard page container | ❌ Needs Implementation |

## Search Interface

| Element | data-testid | Description | Status |
|---------|-------------|-------------|---------|
| Search Container | `search-container` | Main search interface wrapper | ❌ Needs Implementation |
| Search Input | `search-input` | Search input field | ❌ Needs Implementation |
| Search Button | `search-button` | Search submit button | ❌ Needs Implementation |
| Mobile Search | `mobile-search` | Mobile-specific search interface | ❌ Needs Implementation |

## Guidelines

1. **Naming Convention**: Use kebab-case for all data-testid values
2. **Prefix Convention**: 
   - Navigation: `nav-*`
   - Pages: `*-page`
   - Search: `search-*`
   - Mobile: `mobile-*`
3. **Stability**: These selectors should not be changed without coordination
4. **Documentation**: Update this document when adding new test selectors