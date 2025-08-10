/**
 * HWPC API Constants - Following existing REST patterns
 * Contains endpoint definitions, JSON paths, and API-specific constants
 */
export default class HWPCAPIConstants {
    
    // ===== API ENDPOINTS =====
    
    // Authentication & User Management (Currently no auth required)
    static readonly AUTH_USER_EP = "/api/v1/auth/user";
    static readonly AUTH_PREFERENCES_EP = "/api/v1/auth/user/preferences";
    
    // Ticket Management
    static readonly TICKETS_EP = "/api/v1/tickets";
    static readonly SINGLE_TICKET_EP = "/api/v1/tickets/{id}";
    static readonly TICKETS_BY_CUSTOMER_EP = "/api/v1/tickets/customer/{id}";
    static readonly TICKETS_BY_STATUS_EP = "/api/v1/tickets/status/{status}";
    static readonly TICKET_STATS_EP = "/api/v1/tickets/stats";
    
    // Customer Management
    static readonly CUSTOMERS_EP = "/api/v1/customers";
    static readonly SINGLE_CUSTOMER_EP = "/api/v1/customers/{id}";
    static readonly SEARCH_CUSTOMERS_EP = "/api/v1/customers/search";
    
    // Route Management
    static readonly ROUTES_EP = "/api/v1/routes";
    static readonly SINGLE_ROUTE_EP = "/api/v1/routes/{id}";
    
    // Reports & Analytics
    static readonly DASHBOARD_EP = "/api/v1/reports/dashboard";
    static readonly CUSTOM_REPORTS_EP = "/api/v1/reports/custom";
    static readonly CHART_DATA_EP = "/api/v1/reports/charts";
    
    // Health Monitoring
    static readonly HEALTH_EP = "/health";
    static readonly API_HEALTH_EP = "/api/v1/health";
    
    // ===== JSON PATH CONSTANTS =====
    
    // Authentication Response Paths
    static readonly AUTH_TOKEN_JSON_PATH = "$.token";
    static readonly REFRESH_TOKEN_JSON_PATH = "$.refreshToken";
    static readonly SESSION_TOKEN_JSON_PATH = "$.sessionId";
    static readonly EXPIRES_AT_JSON_PATH = "$.expiresAt";
    
    // User Response Paths (API returns data in $.data field)
    static readonly USER_NAME_JSON_PATH = "$.data.username";
    static readonly USER_EMAIL_JSON_PATH = "$.data.email";
    static readonly USER_FIRST_NAME_JSON_PATH = "$.data.firstName";
    static readonly USER_LAST_NAME_JSON_PATH = "$.data.lastName";
    static readonly USER_ROLE_JSON_PATH = "$.data.role";
    static readonly USER_DEPARTMENT_JSON_PATH = "$.data.department";
    static readonly USER_CREATED_AT_JSON_PATH = "$.data.createdAt";
    static readonly USER_LAST_LOGIN_JSON_PATH = "$.data.lastLogin";
    static readonly USER_ID_JSON_PATH = "$.data.id";
    
    // Ticket Response Paths (API returns data in $.data field)
    static readonly TICKET_ID_JSON_PATH = "$.data.id";
    static readonly TICKET_TITLE_JSON_PATH = "$.data.title";
    static readonly TICKET_DESCRIPTION_JSON_PATH = "$.data.description";
    static readonly TICKET_STATUS_JSON_PATH = "$.data.status";
    static readonly TICKET_PRIORITY_JSON_PATH = "$.data.priority";
    static readonly TICKET_CATEGORY_JSON_PATH = "$.data.category";
    static readonly TICKET_ASSIGNED_TO_JSON_PATH = "$.data.assignedTo";
    static readonly TICKET_CREATED_BY_JSON_PATH = "$.data.createdBy";
    static readonly TICKET_CREATED_AT_JSON_PATH = "$.data.createdAt";
    static readonly TICKET_UPDATED_AT_JSON_PATH = "$.data.updatedAt";
    static readonly TICKET_DUE_DATE_JSON_PATH = "$.data.dueDate";
    static readonly TICKET_RESOLVED_AT_JSON_PATH = "$.data.resolvedAt";
    
    // Array/List Response Paths (for multiple items in $.data array)
    static readonly FIRST_TICKET_ID_JSON_PATH = "$.data[0].id";
    static readonly FIRST_TICKET_TITLE_JSON_PATH = "$.data[0].title";
    static readonly FIRST_TICKET_STATUS_JSON_PATH = "$.data[0].status";
    static readonly FIRST_TICKET_PRIORITY_JSON_PATH = "$.data[0].priority";
    static readonly FIRST_TICKET_CREATED_AT_JSON_PATH = "$.data[0].createdAt";
    
    static readonly FIRST_USER_ID_JSON_PATH = "$.data[0].id";
    static readonly FIRST_USER_NAME_JSON_PATH = "$.data[0].username";
    static readonly FIRST_USER_EMAIL_JSON_PATH = "$.data[0].email";
    
    // Search Results Paths
    static readonly SEARCH_RESULTS_JSON_PATH = "$.data.results";
    static readonly SEARCH_TOTAL_COUNT_JSON_PATH = "$.data.totalCount";
    static readonly SEARCH_PAGE_JSON_PATH = "$.data.page";
    static readonly SEARCH_PAGE_SIZE_JSON_PATH = "$.data.pageSize";
    static readonly SEARCH_HAS_MORE_JSON_PATH = "$.data.hasMore";
    
    // Error Response Paths
    static readonly ERROR_CODE_JSON_PATH = "$.error.code";
    static readonly ERROR_MESSAGE_JSON_PATH = "$.error.message";
    static readonly ERROR_DETAILS_JSON_PATH = "$.error.details";
    static readonly VALIDATION_ERRORS_JSON_PATH = "$.error.validationErrors";
    
    // ===== HTTP HEADERS =====
    static readonly CONTENT_TYPE = "content-type";
    static readonly APPLICATION_JSON = "application/json";
    static readonly APPLICATION_XML = "application/xml";
    static readonly MULTIPART_FORM_DATA = "multipart/form-data";
    static readonly ACCEPT = "accept";
    static readonly AUTHORIZATION = "authorization";
    static readonly BEARER = "Bearer";
    static readonly BASIC = "Basic";
    static readonly SESSION_HEADER = "X-Session-ID";
    static readonly API_KEY_HEADER = "X-API-Key";
    static readonly REQUEST_ID_HEADER = "X-Request-ID";
    
    // ===== API RESPONSE DESCRIPTIONS =====
    static readonly USER_PROFILE = "User Profile";
    static readonly USER_PREFERENCES = "User Preferences";

    static readonly ALL_TICKETS = "All Tickets";
    static readonly SINGLE_TICKET = "Single Ticket";
    static readonly CREATE_TICKET = "Create Ticket";
    static readonly UPDATE_TICKET = "Update Ticket";
    static readonly DELETE_TICKET = "Delete Ticket";
    static readonly CUSTOMER_TICKETS = "Customer Tickets";
    static readonly STATUS_TICKETS = "Status Tickets";
    static readonly TICKET_STATISTICS = "Ticket Statistics";

    static readonly ALL_CUSTOMERS = "All Customers";
    static readonly SINGLE_CUSTOMER = "Single Customer";
    static readonly CREATE_CUSTOMER = "Create Customer";
    static readonly UPDATE_CUSTOMER = "Update Customer";
    static readonly DELETE_CUSTOMER = "Delete Customer";
    static readonly CUSTOMER_SEARCH = "Customer Search";
    static readonly TICKET_SEARCH = "Ticket Search";

    static readonly ALL_ROUTES = "All Routes";
    static readonly SINGLE_ROUTE = "Single Route";

    static readonly DASHBOARD = "Dashboard";
    static readonly API_HEALTH = "API Health";
    
    // ===== HTTP STATUS CODES =====
    static readonly STATUS_OK = 200;
    static readonly STATUS_CREATED = 201;
    static readonly STATUS_NO_CONTENT = 204;
    static readonly STATUS_BAD_REQUEST = 400;
    static readonly STATUS_UNAUTHORIZED = 401;
    static readonly STATUS_FORBIDDEN = 403;
    static readonly STATUS_NOT_FOUND = 404;
    static readonly STATUS_CONFLICT = 409;
    static readonly STATUS_UNPROCESSABLE_ENTITY = 422;
    static readonly STATUS_INTERNAL_SERVER_ERROR = 500;
    
    // ===== API ERROR CODES =====
    static readonly ERROR_INVALID_CREDENTIALS = "INVALID_CREDENTIALS";
    static readonly ERROR_TOKEN_EXPIRED = "TOKEN_EXPIRED";
    static readonly ERROR_INVALID_TOKEN = "INVALID_TOKEN";
    static readonly ERROR_USER_NOT_FOUND = "USER_NOT_FOUND";
    static readonly ERROR_TICKET_NOT_FOUND = "TICKET_NOT_FOUND";
    static readonly ERROR_INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS";
    static readonly ERROR_VALIDATION_FAILED = "VALIDATION_FAILED";
    static readonly ERROR_DUPLICATE_ENTRY = "DUPLICATE_ENTRY";
    static readonly ERROR_RESOURCE_LOCKED = "RESOURCE_LOCKED";
    static readonly ERROR_RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED";
    
    // ===== API ERROR MESSAGES =====
    static readonly MSG_INVALID_CREDENTIALS = "Invalid username or password";
    static readonly MSG_TOKEN_EXPIRED = "Authentication token has expired";
    static readonly MSG_INVALID_TOKEN = "Invalid or malformed token";
    static readonly MSG_USER_NOT_FOUND = "User not found";
    static readonly MSG_TICKET_NOT_FOUND = "Ticket not found";
    static readonly MSG_INSUFFICIENT_PERMISSIONS = "Insufficient permissions to perform this action";
    static readonly MSG_VALIDATION_FAILED = "Request validation failed";
    static readonly MSG_DUPLICATE_ENTRY = "Resource already exists";
    static readonly MSG_RESOURCE_LOCKED = "Resource is currently locked";
    static readonly MSG_RATE_LIMIT_EXCEEDED = "Rate limit exceeded";
    
    // ===== TICKET STATUSES (Based on API Documentation) =====
    static readonly TICKET_STATUS_OPEN = "open";
    static readonly TICKET_STATUS_IN_PROGRESS = "in_progress";
    static readonly TICKET_STATUS_COMPLETED = "completed";
    static readonly TICKET_STATUS_CANCELLED = "cancelled";
    
    // ===== TICKET PRIORITIES (Based on API Documentation) =====
    static readonly PRIORITY_LOW = "low";
    static readonly PRIORITY_MEDIUM = "medium";
    static readonly PRIORITY_HIGH = "high";
    static readonly PRIORITY_URGENT = "urgent";
    
    // ===== USER ROLES =====
    static readonly ROLE_ADMIN = "admin";
    static readonly ROLE_AGENT = "agent";
    static readonly ROLE_USER = "user";
    static readonly ROLE_MANAGER = "manager";
    static readonly ROLE_SUPERVISOR = "supervisor";
    
    // ===== SEARCH PARAMETERS =====
    static readonly SEARCH_QUERY = "query";
    static readonly SEARCH_STATUS = "status";
    static readonly SEARCH_PRIORITY = "priority";
    static readonly SEARCH_CATEGORY = "category";
    static readonly SEARCH_ASSIGNED_TO = "assignedTo";
    static readonly SEARCH_CREATED_BY = "createdBy";
    static readonly SEARCH_DATE_FROM = "dateFrom";
    static readonly SEARCH_DATE_TO = "dateTo";
    static readonly SEARCH_PAGE = "page";
    static readonly SEARCH_PAGE_SIZE = "pageSize";
    static readonly SEARCH_SORT_BY = "sortBy";
    static readonly SEARCH_SORT_ORDER = "sortOrder";
    
    // ===== PAGINATION =====
    static readonly DEFAULT_PAGE_SIZE = 20;
    static readonly MAX_PAGE_SIZE = 100;
    static readonly SORT_ASC = "asc";
    static readonly SORT_DESC = "desc";
    
    // ===== COMMON CONSTANTS =====
    static readonly BASE64 = "base64";
    static readonly UTF8 = "utf-8";
    static readonly JSON_FORMAT = ".json";
    static readonly XML_FORMAT = ".xml";
    
    // ===== ENVIRONMENT VARIABLES =====
    static readonly ENV_API_BASE_URL = "HWPC_API_BASE_URL";
    // Note: API currently requires no authentication based on documentation
    
    // ===== TEST DATA CONSTANTS =====
    static readonly TEST_USER_PREFIX = "test_user_";
    static readonly TEST_TICKET_PREFIX = "test_ticket_";
    static readonly TEST_EMAIL_DOMAIN = "@hwpc-test.com";
    
    // ===== REQUEST TIMEOUT =====
    static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
    static readonly LONG_TIMEOUT = 60000; // 60 seconds
    static readonly SHORT_TIMEOUT = 10000; // 10 seconds
    
    // ===== FILE UPLOAD =====
    static readonly MAX_FILE_SIZE = 10485760; // 10MB
    static readonly ALLOWED_FILE_TYPES = ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx", "txt"];
    
    // ===== API RESPONSE VALIDATION =====
    static readonly RESPONSE_TIME_THRESHOLD = 2000; // 2 seconds
    static readonly MAX_RESPONSE_SIZE = 52428800; // 50MB
    
    // ===== ADDITIONAL JSON PATH CONSTANTS FOR COMPLEX RESPONSES =====
    
    // Nested Object Paths
    static readonly TICKET_CUSTOMER_ID_JSON_PATH = "$.data.customer.id";
    static readonly TICKET_CUSTOMER_NAME_JSON_PATH = "$.data.customer.name";
    static readonly TICKET_ASSIGNEE_ID_JSON_PATH = "$.data.assignee.id";
    static readonly TICKET_ASSIGNEE_NAME_JSON_PATH = "$.data.assignee.name";
    
    // Array Length and Existence Checks
    static readonly DATA_ARRAY_LENGTH_JSON_PATH = "$.data.length";
    static readonly HAS_DATA_JSON_PATH = "$.data";
    static readonly IS_EMPTY_RESPONSE_JSON_PATH = "$.data[*]";
    
    // Metadata Paths
    static readonly RESPONSE_TIMESTAMP_JSON_PATH = "$.timestamp";
    static readonly RESPONSE_VERSION_JSON_PATH = "$.version";
    static readonly RESPONSE_REQUEST_ID_JSON_PATH = "$.requestId";
    
    // ===== API ERROR RESPONSE PATTERNS =====
    static readonly VALIDATION_ERROR_FIELD_JSON_PATH = "$.error.validationErrors[*].field";
    static readonly VALIDATION_ERROR_MESSAGE_JSON_PATH = "$.error.validationErrors[*].message";
    static readonly VALIDATION_ERROR_CODE_JSON_PATH = "$.error.validationErrors[*].code";
    
    // ===== ADDITIONAL ERROR CODES =====
    static readonly ERROR_NETWORK_TIMEOUT = "NETWORK_TIMEOUT";
    static readonly ERROR_SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE";
    static readonly ERROR_INVALID_REQUEST_FORMAT = "INVALID_REQUEST_FORMAT";
    static readonly ERROR_MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD";
    static readonly ERROR_INVALID_FIELD_VALUE = "INVALID_FIELD_VALUE";
    static readonly ERROR_RESOURCE_CONFLICT = "RESOURCE_CONFLICT";
    static readonly ERROR_OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED";
    
    // ===== ADDITIONAL ERROR MESSAGES =====
    static readonly MSG_NETWORK_TIMEOUT = "Request timed out due to network issues";
    static readonly MSG_SERVICE_UNAVAILABLE = "Service is temporarily unavailable";
    static readonly MSG_INVALID_REQUEST_FORMAT = "Request format is invalid or malformed";
    static readonly MSG_MISSING_REQUIRED_FIELD = "Required field is missing from request";
    static readonly MSG_INVALID_FIELD_VALUE = "Field value is invalid or out of range";
    static readonly MSG_RESOURCE_CONFLICT = "Resource conflict detected";
    static readonly MSG_OPERATION_NOT_ALLOWED = "Operation is not allowed in current state";
}