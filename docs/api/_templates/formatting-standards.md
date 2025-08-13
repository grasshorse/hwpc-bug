# Documentation Formatting Standards

## Overview

This document defines the consistent formatting standards and conventions used throughout the Local Backend API documentation.

## File Structure Standards

### Directory Organization
```
docs/api/
├── README.md                    # Main documentation index
├── getting-started/             # Setup and quick start guides
├── endpoints/                   # API endpoint documentation
│   ├── README.md               # Endpoints overview
│   ├── auth/                   # Authentication endpoints
│   ├── tickets/                # Ticket management endpoints
│   ├── customers/              # Customer management endpoints
│   ├── routes/                 # Route management endpoints
│   └── reports/                # Reporting endpoints
├── models/                     # Data model documentation
├── authentication/             # Security and auth guides
├── errors/                     # Error handling reference
├── testing/                    # Testing scenarios and examples
├── tools/                      # Testing tools and collections
├── configuration/              # Environment and setup
├── schemas/                    # JSON schemas and OpenAPI specs
└── _templates/                 # Documentation templates
```

### File Naming Conventions
- Use lowercase with hyphens: `customer-management.md`
- README.md for directory index files
- Descriptive names that match content: `error-handling.md`
- Template files prefixed with underscore: `_endpoint-template.md`

## Markdown Standards

### Headers
Use ATX-style headers with proper hierarchy:

```markdown
# Main Title (H1) - Only one per document
## Section Title (H2)
### Subsection Title (H3)
#### Detail Title (H4)
##### Minor Detail (H5)
###### Smallest Detail (H6)
```

### Code Blocks
Always specify language for syntax highlighting:

```markdown
```bash
curl -X GET http://localhost:3000/api/v1/tickets
```

```json
{
  "success": true,
  "data": []
}
```

```javascript
const response = await fetch('/api/v1/tickets');
```
```

### Tables
Use consistent table formatting:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
| Value A  | Value B  | Value C  |
```

### Lists
Use consistent list formatting:

```markdown
### Unordered Lists
- Item 1
- Item 2
  - Sub-item A
  - Sub-item B
- Item 3

### Ordered Lists
1. First item
2. Second item
   1. Sub-item A
   2. Sub-item B
3. Third item

### Task Lists
- [x] Completed task
- [ ] Pending task
- [ ] Another pending task
```

### Links
Use descriptive link text:

```markdown
<!-- Good -->
See the [Authentication Guide](../authentication/README.md) for details.

<!-- Avoid -->
Click [here](../authentication/README.md) for authentication info.
```

### Emphasis
Use consistent emphasis formatting:

```markdown
- **Bold** for important terms and field names
- *Italic* for emphasis and variable names
- `Code` for inline code, endpoints, and values
- > Blockquotes for important notes
```

## Content Standards

### Endpoint Documentation Format

```markdown
# [HTTP Method] [Endpoint Path]

## Overview
Brief description of endpoint purpose.

## Endpoint Details
- **URL**: `[METHOD] [Full URL]`
- **Authentication**: Required/Not Required
- **Content-Type**: `application/json`

## Request
### Path Parameters
### Query Parameters  
### Request Headers
### Request Body

## Response
### Success Response
### Error Responses

## Examples
### cURL Example
### JavaScript Example
### Python Example

## Testing Scenarios
### Positive Test Cases
### Negative Test Cases
### Edge Cases

## Related Endpoints
## Notes
```

### Model Documentation Format

```markdown
# [Model Name] Data Model

## Overview
## Schema Definition
## Relationships
## Validation Rules
## JSON Schema
## Example Data
## Test Data
## Database Schema
## API Endpoints
## Common Errors
## Migration Notes
```

### Error Documentation Format

```markdown
# Error Code: [ERROR_CODE]

## Description
## HTTP Status Code
## Common Causes
## Example Response
## Resolution Steps
## Related Errors
```

## Code Example Standards

### cURL Examples
Always include complete, working examples:

```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "555-0123"
  }'
```

### JSON Examples
Use realistic, consistent test data:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "555-0123",
  "createdAt": "2025-01-08T10:30:00.000Z",
  "updatedAt": "2025-01-08T10:30:00.000Z"
}
```

### Response Examples
Always show complete response structure:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "meta": {
    "timestamp": "2025-01-08T10:30:00.000Z",
    "version": "1.0.0",
    "requestId": "uuid-v4"
  }
}
```

## Consistent Terminology

### API Terms
- **Endpoint**: API URL and HTTP method combination
- **Resource**: Data entity (customer, ticket, route)
- **Request**: HTTP request sent to API
- **Response**: HTTP response from API
- **Payload**: Request or response body data

### HTTP Terms
- Use proper HTTP method names: GET, POST, PUT, DELETE
- Use proper status codes: 200 OK, 201 Created, 400 Bad Request
- Use proper header names: Content-Type, Authorization

### Data Terms
- **Field**: Individual data property
- **Schema**: Data structure definition
- **Validation**: Data format and constraint checking
- **Constraint**: Data limitation or requirement

## Documentation Metadata

### File Headers
Include consistent metadata at the end of files:

```markdown
---

*Last Updated: January 2025*
*API Version: 1.0.0*
*Document Version: 1.0*
```

### Change Tracking
Document significant changes:

```markdown
## Change History

- v1.2 (Jan 2025): Added new error codes
- v1.1 (Dec 2024): Updated response format
- v1.0 (Nov 2024): Initial documentation
```

## Cross-References

### Internal Links
Use relative paths for internal documentation:

```markdown
- [Getting Started](../getting-started/README.md)
- [Customer Model](../models/customer.md)
- [Error Handling](../errors/README.md)
```

### External Links
Include relevant external resources:

```markdown
- [HTTP Status Codes](https://httpstatuses.com/)
- [JSON Schema](https://json-schema.org/)
- [OpenAPI Specification](https://swagger.io/specification/)
```

## Validation Checklist

### Content Review
- [ ] All examples are tested and working
- [ ] All links are valid and accessible
- [ ] Terminology is consistent throughout
- [ ] Code examples include proper syntax highlighting
- [ ] Tables are properly formatted
- [ ] Headers follow proper hierarchy

### Technical Review
- [ ] API endpoints match actual implementation
- [ ] Response examples match actual API responses
- [ ] Error codes and messages are accurate
- [ ] Schema definitions are complete
- [ ] Validation rules are documented

### Style Review
- [ ] Follows established formatting standards
- [ ] Uses consistent terminology
- [ ] Includes appropriate metadata
- [ ] Cross-references are helpful and relevant
- [ ] Content is organized logically

## Tools and Automation

### Markdown Linting
Use markdownlint for consistency:

```bash
# Install markdownlint
npm install -g markdownlint-cli

# Lint documentation
markdownlint docs/api/**/*.md
```

### Link Checking
Validate all links regularly:

```bash
# Install markdown-link-check
npm install -g markdown-link-check

# Check links
markdown-link-check docs/api/**/*.md
```

### Spell Checking
Use spell checking tools:

```bash
# Install cspell
npm install -g cspell

# Check spelling
cspell "docs/api/**/*.md"
```

## Template Usage

### Creating New Documentation
1. Copy appropriate template from `_templates/`
2. Replace placeholder content with actual information
3. Follow formatting standards
4. Validate examples and links
5. Review for consistency

### Template Customization
- Modify templates to match project needs
- Keep templates updated with current standards
- Document any template changes

---

*Last Updated: January 2025*
*Standards Version: 1.0*