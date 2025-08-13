# [Model Name] Data Model

## Overview

Brief description of the model, its purpose, and role in the system.

## Schema Definition

### Fields

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| `id` | UUID | Yes | Yes | Generated | Unique identifier |
| `field1` | String | Yes | No | - | Field description |
| `field2` | Integer | No | No | 0 | Field description |
| `field3` | Boolean | No | No | false | Field description |
| `createdAt` | DateTime | Yes | No | Current time | Creation timestamp |
| `updatedAt` | DateTime | Yes | No | Current time | Last update timestamp |

### Data Types

- **UUID**: Universally unique identifier (v4)
- **String**: Text data with specified length limits
- **Integer**: Numeric values (32-bit signed)
- **Boolean**: True/false values
- **DateTime**: ISO 8601 formatted timestamps
- **Enum**: Predefined set of values

### Constraints

#### Length Constraints
- `field1`: 1-255 characters
- `field2`: 0-999999
- `field3`: N/A

#### Format Constraints
- Email fields must follow RFC 5322 format
- Phone numbers accept various international formats
- UUIDs must be valid v4 format
- Dates must be ISO 8601 format

#### Business Rules
- Specific business logic constraints
- Relationship constraints
- Status transition rules

## Relationships

### One-to-Many Relationships
- **[Model Name] → [Related Model]**: Description of relationship

### Many-to-One Relationships
- **[Related Model] → [Model Name]**: Description of relationship

### Many-to-Many Relationships
- **[Model Name] ↔ [Related Model]**: Description of relationship

## Validation Rules

### Required Field Validation
```json
{
  "field1": "This field is required",
  "field2": "This field is required"
}
```

### Format Validation
```json
{
  "email": "Must be a valid email address",
  "phone": "Must be a valid phone number",
  "url": "Must be a valid URL"
}
```

### Length Validation
```json
{
  "field1": "Must be between 1 and 255 characters",
  "field2": "Must be between 0 and 999999"
}
```

### Custom Validation
- Business-specific validation rules
- Cross-field validation
- Conditional validation

## JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "[Model Name] Schema",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier"
    },
    "field1": {
      "type": "string",
      "minLength": 1,
      "maxLength": 255,
      "description": "Field description"
    },
    "field2": {
      "type": "integer",
      "minimum": 0,
      "maximum": 999999,
      "description": "Field description"
    },
    "field3": {
      "type": "boolean",
      "description": "Field description"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "Creation timestamp"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "Last update timestamp"
    }
  },
  "required": ["id", "field1", "createdAt", "updatedAt"],
  "additionalProperties": false
}
```

## Example Data

### Valid Examples

#### Minimal Valid Record
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "field1": "Example value",
  "createdAt": "2025-01-08T10:30:00.000Z",
  "updatedAt": "2025-01-08T10:30:00.000Z"
}
```

#### Complete Record
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "field1": "Example value",
  "field2": 42,
  "field3": true,
  "createdAt": "2025-01-08T10:30:00.000Z",
  "updatedAt": "2025-01-08T10:30:00.000Z"
}
```

### Invalid Examples

#### Missing Required Field
```json
{
  "field2": 42,
  "field3": true
}
```
*Error: Missing required field 'field1'*

#### Invalid Data Type
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "field1": 123,
  "field2": "not a number"
}
```
*Error: field1 must be string, field2 must be integer*

#### Invalid Format
```json
{
  "id": "invalid-uuid",
  "field1": "",
  "field2": -1
}
```
*Error: Invalid UUID format, field1 cannot be empty, field2 must be >= 0*

## Test Data

### Test Data Generator

```javascript
const faker = require('faker');

function generate[ModelName]TestData(overrides = {}) {
  return {
    id: faker.datatype.uuid(),
    field1: faker.lorem.words(3),
    field2: faker.datatype.number({ min: 0, max: 999999 }),
    field3: faker.datatype.boolean(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides
  };
}

// Generate valid test data
const validData = generate[ModelName]TestData();

// Generate invalid test data
const invalidData = generate[ModelName]TestData({
  field1: '', // Invalid: empty string
  field2: -1  // Invalid: negative number
});
```

### Boundary Test Cases

```javascript
const boundaryTests = [
  // Minimum values
  {
    field1: 'a', // Minimum length
    field2: 0    // Minimum value
  },
  
  // Maximum values
  {
    field1: 'a'.repeat(255), // Maximum length
    field2: 999999           // Maximum value
  },
  
  // Edge cases
  {
    field1: null,     // Null value
    field2: undefined // Undefined value
  }
];
```

## Database Schema

### SQLite Schema
```sql
CREATE TABLE [table_name] (
  id TEXT PRIMARY KEY,
  field1 TEXT NOT NULL,
  field2 INTEGER DEFAULT 0,
  field3 BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_[table_name]_field1 ON [table_name](field1);
CREATE INDEX idx_[table_name]_created_at ON [table_name](created_at);

-- Triggers for updated_at
CREATE TRIGGER update_[table_name]_updated_at 
  AFTER UPDATE ON [table_name]
  BEGIN
    UPDATE [table_name] SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
```

## API Endpoints

### Related Endpoints
- `GET /api/v1/[models]` - List all records
- `POST /api/v1/[models]` - Create new record
- `GET /api/v1/[models]/:id` - Get specific record
- `PUT /api/v1/[models]/:id` - Update record
- `DELETE /api/v1/[models]/:id` - Delete record

### Usage in Other Endpoints
- Referenced as foreign key in [Related Model]
- Used in filtering and search operations
- Included in reporting and analytics

## Common Errors

### Validation Errors
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "errors": [
        {
          "field": "field1",
          "message": "Field1 is required",
          "value": null
        }
      ]
    }
  }
}
```

### Constraint Violations
```json
{
  "success": false,
  "error": {
    "code": "CONSTRAINT_ERROR",
    "message": "Unique constraint violation",
    "details": {
      "field": "email",
      "value": "duplicate@example.com"
    }
  }
}
```

## Migration Notes

### Version History
- v1.0.0: Initial model definition
- v1.1.0: Added field3 (optional, backward compatible)
- v1.2.0: Modified field2 validation (breaking change)

### Breaking Changes
- Changes that require API version increment
- Field removals or type changes
- Constraint modifications

### Migration Scripts
```sql
-- Example migration script
ALTER TABLE [table_name] ADD COLUMN field3 BOOLEAN DEFAULT FALSE;
UPDATE [table_name] SET field3 = FALSE WHERE field3 IS NULL;
```

---

*Last Updated: [Date]*
*Model Version: 1.0.0*