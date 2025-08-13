# API Schemas and Specifications

## Overview

This section contains machine-readable API specifications, JSON schemas, and validation rules for the Local Backend API system.

## Available Schemas

### 📄 [OpenAPI Specification](./openapi.yaml)
Complete OpenAPI 3.0 specification with all endpoints, request/response schemas, and validation rules.

### 🔧 [JSON Schemas](./json-schemas/)
Individual JSON schema files for request and response validation:
- [Ticket Schema](./json-schemas/ticket.json)
- [Customer Schema](./json-schemas/customer.json)
- [Route Schema](./json-schemas/route.json)
- [User Schema](./json-schemas/user.json)
- [Error Schema](./json-schemas/error.json)

### 📊 [Response Schemas](./response-schemas/)
Standardized response format schemas:
- [Success Response](./response-schemas/success.json)
- [Error Response](./response-schemas/error.json)
- [Paginated Response](./response-schemas/paginated.json)

## Schema Usage

### Validation with JSON Schema

```javascript
const Ajv = require('ajv');
const customerSchema = require('./json-schemas/customer.json');

const ajv = new Ajv();
const validate = ajv.compile(customerSchema);

// Validate customer data
const customerData = {
  name: "John Doe",
  email: "john@example.com"
};

const valid = validate(customerData);
if (!valid) {
  console.log(validate.errors);
}
```

### OpenAPI Code Generation

```bash
# Generate client SDK
openapi-generator-cli generate \
  -i docs/api/schemas/openapi.yaml \
  -g javascript \
  -o generated/client

# Generate server stubs
openapi-generator-cli generate \
  -i docs/api/schemas/openapi.yaml \
  -g nodejs-express-server \
  -o generated/server
```

## Schema Validation Tools

### Online Validators
- [Swagger Editor](https://editor.swagger.io/) - OpenAPI validation
- [JSON Schema Validator](https://www.jsonschemavalidator.net/) - JSON schema validation

### CLI Tools
```bash
# Install swagger-codegen
npm install -g @apidevtools/swagger-cli

# Validate OpenAPI spec
swagger-cli validate docs/api/schemas/openapi.yaml

# Bundle OpenAPI spec
swagger-cli bundle docs/api/schemas/openapi.yaml -o openapi-bundled.yaml
```

## Schema Maintenance

### Updating Schemas
1. Modify the relevant schema file
2. Validate the schema syntax
3. Test with sample data
4. Update documentation if needed
5. Regenerate client code if applicable

### Version Control
- Schemas are versioned with the API
- Breaking changes require version increment
- Backward compatibility should be maintained when possible

For detailed schema specifications, explore the individual schema files linked above.