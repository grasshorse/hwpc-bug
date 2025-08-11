"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * HWPC API Constants - Following existing REST patterns
 * Contains endpoint definitions, JSON paths, and API-specific constants
 */
class HWPCAPIConstants {
}
exports.default = HWPCAPIConstants;
// ===== API ENDPOINTS =====
// Authentication & User Management (Currently no auth required)
HWPCAPIConstants.AUTH_USER_EP = "/api/v1/auth/user";
HWPCAPIConstants.AUTH_PREFERENCES_EP = "/api/v1/auth/user/preferences";
// Ticket Management
HWPCAPIConstants.TICKETS_EP = "/api/v1/tickets";
HWPCAPIConstants.SINGLE_TICKET_EP = "/api/v1/tickets/{id}";
HWPCAPIConstants.TICKETS_BY_CUSTOMER_EP = "/api/v1/tickets/customer/{id}";
HWPCAPIConstants.TICKETS_BY_STATUS_EP = "/api/v1/tickets/status/{status}";
HWPCAPIConstants.TICKET_STATS_EP = "/api/v1/tickets/stats";
// Customer Management
HWPCAPIConstants.CUSTOMERS_EP = "/api/v1/customers";
HWPCAPIConstants.SINGLE_CUSTOMER_EP = "/api/v1/customers/{id}";
HWPCAPIConstants.SEARCH_CUSTOMERS_EP = "/api/v1/customers/search";
// Route Management
HWPCAPIConstants.ROUTES_EP = "/api/v1/routes";
HWPCAPIConstants.SINGLE_ROUTE_EP = "/api/v1/routes/{id}";
// Reports & Analytics
HWPCAPIConstants.DASHBOARD_EP = "/api/v1/reports/dashboard";
HWPCAPIConstants.CUSTOM_REPORTS_EP = "/api/v1/reports/custom";
HWPCAPIConstants.CHART_DATA_EP = "/api/v1/reports/charts";
// Health Monitoring
HWPCAPIConstants.HEALTH_EP = "/health";
HWPCAPIConstants.API_HEALTH_EP = "/api/v1/health";
// ===== JSON PATH CONSTANTS =====
// Authentication Response Paths
HWPCAPIConstants.AUTH_TOKEN_JSON_PATH = "$.token";
HWPCAPIConstants.REFRESH_TOKEN_JSON_PATH = "$.refreshToken";
HWPCAPIConstants.SESSION_TOKEN_JSON_PATH = "$.sessionId";
HWPCAPIConstants.EXPIRES_AT_JSON_PATH = "$.expiresAt";
// User Response Paths (API returns data in $.data field)
HWPCAPIConstants.USER_NAME_JSON_PATH = "$.data.username";
HWPCAPIConstants.USER_EMAIL_JSON_PATH = "$.data.email";
HWPCAPIConstants.USER_FIRST_NAME_JSON_PATH = "$.data.firstName";
HWPCAPIConstants.USER_LAST_NAME_JSON_PATH = "$.data.lastName";
HWPCAPIConstants.USER_ROLE_JSON_PATH = "$.data.role";
HWPCAPIConstants.USER_DEPARTMENT_JSON_PATH = "$.data.department";
HWPCAPIConstants.USER_CREATED_AT_JSON_PATH = "$.data.createdAt";
HWPCAPIConstants.USER_LAST_LOGIN_JSON_PATH = "$.data.lastLogin";
HWPCAPIConstants.USER_ID_JSON_PATH = "$.data.id";
// Ticket Response Paths (API returns data in $.data field)
HWPCAPIConstants.TICKET_ID_JSON_PATH = "$.data.id";
HWPCAPIConstants.TICKET_TITLE_JSON_PATH = "$.data.title";
HWPCAPIConstants.TICKET_DESCRIPTION_JSON_PATH = "$.data.description";
HWPCAPIConstants.TICKET_STATUS_JSON_PATH = "$.data.status";
HWPCAPIConstants.TICKET_PRIORITY_JSON_PATH = "$.data.priority";
HWPCAPIConstants.TICKET_CATEGORY_JSON_PATH = "$.data.category";
HWPCAPIConstants.TICKET_ASSIGNED_TO_JSON_PATH = "$.data.assignedTo";
HWPCAPIConstants.TICKET_CREATED_BY_JSON_PATH = "$.data.createdBy";
HWPCAPIConstants.TICKET_CREATED_AT_JSON_PATH = "$.data.createdAt";
HWPCAPIConstants.TICKET_UPDATED_AT_JSON_PATH = "$.data.updatedAt";
HWPCAPIConstants.TICKET_DUE_DATE_JSON_PATH = "$.data.dueDate";
HWPCAPIConstants.TICKET_RESOLVED_AT_JSON_PATH = "$.data.resolvedAt";
// Array/List Response Paths (for multiple items in $.data array)
HWPCAPIConstants.FIRST_TICKET_ID_JSON_PATH = "$.data[0].id";
HWPCAPIConstants.FIRST_TICKET_TITLE_JSON_PATH = "$.data[0].title";
HWPCAPIConstants.FIRST_TICKET_STATUS_JSON_PATH = "$.data[0].status";
HWPCAPIConstants.FIRST_TICKET_PRIORITY_JSON_PATH = "$.data[0].priority";
HWPCAPIConstants.FIRST_TICKET_CREATED_AT_JSON_PATH = "$.data[0].createdAt";
HWPCAPIConstants.FIRST_USER_ID_JSON_PATH = "$.data[0].id";
HWPCAPIConstants.FIRST_USER_NAME_JSON_PATH = "$.data[0].username";
HWPCAPIConstants.FIRST_USER_EMAIL_JSON_PATH = "$.data[0].email";
// Search Results Paths
HWPCAPIConstants.SEARCH_RESULTS_JSON_PATH = "$.data.results";
HWPCAPIConstants.SEARCH_TOTAL_COUNT_JSON_PATH = "$.data.totalCount";
HWPCAPIConstants.SEARCH_PAGE_JSON_PATH = "$.data.page";
HWPCAPIConstants.SEARCH_PAGE_SIZE_JSON_PATH = "$.data.pageSize";
HWPCAPIConstants.SEARCH_HAS_MORE_JSON_PATH = "$.data.hasMore";
// Error Response Paths
HWPCAPIConstants.ERROR_CODE_JSON_PATH = "$.error.code";
HWPCAPIConstants.ERROR_MESSAGE_JSON_PATH = "$.error.message";
HWPCAPIConstants.ERROR_DETAILS_JSON_PATH = "$.error.details";
HWPCAPIConstants.VALIDATION_ERRORS_JSON_PATH = "$.error.validationErrors";
// ===== HTTP HEADERS =====
HWPCAPIConstants.CONTENT_TYPE = "content-type";
HWPCAPIConstants.APPLICATION_JSON = "application/json";
HWPCAPIConstants.APPLICATION_XML = "application/xml";
HWPCAPIConstants.MULTIPART_FORM_DATA = "multipart/form-data";
HWPCAPIConstants.ACCEPT = "accept";
HWPCAPIConstants.AUTHORIZATION = "authorization";
HWPCAPIConstants.BEARER = "Bearer";
HWPCAPIConstants.BASIC = "Basic";
HWPCAPIConstants.SESSION_HEADER = "X-Session-ID";
HWPCAPIConstants.API_KEY_HEADER = "X-API-Key";
HWPCAPIConstants.REQUEST_ID_HEADER = "X-Request-ID";
// ===== API RESPONSE DESCRIPTIONS =====
HWPCAPIConstants.USER_PROFILE = "User Profile";
HWPCAPIConstants.USER_PREFERENCES = "User Preferences";
HWPCAPIConstants.ALL_TICKETS = "All Tickets";
HWPCAPIConstants.SINGLE_TICKET = "Single Ticket";
HWPCAPIConstants.CREATE_TICKET = "Create Ticket";
HWPCAPIConstants.UPDATE_TICKET = "Update Ticket";
HWPCAPIConstants.DELETE_TICKET = "Delete Ticket";
HWPCAPIConstants.CUSTOMER_TICKETS = "Customer Tickets";
HWPCAPIConstants.STATUS_TICKETS = "Status Tickets";
HWPCAPIConstants.TICKET_STATISTICS = "Ticket Statistics";
HWPCAPIConstants.ALL_CUSTOMERS = "All Customers";
HWPCAPIConstants.SINGLE_CUSTOMER = "Single Customer";
HWPCAPIConstants.CREATE_CUSTOMER = "Create Customer";
HWPCAPIConstants.UPDATE_CUSTOMER = "Update Customer";
HWPCAPIConstants.DELETE_CUSTOMER = "Delete Customer";
HWPCAPIConstants.CUSTOMER_SEARCH = "Customer Search";
HWPCAPIConstants.TICKET_SEARCH = "Ticket Search";
HWPCAPIConstants.ALL_ROUTES = "All Routes";
HWPCAPIConstants.SINGLE_ROUTE = "Single Route";
HWPCAPIConstants.DASHBOARD = "Dashboard";
HWPCAPIConstants.API_HEALTH = "API Health";
// ===== HTTP STATUS CODES =====
HWPCAPIConstants.STATUS_OK = 200;
HWPCAPIConstants.STATUS_CREATED = 201;
HWPCAPIConstants.STATUS_NO_CONTENT = 204;
HWPCAPIConstants.STATUS_BAD_REQUEST = 400;
HWPCAPIConstants.STATUS_UNAUTHORIZED = 401;
HWPCAPIConstants.STATUS_FORBIDDEN = 403;
HWPCAPIConstants.STATUS_NOT_FOUND = 404;
HWPCAPIConstants.STATUS_CONFLICT = 409;
HWPCAPIConstants.STATUS_UNPROCESSABLE_ENTITY = 422;
HWPCAPIConstants.STATUS_INTERNAL_SERVER_ERROR = 500;
// ===== API ERROR CODES =====
HWPCAPIConstants.ERROR_INVALID_CREDENTIALS = "INVALID_CREDENTIALS";
HWPCAPIConstants.ERROR_TOKEN_EXPIRED = "TOKEN_EXPIRED";
HWPCAPIConstants.ERROR_INVALID_TOKEN = "INVALID_TOKEN";
HWPCAPIConstants.ERROR_USER_NOT_FOUND = "USER_NOT_FOUND";
HWPCAPIConstants.ERROR_TICKET_NOT_FOUND = "TICKET_NOT_FOUND";
HWPCAPIConstants.ERROR_INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS";
HWPCAPIConstants.ERROR_VALIDATION_FAILED = "VALIDATION_FAILED";
HWPCAPIConstants.ERROR_DUPLICATE_ENTRY = "DUPLICATE_ENTRY";
HWPCAPIConstants.ERROR_RESOURCE_LOCKED = "RESOURCE_LOCKED";
HWPCAPIConstants.ERROR_RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED";
// ===== API ERROR MESSAGES =====
HWPCAPIConstants.MSG_INVALID_CREDENTIALS = "Invalid username or password";
HWPCAPIConstants.MSG_TOKEN_EXPIRED = "Authentication token has expired";
HWPCAPIConstants.MSG_INVALID_TOKEN = "Invalid or malformed token";
HWPCAPIConstants.MSG_USER_NOT_FOUND = "User not found";
HWPCAPIConstants.MSG_TICKET_NOT_FOUND = "Ticket not found";
HWPCAPIConstants.MSG_INSUFFICIENT_PERMISSIONS = "Insufficient permissions to perform this action";
HWPCAPIConstants.MSG_VALIDATION_FAILED = "Request validation failed";
HWPCAPIConstants.MSG_DUPLICATE_ENTRY = "Resource already exists";
HWPCAPIConstants.MSG_RESOURCE_LOCKED = "Resource is currently locked";
HWPCAPIConstants.MSG_RATE_LIMIT_EXCEEDED = "Rate limit exceeded";
// ===== TICKET STATUSES (Based on API Documentation) =====
HWPCAPIConstants.TICKET_STATUS_OPEN = "open";
HWPCAPIConstants.TICKET_STATUS_IN_PROGRESS = "in_progress";
HWPCAPIConstants.TICKET_STATUS_COMPLETED = "completed";
HWPCAPIConstants.TICKET_STATUS_CANCELLED = "cancelled";
// ===== TICKET PRIORITIES (Based on API Documentation) =====
HWPCAPIConstants.PRIORITY_LOW = "low";
HWPCAPIConstants.PRIORITY_MEDIUM = "medium";
HWPCAPIConstants.PRIORITY_HIGH = "high";
HWPCAPIConstants.PRIORITY_URGENT = "urgent";
// ===== USER ROLES =====
HWPCAPIConstants.ROLE_ADMIN = "admin";
HWPCAPIConstants.ROLE_AGENT = "agent";
HWPCAPIConstants.ROLE_USER = "user";
HWPCAPIConstants.ROLE_MANAGER = "manager";
HWPCAPIConstants.ROLE_SUPERVISOR = "supervisor";
// ===== SEARCH PARAMETERS =====
HWPCAPIConstants.SEARCH_QUERY = "query";
HWPCAPIConstants.SEARCH_STATUS = "status";
HWPCAPIConstants.SEARCH_PRIORITY = "priority";
HWPCAPIConstants.SEARCH_CATEGORY = "category";
HWPCAPIConstants.SEARCH_ASSIGNED_TO = "assignedTo";
HWPCAPIConstants.SEARCH_CREATED_BY = "createdBy";
HWPCAPIConstants.SEARCH_DATE_FROM = "dateFrom";
HWPCAPIConstants.SEARCH_DATE_TO = "dateTo";
HWPCAPIConstants.SEARCH_PAGE = "page";
HWPCAPIConstants.SEARCH_PAGE_SIZE = "pageSize";
HWPCAPIConstants.SEARCH_SORT_BY = "sortBy";
HWPCAPIConstants.SEARCH_SORT_ORDER = "sortOrder";
// ===== PAGINATION =====
HWPCAPIConstants.DEFAULT_PAGE_SIZE = 20;
HWPCAPIConstants.MAX_PAGE_SIZE = 100;
HWPCAPIConstants.SORT_ASC = "asc";
HWPCAPIConstants.SORT_DESC = "desc";
// ===== COMMON CONSTANTS =====
HWPCAPIConstants.BASE64 = "base64";
HWPCAPIConstants.UTF8 = "utf-8";
HWPCAPIConstants.JSON_FORMAT = ".json";
HWPCAPIConstants.XML_FORMAT = ".xml";
// ===== ENVIRONMENT VARIABLES =====
HWPCAPIConstants.ENV_API_BASE_URL = "HWPC_API_BASE_URL";
// Note: API currently requires no authentication based on documentation
// ===== TEST DATA CONSTANTS =====
HWPCAPIConstants.TEST_USER_PREFIX = "test_user_";
HWPCAPIConstants.TEST_TICKET_PREFIX = "test_ticket_";
HWPCAPIConstants.TEST_EMAIL_DOMAIN = "@hwpc-test.com";
// ===== REQUEST TIMEOUT =====
HWPCAPIConstants.DEFAULT_TIMEOUT = 30000; // 30 seconds
HWPCAPIConstants.LONG_TIMEOUT = 60000; // 60 seconds
HWPCAPIConstants.SHORT_TIMEOUT = 10000; // 10 seconds
// ===== FILE UPLOAD =====
HWPCAPIConstants.MAX_FILE_SIZE = 10485760; // 10MB
HWPCAPIConstants.ALLOWED_FILE_TYPES = ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx", "txt"];
// ===== API RESPONSE VALIDATION =====
HWPCAPIConstants.RESPONSE_TIME_THRESHOLD = 2000; // 2 seconds
HWPCAPIConstants.MAX_RESPONSE_SIZE = 52428800; // 50MB
// ===== ADDITIONAL JSON PATH CONSTANTS FOR COMPLEX RESPONSES =====
// Nested Object Paths
HWPCAPIConstants.TICKET_CUSTOMER_ID_JSON_PATH = "$.data.customer.id";
HWPCAPIConstants.TICKET_CUSTOMER_NAME_JSON_PATH = "$.data.customer.name";
HWPCAPIConstants.TICKET_ASSIGNEE_ID_JSON_PATH = "$.data.assignee.id";
HWPCAPIConstants.TICKET_ASSIGNEE_NAME_JSON_PATH = "$.data.assignee.name";
// Array Length and Existence Checks
HWPCAPIConstants.DATA_ARRAY_LENGTH_JSON_PATH = "$.data.length";
HWPCAPIConstants.HAS_DATA_JSON_PATH = "$.data";
HWPCAPIConstants.IS_EMPTY_RESPONSE_JSON_PATH = "$.data[*]";
// Metadata Paths
HWPCAPIConstants.RESPONSE_TIMESTAMP_JSON_PATH = "$.timestamp";
HWPCAPIConstants.RESPONSE_VERSION_JSON_PATH = "$.version";
HWPCAPIConstants.RESPONSE_REQUEST_ID_JSON_PATH = "$.requestId";
// ===== API ERROR RESPONSE PATTERNS =====
HWPCAPIConstants.VALIDATION_ERROR_FIELD_JSON_PATH = "$.error.validationErrors[*].field";
HWPCAPIConstants.VALIDATION_ERROR_MESSAGE_JSON_PATH = "$.error.validationErrors[*].message";
HWPCAPIConstants.VALIDATION_ERROR_CODE_JSON_PATH = "$.error.validationErrors[*].code";
// ===== ADDITIONAL ERROR CODES =====
HWPCAPIConstants.ERROR_NETWORK_TIMEOUT = "NETWORK_TIMEOUT";
HWPCAPIConstants.ERROR_SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE";
HWPCAPIConstants.ERROR_INVALID_REQUEST_FORMAT = "INVALID_REQUEST_FORMAT";
HWPCAPIConstants.ERROR_MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD";
HWPCAPIConstants.ERROR_INVALID_FIELD_VALUE = "INVALID_FIELD_VALUE";
HWPCAPIConstants.ERROR_RESOURCE_CONFLICT = "RESOURCE_CONFLICT";
HWPCAPIConstants.ERROR_OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED";
// ===== ADDITIONAL ERROR MESSAGES =====
HWPCAPIConstants.MSG_NETWORK_TIMEOUT = "Request timed out due to network issues";
HWPCAPIConstants.MSG_SERVICE_UNAVAILABLE = "Service is temporarily unavailable";
HWPCAPIConstants.MSG_INVALID_REQUEST_FORMAT = "Request format is invalid or malformed";
HWPCAPIConstants.MSG_MISSING_REQUIRED_FIELD = "Required field is missing from request";
HWPCAPIConstants.MSG_INVALID_FIELD_VALUE = "Field value is invalid or out of range";
HWPCAPIConstants.MSG_RESOURCE_CONFLICT = "Resource conflict detected";
HWPCAPIConstants.MSG_OPERATION_NOT_ALLOWED = "Operation is not allowed in current state";
//# sourceMappingURL=HWPCAPIConstants.js.map