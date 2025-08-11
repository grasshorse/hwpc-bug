"use strict";
/**
 * HWPC API Endpoints - Comprehensive endpoint definitions for all HWPC API operations
 * This file extends beyond the basic API tests to provide complete endpoint coverage
 * for tickets, customers, routes, authentication, and business intelligence
 */
Object.defineProperty(exports, "__esModule", { value: true });
class APIEndpoints {
    // ===== UTILITY METHODS =====
    /**
     * Replace path parameters in endpoint URL
     * @param endpoint - Endpoint configuration
     * @param params - Parameters to replace in path
     * @returns Updated endpoint path
     */
    static replacePath(endpoint, params) {
        let path = endpoint.path;
        Object.entries(params).forEach(([key, value]) => {
            path = path.replace(`{${key}}`, value);
        });
        return path;
    }
    /**
     * Get full endpoint URL with base URL
     * @param endpoint - Endpoint configuration
     * @param baseUrl - Base API URL
     * @param params - Path parameters to replace
     * @returns Complete endpoint URL
     */
    static getFullUrl(endpoint, baseUrl, params) {
        const path = params ? this.replacePath(endpoint, params) : endpoint.path;
        return `${baseUrl.replace(/\/$/, '')}${path}`;
    }
    /**
     * Get all endpoints for a specific category
     * @param category - Category name (e.g., 'TICKETS', 'CUSTOMERS')
     * @returns Array of endpoint configurations
     */
    static getEndpointsByCategory(category) {
        const categoryEndpoints = APIEndpoints[category];
        if (typeof categoryEndpoints === 'object' && categoryEndpoints !== null) {
            return Object.values(categoryEndpoints);
        }
        return [];
    }
    /**
     * Get endpoints that require authentication
     * @returns Array of authenticated endpoint configurations
     */
    static getAuthenticatedEndpoints() {
        const allEndpoints = [];
        Object.keys(APIEndpoints).forEach(category => {
            if (category !== 'API_VERSION' && category !== 'API_BASE_PATH') {
                allEndpoints.push(...this.getEndpointsByCategory(category));
            }
        });
        return allEndpoints.filter(endpoint => endpoint.requiresAuth === true);
    }
    /**
     * Get endpoints by HTTP method
     * @param method - HTTP method
     * @returns Array of endpoint configurations
     */
    static getEndpointsByMethod(method) {
        const allEndpoints = [];
        Object.keys(APIEndpoints).forEach(category => {
            if (category !== 'API_VERSION' && category !== 'API_BASE_PATH') {
                allEndpoints.push(...this.getEndpointsByCategory(category));
            }
        });
        return allEndpoints.filter(endpoint => endpoint.method === method);
    }
}
exports.default = APIEndpoints;
// ===== BASE CONFIGURATION =====
APIEndpoints.API_VERSION = "v1";
APIEndpoints.API_BASE_PATH = `/api/${APIEndpoints.API_VERSION}`;
// ===== AUTHENTICATION & SESSION MANAGEMENT =====
APIEndpoints.AUTH = {
    LOGIN: {
        path: `${APIEndpoints.API_BASE_PATH}/auth/login`,
        method: 'POST',
        description: 'User authentication login',
        requiresAuth: false,
        timeout: 10000
    },
    LOGOUT: {
        path: `${APIEndpoints.API_BASE_PATH}/auth/logout`,
        method: 'POST',
        description: 'User logout and session cleanup',
        requiresAuth: true
    },
    REFRESH_TOKEN: {
        path: `${APIEndpoints.API_BASE_PATH}/auth/refresh`,
        method: 'POST',
        description: 'Refresh authentication token',
        requiresAuth: true
    },
    VERIFY_TOKEN: {
        path: `${APIEndpoints.API_BASE_PATH}/auth/verify`,
        method: 'GET',
        description: 'Verify token validity',
        requiresAuth: true
    },
    RESET_PASSWORD: {
        path: `${APIEndpoints.API_BASE_PATH}/auth/reset-password`,
        method: 'POST',
        description: 'Request password reset',
        requiresAuth: false
    },
    CHANGE_PASSWORD: {
        path: `${APIEndpoints.API_BASE_PATH}/auth/change-password`,
        method: 'PUT',
        description: 'Change user password',
        requiresAuth: true
    }
};
// ===== USER MANAGEMENT =====
APIEndpoints.USERS = {
    GET_PROFILE: {
        path: `${APIEndpoints.API_BASE_PATH}/users/profile`,
        method: 'GET',
        description: 'Get current user profile',
        requiresAuth: true
    },
    UPDATE_PROFILE: {
        path: `${APIEndpoints.API_BASE_PATH}/users/profile`,
        method: 'PUT',
        description: 'Update user profile',
        requiresAuth: true
    },
    GET_PREFERENCES: {
        path: `${APIEndpoints.API_BASE_PATH}/users/preferences`,
        method: 'GET',
        description: 'Get user preferences',
        requiresAuth: true
    },
    UPDATE_PREFERENCES: {
        path: `${APIEndpoints.API_BASE_PATH}/users/preferences`,
        method: 'PUT',
        description: 'Update user preferences',
        requiresAuth: true
    },
    GET_ALL_USERS: {
        path: `${APIEndpoints.API_BASE_PATH}/users`,
        method: 'GET',
        description: 'Get all users (admin only)',
        requiresAuth: true
    },
    GET_USER_BY_ID: {
        path: `${APIEndpoints.API_BASE_PATH}/users/{id}`,
        method: 'GET',
        description: 'Get user by ID',
        requiresAuth: true
    },
    CREATE_USER: {
        path: `${APIEndpoints.API_BASE_PATH}/users`,
        method: 'POST',
        description: 'Create new user (admin only)',
        requiresAuth: true
    },
    UPDATE_USER: {
        path: `${APIEndpoints.API_BASE_PATH}/users/{id}`,
        method: 'PUT',
        description: 'Update user (admin only)',
        requiresAuth: true
    },
    DELETE_USER: {
        path: `${APIEndpoints.API_BASE_PATH}/users/{id}`,
        method: 'DELETE',
        description: 'Delete user (admin only)',
        requiresAuth: true
    }
};
// ===== TICKET MANAGEMENT =====
APIEndpoints.TICKETS = {
    GET_ALL: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets`,
        method: 'GET',
        description: 'Get all tickets with pagination and filtering',
        requiresAuth: true,
        rateLimit: 100
    },
    GET_BY_ID: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets/{id}`,
        method: 'GET',
        description: 'Get ticket by ID',
        requiresAuth: true
    },
    CREATE: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets`,
        method: 'POST',
        description: 'Create new ticket',
        requiresAuth: true
    },
    UPDATE: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets/{id}`,
        method: 'PUT',
        description: 'Update ticket',
        requiresAuth: true
    },
    PATCH: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets/{id}`,
        method: 'PATCH',
        description: 'Partial ticket update',
        requiresAuth: true
    },
    DELETE: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets/{id}`,
        method: 'DELETE',
        description: 'Delete ticket',
        requiresAuth: true
    },
    SEARCH: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets/search`,
        method: 'GET',
        description: 'Search tickets with advanced criteria',
        requiresAuth: true,
        rateLimit: 50
    },
    GET_BY_CUSTOMER: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets/customer/{customerId}`,
        method: 'GET',
        description: 'Get tickets by customer ID',
        requiresAuth: true
    },
    GET_BY_STATUS: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets/status/{status}`,
        method: 'GET',
        description: 'Get tickets by status',
        requiresAuth: true
    },
    GET_BY_PRIORITY: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets/priority/{priority}`,
        method: 'GET',
        description: 'Get tickets by priority',
        requiresAuth: true
    },
    GET_BY_ASSIGNEE: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets/assignee/{userId}`,
        method: 'GET',
        description: 'Get tickets by assigned user',
        requiresAuth: true
    },
    UPDATE_STATUS: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets/{id}/status`,
        method: 'PATCH',
        description: 'Update ticket status',
        requiresAuth: true
    },
    ASSIGN_TECHNICIAN: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets/{id}/assign`,
        method: 'PATCH',
        description: 'Assign ticket to technician',
        requiresAuth: true
    },
    ADD_COMMENT: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets/{id}/comments`,
        method: 'POST',
        description: 'Add comment to ticket',
        requiresAuth: true
    },
    GET_COMMENTS: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets/{id}/comments`,
        method: 'GET',
        description: 'Get ticket comments',
        requiresAuth: true
    },
    ADD_ATTACHMENT: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets/{id}/attachments`,
        method: 'POST',
        description: 'Add attachment to ticket',
        requiresAuth: true,
        timeout: 30000
    },
    GET_ATTACHMENTS: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets/{id}/attachments`,
        method: 'GET',
        description: 'Get ticket attachments',
        requiresAuth: true
    },
    GET_HISTORY: {
        path: `${APIEndpoints.API_BASE_PATH}/tickets/{id}/history`,
        method: 'GET',
        description: 'Get ticket change history',
        requiresAuth: true
    }
};
// ===== CUSTOMER MANAGEMENT =====
APIEndpoints.CUSTOMERS = {
    GET_ALL: {
        path: `${APIEndpoints.API_BASE_PATH}/customers`,
        method: 'GET',
        description: 'Get all customers with pagination',
        requiresAuth: true,
        rateLimit: 100
    },
    GET_BY_ID: {
        path: `${APIEndpoints.API_BASE_PATH}/customers/{id}`,
        method: 'GET',
        description: 'Get customer by ID',
        requiresAuth: true
    },
    CREATE: {
        path: `${APIEndpoints.API_BASE_PATH}/customers`,
        method: 'POST',
        description: 'Create new customer',
        requiresAuth: true
    },
    UPDATE: {
        path: `${APIEndpoints.API_BASE_PATH}/customers/{id}`,
        method: 'PUT',
        description: 'Update customer',
        requiresAuth: true
    },
    PATCH: {
        path: `${APIEndpoints.API_BASE_PATH}/customers/{id}`,
        method: 'PATCH',
        description: 'Partial customer update',
        requiresAuth: true
    },
    DELETE: {
        path: `${APIEndpoints.API_BASE_PATH}/customers/{id}`,
        method: 'DELETE',
        description: 'Delete customer',
        requiresAuth: true
    },
    SEARCH: {
        path: `${APIEndpoints.API_BASE_PATH}/customers/search`,
        method: 'GET',
        description: 'Search customers by various criteria',
        requiresAuth: true,
        rateLimit: 50
    },
    GET_SERVICE_HISTORY: {
        path: `${APIEndpoints.API_BASE_PATH}/customers/{id}/service-history`,
        method: 'GET',
        description: 'Get customer service history',
        requiresAuth: true
    },
    GET_TICKETS: {
        path: `${APIEndpoints.API_BASE_PATH}/customers/{id}/tickets`,
        method: 'GET',
        description: 'Get all tickets for customer',
        requiresAuth: true
    },
    ADD_NOTE: {
        path: `${APIEndpoints.API_BASE_PATH}/customers/{id}/notes`,
        method: 'POST',
        description: 'Add note to customer',
        requiresAuth: true
    },
    GET_NOTES: {
        path: `${APIEndpoints.API_BASE_PATH}/customers/{id}/notes`,
        method: 'GET',
        description: 'Get customer notes',
        requiresAuth: true
    },
    VALIDATE_ADDRESS: {
        path: `${APIEndpoints.API_BASE_PATH}/customers/validate-address`,
        method: 'POST',
        description: 'Validate customer address',
        requiresAuth: true
    }
};
// ===== ROUTE MANAGEMENT =====
APIEndpoints.ROUTES = {
    GET_ALL: {
        path: `${APIEndpoints.API_BASE_PATH}/routes`,
        method: 'GET',
        description: 'Get all routes',
        requiresAuth: true
    },
    GET_BY_ID: {
        path: `${APIEndpoints.API_BASE_PATH}/routes/{id}`,
        method: 'GET',
        description: 'Get route by ID',
        requiresAuth: true
    },
    CREATE: {
        path: `${APIEndpoints.API_BASE_PATH}/routes`,
        method: 'POST',
        description: 'Create new route',
        requiresAuth: true
    },
    UPDATE: {
        path: `${APIEndpoints.API_BASE_PATH}/routes/{id}`,
        method: 'PUT',
        description: 'Update route',
        requiresAuth: true
    },
    DELETE: {
        path: `${APIEndpoints.API_BASE_PATH}/routes/{id}`,
        method: 'DELETE',
        description: 'Delete route',
        requiresAuth: true
    },
    GET_BY_TECHNICIAN: {
        path: `${APIEndpoints.API_BASE_PATH}/routes/technician/{technicianId}`,
        method: 'GET',
        description: 'Get routes by technician',
        requiresAuth: true
    },
    GET_BY_DATE: {
        path: `${APIEndpoints.API_BASE_PATH}/routes/date/{date}`,
        method: 'GET',
        description: 'Get routes by date',
        requiresAuth: true
    },
    ASSIGN_TICKET: {
        path: `${APIEndpoints.API_BASE_PATH}/routes/{id}/tickets/{ticketId}`,
        method: 'POST',
        description: 'Assign ticket to route',
        requiresAuth: true
    },
    REMOVE_TICKET: {
        path: `${APIEndpoints.API_BASE_PATH}/routes/{id}/tickets/{ticketId}`,
        method: 'DELETE',
        description: 'Remove ticket from route',
        requiresAuth: true
    },
    REORDER_TICKETS: {
        path: `${APIEndpoints.API_BASE_PATH}/routes/{id}/reorder`,
        method: 'PATCH',
        description: 'Reorder tickets in route',
        requiresAuth: true
    },
    OPTIMIZE: {
        path: `${APIEndpoints.API_BASE_PATH}/routes/{id}/optimize`,
        method: 'POST',
        description: 'Optimize route for efficiency',
        requiresAuth: true,
        timeout: 15000
    },
    GET_DIRECTIONS: {
        path: `${APIEndpoints.API_BASE_PATH}/routes/{id}/directions`,
        method: 'GET',
        description: 'Get route directions',
        requiresAuth: true
    },
    GET_PRINT_DATA: {
        path: `${APIEndpoints.API_BASE_PATH}/routes/{id}/print`,
        method: 'GET',
        description: 'Get route data for printing',
        requiresAuth: true
    },
    DUPLICATE: {
        path: `${APIEndpoints.API_BASE_PATH}/routes/{id}/duplicate`,
        method: 'POST',
        description: 'Duplicate existing route',
        requiresAuth: true
    },
    UPDATE_STATUS: {
        path: `${APIEndpoints.API_BASE_PATH}/routes/{id}/status`,
        method: 'PATCH',
        description: 'Update route status',
        requiresAuth: true
    }
};
// ===== REPORTING & ANALYTICS =====
APIEndpoints.REPORTS = {
    DASHBOARD: {
        path: `${APIEndpoints.API_BASE_PATH}/reports/dashboard`,
        method: 'GET',
        description: 'Get dashboard summary data',
        requiresAuth: true
    },
    TICKET_STATISTICS: {
        path: `${APIEndpoints.API_BASE_PATH}/reports/tickets/statistics`,
        method: 'GET',
        description: 'Get ticket statistics',
        requiresAuth: true
    },
    PERFORMANCE_METRICS: {
        path: `${APIEndpoints.API_BASE_PATH}/reports/performance`,
        method: 'GET',
        description: 'Get performance metrics',
        requiresAuth: true
    },
    TECHNICIAN_PERFORMANCE: {
        path: `${APIEndpoints.API_BASE_PATH}/reports/technicians/performance`,
        method: 'GET',
        description: 'Get technician performance data',
        requiresAuth: true
    },
    CUSTOMER_SATISFACTION: {
        path: `${APIEndpoints.API_BASE_PATH}/reports/customer-satisfaction`,
        method: 'GET',
        description: 'Get customer satisfaction metrics',
        requiresAuth: true
    },
    REVENUE_ANALYSIS: {
        path: `${APIEndpoints.API_BASE_PATH}/reports/revenue`,
        method: 'GET',
        description: 'Get revenue analysis data',
        requiresAuth: true
    },
    CUSTOM_REPORT: {
        path: `${APIEndpoints.API_BASE_PATH}/reports/custom`,
        method: 'POST',
        description: 'Generate custom report',
        requiresAuth: true,
        timeout: 30000
    },
    EXPORT_REPORT: {
        path: `${APIEndpoints.API_BASE_PATH}/reports/{reportId}/export`,
        method: 'GET',
        description: 'Export report data',
        requiresAuth: true,
        timeout: 20000
    }
};
// ===== SYSTEM & CONFIGURATION =====
APIEndpoints.SYSTEM = {
    HEALTH_CHECK: {
        path: `${APIEndpoints.API_BASE_PATH}/health`,
        method: 'GET',
        description: 'System health check',
        requiresAuth: false
    },
    VERSION: {
        path: `${APIEndpoints.API_BASE_PATH}/version`,
        method: 'GET',
        description: 'Get API version information',
        requiresAuth: false
    },
    CONFIG: {
        path: `${APIEndpoints.API_BASE_PATH}/config`,
        method: 'GET',
        description: 'Get system configuration',
        requiresAuth: true
    },
    UPDATE_CONFIG: {
        path: `${APIEndpoints.API_BASE_PATH}/config`,
        method: 'PUT',
        description: 'Update system configuration (admin only)',
        requiresAuth: true
    },
    GET_SETTINGS: {
        path: `${APIEndpoints.API_BASE_PATH}/settings`,
        method: 'GET',
        description: 'Get application settings',
        requiresAuth: true
    },
    UPDATE_SETTINGS: {
        path: `${APIEndpoints.API_BASE_PATH}/settings`,
        method: 'PUT',
        description: 'Update application settings',
        requiresAuth: true
    }
};
// ===== NOTIFICATIONS =====
APIEndpoints.NOTIFICATIONS = {
    GET_ALL: {
        path: `${APIEndpoints.API_BASE_PATH}/notifications`,
        method: 'GET',
        description: 'Get user notifications',
        requiresAuth: true
    },
    MARK_READ: {
        path: `${APIEndpoints.API_BASE_PATH}/notifications/{id}/read`,
        method: 'PATCH',
        description: 'Mark notification as read',
        requiresAuth: true
    },
    MARK_ALL_READ: {
        path: `${APIEndpoints.API_BASE_PATH}/notifications/read-all`,
        method: 'PATCH',
        description: 'Mark all notifications as read',
        requiresAuth: true
    },
    DELETE: {
        path: `${APIEndpoints.API_BASE_PATH}/notifications/{id}`,
        method: 'DELETE',
        description: 'Delete notification',
        requiresAuth: true
    },
    GET_PREFERENCES: {
        path: `${APIEndpoints.API_BASE_PATH}/notifications/preferences`,
        method: 'GET',
        description: 'Get notification preferences',
        requiresAuth: true
    },
    UPDATE_PREFERENCES: {
        path: `${APIEndpoints.API_BASE_PATH}/notifications/preferences`,
        method: 'PUT',
        description: 'Update notification preferences',
        requiresAuth: true
    }
};
// ===== FILE MANAGEMENT =====
APIEndpoints.FILES = {
    UPLOAD: {
        path: `${APIEndpoints.API_BASE_PATH}/files/upload`,
        method: 'POST',
        description: 'Upload file',
        requiresAuth: true,
        timeout: 60000
    },
    DOWNLOAD: {
        path: `${APIEndpoints.API_BASE_PATH}/files/{id}/download`,
        method: 'GET',
        description: 'Download file',
        requiresAuth: true,
        timeout: 30000
    },
    DELETE: {
        path: `${APIEndpoints.API_BASE_PATH}/files/{id}`,
        method: 'DELETE',
        description: 'Delete file',
        requiresAuth: true
    },
    GET_METADATA: {
        path: `${APIEndpoints.API_BASE_PATH}/files/{id}/metadata`,
        method: 'GET',
        description: 'Get file metadata',
        requiresAuth: true
    }
};
// ===== MOBILE-SPECIFIC ENDPOINTS =====
APIEndpoints.MOBILE = {
    SYNC_DATA: {
        path: `${APIEndpoints.API_BASE_PATH}/mobile/sync`,
        method: 'POST',
        description: 'Sync mobile app data with server',
        requiresAuth: true,
        timeout: 30000
    },
    OFFLINE_QUEUE: {
        path: `${APIEndpoints.API_BASE_PATH}/mobile/offline-queue`,
        method: 'POST',
        description: 'Submit offline actions queue',
        requiresAuth: true,
        timeout: 20000
    },
    GPS_LOCATION: {
        path: `${APIEndpoints.API_BASE_PATH}/mobile/location`,
        method: 'POST',
        description: 'Update technician GPS location',
        requiresAuth: true
    },
    CAMERA_UPLOAD: {
        path: `${APIEndpoints.API_BASE_PATH}/mobile/camera/upload`,
        method: 'POST',
        description: 'Upload photo from mobile camera',
        requiresAuth: true,
        timeout: 60000
    },
    SIGNATURE_CAPTURE: {
        path: `${APIEndpoints.API_BASE_PATH}/mobile/signature`,
        method: 'POST',
        description: 'Submit customer signature',
        requiresAuth: true,
        timeout: 30000
    },
    DEVICE_INFO: {
        path: `${APIEndpoints.API_BASE_PATH}/mobile/device-info`,
        method: 'POST',
        description: 'Register mobile device information',
        requiresAuth: true
    }
};
// ===== INTEGRATION ENDPOINTS =====
APIEndpoints.INTEGRATIONS = {
    MAPPING_SERVICE: {
        path: `${APIEndpoints.API_BASE_PATH}/integrations/maps/directions`,
        method: 'GET',
        description: 'Get directions from mapping service',
        requiresAuth: true,
        timeout: 15000
    },
    WEATHER_SERVICE: {
        path: `${APIEndpoints.API_BASE_PATH}/integrations/weather`,
        method: 'GET',
        description: 'Get weather information for route planning',
        requiresAuth: true
    },
    PAYMENT_GATEWAY: {
        path: `${APIEndpoints.API_BASE_PATH}/integrations/payments/process`,
        method: 'POST',
        description: 'Process payment through gateway',
        requiresAuth: true,
        timeout: 30000
    },
    SMS_SERVICE: {
        path: `${APIEndpoints.API_BASE_PATH}/integrations/sms/send`,
        method: 'POST',
        description: 'Send SMS notification',
        requiresAuth: true
    },
    EMAIL_SERVICE: {
        path: `${APIEndpoints.API_BASE_PATH}/integrations/email/send`,
        method: 'POST',
        description: 'Send email notification',
        requiresAuth: true
    }
};
// ===== AUDIT AND LOGGING ENDPOINTS =====
APIEndpoints.AUDIT = {
    GET_LOGS: {
        path: `${APIEndpoints.API_BASE_PATH}/audit/logs`,
        method: 'GET',
        description: 'Get audit logs',
        requiresAuth: true
    },
    GET_USER_ACTIVITY: {
        path: `${APIEndpoints.API_BASE_PATH}/audit/user-activity/{userId}`,
        method: 'GET',
        description: 'Get user activity logs',
        requiresAuth: true
    },
    GET_SYSTEM_EVENTS: {
        path: `${APIEndpoints.API_BASE_PATH}/audit/system-events`,
        method: 'GET',
        description: 'Get system event logs',
        requiresAuth: true
    },
    EXPORT_LOGS: {
        path: `${APIEndpoints.API_BASE_PATH}/audit/export`,
        method: 'GET',
        description: 'Export audit logs',
        requiresAuth: true,
        timeout: 60000
    }
};
//# sourceMappingURL=APIEndpoints.js.map