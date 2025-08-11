"use strict";
/**
 * HWPC Constants - Comprehensive UI element selectors and configuration constants
 * Enhanced with comprehensive selectors for tickets, customers, routes, and mobile-first testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
class Constants {
}
exports.default = Constants;
// Legacy constants (keeping for backward compatibility)
Constants.PRODUCT = "Product";
Constants.SEARCH_BUTTON = "Search Button";
Constants.MESSAGE = "Message";
Constants.MY_ACCOUNT = "My Account";
Constants.LOGOUT = "Logout";
Constants.REGISTER = "Register";
Constants.FIRST_NAME = "First Name";
Constants.LAST_NAME = "Last Name";
Constants.EMAIL = "Email";
Constants.TELEPHONE = "Telephone";
Constants.PASSWORD = "Password";
Constants.CONFIRM_PASSWORD = "Confirm Password";
Constants.PRIVACY_POLICY = "Privacy Policy";
Constants.CONTINUE = "Continue";
// ===== HWPC PAGE ROUTES =====
Constants.TICKETS_PAGE = "/tickets";
Constants.HOME_PAGE = "/";
Constants.LOGIN_PAGE = "/login";
Constants.REGISTER_PAGE = "/register";
Constants.PROFILE_PAGE = "/profile";
// ===== HWPC SEARCH FUNCTIONALITY =====
Constants.SEARCH_INPUT = "Search Input";
Constants.SEARCH_FORM = "Search Form";
Constants.SEARCH_RESULTS = "Search Results";
Constants.NO_RESULTS_MESSAGE = "No Results Message";
Constants.LOADING_INDICATOR = "Loading Indicator";
Constants.SEARCH_RESULTS_COUNT = "Search Results Count";
// ===== HWPC TICKET ELEMENTS =====
Constants.TICKET = "Ticket";
Constants.TICKET_LIST = "Ticket List";
Constants.TICKET_ITEM = "Ticket Item";
Constants.TICKET_TITLE = "Ticket Title";
Constants.TICKET_ID = "Ticket ID";
Constants.TICKET_STATUS = "Ticket Status";
Constants.TICKET_PRIORITY = "Ticket Priority";
Constants.TICKET_DESCRIPTION = "Ticket Description";
Constants.TICKET_CREATED_DATE = "Ticket Created Date";
Constants.TICKET_UPDATED_DATE = "Ticket Updated Date";
Constants.TICKET_ASSIGNEE = "Ticket Assignee";
// Enhanced Ticket Management Selectors
Constants.TICKET_CREATE_BUTTON = "[data-testid='create-ticket-btn'], .create-ticket-btn, #createTicketBtn";
Constants.TICKET_EDIT_BUTTON = "[data-testid='edit-ticket-btn'], .edit-ticket-btn, .ticket-edit";
Constants.TICKET_DELETE_BUTTON = "[data-testid='delete-ticket-btn'], .delete-ticket-btn, .ticket-delete";
Constants.TICKET_STATUS_DROPDOWN = "[data-testid='ticket-status-select'], .ticket-status-select, #ticketStatus";
Constants.TICKET_PRIORITY_DROPDOWN = "[data-testid='ticket-priority-select'], .ticket-priority-select, #ticketPriority";
Constants.TICKET_ASSIGNEE_DROPDOWN = "[data-testid='ticket-assignee-select'], .ticket-assignee-select, #ticketAssignee";
Constants.TICKET_CUSTOMER_DROPDOWN = "[data-testid='ticket-customer-select'], .ticket-customer-select, #ticketCustomer";
Constants.TICKET_SERVICE_TYPE_DROPDOWN = "[data-testid='ticket-service-type-select'], .service-type-select, #serviceType";
Constants.TICKET_SCHEDULED_DATE_INPUT = "[data-testid='ticket-scheduled-date'], .scheduled-date-input, #scheduledDate";
Constants.TICKET_ESTIMATED_DURATION_INPUT = "[data-testid='ticket-duration'], .duration-input, #estimatedDuration";
Constants.TICKET_SPECIAL_INSTRUCTIONS_TEXTAREA = "[data-testid='ticket-instructions'], .special-instructions, #specialInstructions";
// Ticket List and Search Selectors
Constants.TICKET_SEARCH_INPUT = "[data-testid='ticket-search'], .ticket-search-input, #ticketSearch";
Constants.TICKET_FILTER_BUTTON = "[data-testid='ticket-filter-btn'], .filter-btn, .ticket-filter";
Constants.TICKET_SORT_DROPDOWN = "[data-testid='ticket-sort'], .sort-dropdown, #ticketSort";
Constants.TICKET_VIEW_TOGGLE = "[data-testid='view-toggle'], .view-toggle-btn, .list-grid-toggle";
Constants.TICKET_BULK_SELECT_CHECKBOX = "[data-testid='bulk-select'], .bulk-select-checkbox, .select-all";
Constants.TICKET_BULK_ACTIONS_DROPDOWN = "[data-testid='bulk-actions'], .bulk-actions-dropdown, #bulkActions";
// Ticket Detail View Selectors
Constants.TICKET_DETAIL_CONTAINER = "[data-testid='ticket-detail'], .ticket-detail-container, .ticket-view";
Constants.TICKET_HISTORY_SECTION = "[data-testid='ticket-history'], .ticket-history, .activity-log";
Constants.TICKET_COMMENTS_SECTION = "[data-testid='ticket-comments'], .ticket-comments, .comments-section";
Constants.TICKET_ATTACHMENTS_SECTION = "[data-testid='ticket-attachments'], .ticket-attachments, .attachments";
Constants.TICKET_ADD_COMMENT_BUTTON = "[data-testid='add-comment-btn'], .add-comment-btn, #addComment";
Constants.TICKET_COMMENT_TEXTAREA = "[data-testid='comment-text'], .comment-textarea, #commentText";
Constants.TICKET_ATTACH_FILE_BUTTON = "[data-testid='attach-file-btn'], .attach-file-btn, #attachFile";
// ===== HWPC NAVIGATION ELEMENTS =====
Constants.NAVIGATION_MENU = "Navigation Menu";
Constants.MOBILE_MENU_TOGGLE = "Mobile Menu Toggle";
Constants.HOME_LINK = "Home Link";
Constants.TICKETS_LINK = "Tickets Link";
Constants.PROFILE_LINK = "Profile Link";
Constants.LOGIN_LINK = "Login Link";
Constants.REGISTER_LINK = "Register Link";
Constants.LOGOUT_LINK = "Logout Link";
// ===== HWPC MOBILE NAVIGATION =====
Constants.MOBILE_NAV_MENU = "Mobile Navigation Menu";
Constants.MOBILE_NAV_TOGGLE = "Mobile Navigation Toggle";
Constants.HAMBURGER_MENU = "Hamburger Menu";
Constants.MOBILE_DROPDOWN = "Mobile Dropdown";
// ===== HWPC FORM ELEMENTS =====
Constants.SUBMIT_BUTTON = "Submit Button";
Constants.CANCEL_BUTTON = "Cancel Button";
Constants.SAVE_BUTTON = "Save Button";
Constants.DELETE_BUTTON = "Delete Button";
Constants.EDIT_BUTTON = "Edit Button";
Constants.CREATE_BUTTON = "Create Button";
// ===== HWPC RESULT DISPLAY ELEMENTS =====
Constants.RESULTS_CONTAINER = "Results Container";
Constants.MOBILE_RESULT_CARD = "Mobile Result Card";
Constants.DESKTOP_RESULT_TABLE = "Desktop Result Table";
Constants.PAGINATION_CONTAINER = "Pagination Container";
Constants.NEXT_PAGE_BUTTON = "Next Page Button";
Constants.PREVIOUS_PAGE_BUTTON = "Previous Page Button";
// ===== HWPC MESSAGE ELEMENTS =====
Constants.SUCCESS_MESSAGE = "Success Message";
Constants.ERROR_MESSAGE = "Error Message";
Constants.WARNING_MESSAGE = "Warning Message";
Constants.INFO_MESSAGE = "Info Message";
Constants.VALIDATION_ERROR = "Validation Error";
// ===== HWPC USER INTERFACE ELEMENTS =====
Constants.PAGE_TITLE = "Page Title";
Constants.PAGE_HEADER = "Page Header";
Constants.BREADCRUMB = "Breadcrumb";
Constants.FOOTER = "Footer";
Constants.SIDEBAR = "Sidebar";
Constants.MAIN_CONTENT = "Main Content";
// ===== MOBILE VIEWPORT CONFIGURATIONS =====
Constants.MOBILE_VIEWPORT = { width: 375, height: 667 };
Constants.MOBILE_LARGE_VIEWPORT = { width: 414, height: 896 };
Constants.TABLET_VIEWPORT = { width: 768, height: 1024 };
Constants.TABLET_LANDSCAPE_VIEWPORT = { width: 1024, height: 768 };
Constants.DESKTOP_VIEWPORT = { width: 1920, height: 1080 };
Constants.DESKTOP_SMALL_VIEWPORT = { width: 1366, height: 768 };
// ===== RESPONSIVE BREAKPOINTS =====
Constants.RESPONSIVE_BREAKPOINT_MOBILE = 768;
Constants.RESPONSIVE_BREAKPOINT_TABLET = 1024;
Constants.RESPONSIVE_BREAKPOINT_DESKTOP = 1200;
Constants.RESPONSIVE_BREAKPOINT_LARGE_DESKTOP = 1920;
// ===== MOBILE-SPECIFIC INTERACTION CONSTANTS =====
Constants.TOUCH_TIMEOUT = 3000;
Constants.MOBILE_WAIT_TIMEOUT = 5000;
Constants.MOBILE_SCROLL_TIMEOUT = 2000;
Constants.MOBILE_ANIMATION_TIMEOUT = 1000;
Constants.MOBILE_NETWORK_TIMEOUT = 10000;
// ===== MOBILE GESTURE CONSTANTS =====
Constants.SWIPE_DISTANCE = 100;
Constants.SWIPE_DURATION = 300;
Constants.TAP_DURATION = 100;
Constants.LONG_PRESS_DURATION = 1000;
Constants.PINCH_SCALE_FACTOR = 0.5;
// ===== MOBILE INTERACTION DELAYS =====
Constants.MOBILE_CLICK_DELAY = 100;
Constants.MOBILE_TYPE_DELAY = 50;
Constants.MOBILE_SCROLL_DELAY = 200;
Constants.MOBILE_TRANSITION_DELAY = 500;
// ===== ENVIRONMENT-SPECIFIC CONSTANTS =====
Constants.DEFAULT_BASE_URL = "http://10.147.17.219:3004";
Constants.TEST_ENVIRONMENT = "test";
Constants.QA_ENVIRONMENT = "qa";
Constants.PROD_ENVIRONMENT = "prod";
// ===== HWPC API ENDPOINTS (for future API testing) =====
Constants.API_BASE_PATH = "/api/v1";
Constants.TICKETS_API_ENDPOINT = "/tickets";
Constants.USERS_API_ENDPOINT = "/users";
Constants.AUTH_API_ENDPOINT = "/auth";
Constants.SEARCH_API_ENDPOINT = "/search";
// ===== TEST DATA CONSTANTS =====
Constants.TEST_TICKET_PREFIX = "TEST_TICKET_";
Constants.TEST_USER_PREFIX = "TEST_USER_";
Constants.INVALID_SEARCH_TERM = "INVALID_SEARCH_TERM_12345";
Constants.VALID_SEARCH_TERM = "ticket";
// ===== ACCESSIBILITY CONSTANTS =====
Constants.ARIA_LABEL = "aria-label";
Constants.ARIA_EXPANDED = "aria-expanded";
Constants.ARIA_HIDDEN = "aria-hidden";
Constants.ROLE_BUTTON = "button";
Constants.ROLE_NAVIGATION = "navigation";
Constants.ROLE_MAIN = "main";
// ===== ADDITIONAL MOBILE VIEWPORT CONFIGURATIONS =====
Constants.IPHONE_SE_VIEWPORT = { width: 375, height: 667 };
Constants.IPHONE_12_VIEWPORT = { width: 390, height: 844 };
Constants.IPHONE_12_PRO_MAX_VIEWPORT = { width: 428, height: 926 };
Constants.SAMSUNG_GALAXY_S21_VIEWPORT = { width: 360, height: 800 };
Constants.PIXEL_5_VIEWPORT = { width: 393, height: 851 };
Constants.IPAD_VIEWPORT = { width: 768, height: 1024 };
Constants.IPAD_PRO_VIEWPORT = { width: 1024, height: 1366 };
// ===== RESPONSIVE DESIGN UTILITY CONSTANTS =====
Constants.CSS_MOBILE_MEDIA_QUERY = "(max-width: 767px)";
Constants.CSS_TABLET_MEDIA_QUERY = "(min-width: 768px) and (max-width: 1023px)";
Constants.CSS_DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";
// ===== CUSTOMER MANAGEMENT ELEMENTS =====
// Customer List and Search Selectors
Constants.CUSTOMER_LIST_CONTAINER = "[data-testid='customer-list'], .customer-list-container, .customers-grid";
Constants.CUSTOMER_SEARCH_INPUT = "[data-testid='customer-search'], .customer-search-input, #customerSearch";
Constants.CUSTOMER_FILTER_BUTTON = "[data-testid='customer-filter-btn'], .customer-filter-btn, .filter-customers";
Constants.CUSTOMER_CREATE_BUTTON = "[data-testid='create-customer-btn'], .create-customer-btn, #createCustomerBtn";
Constants.CUSTOMER_SORT_DROPDOWN = "[data-testid='customer-sort'], .customer-sort-dropdown, #customerSort";
Constants.CUSTOMER_VIEW_TOGGLE = "[data-testid='customer-view-toggle'], .customer-view-toggle, .grid-list-toggle";
// Customer Form Selectors
Constants.CUSTOMER_COMPANY_NAME_INPUT = "[data-testid='customer-company'], .company-name-input, #companyName";
Constants.CUSTOMER_CONTACT_NAME_INPUT = "[data-testid='customer-contact'], .contact-name-input, #contactName";
Constants.CUSTOMER_PHONE_INPUT = "[data-testid='customer-phone'], .phone-input, #customerPhone";
Constants.CUSTOMER_EMAIL_INPUT = "[data-testid='customer-email'], .email-input, #customerEmail";
Constants.CUSTOMER_ADDRESS_INPUT = "[data-testid='customer-address'], .address-input, #customerAddress";
Constants.CUSTOMER_CITY_INPUT = "[data-testid='customer-city'], .city-input, #customerCity";
Constants.CUSTOMER_STATE_DROPDOWN = "[data-testid='customer-state'], .state-dropdown, #customerState";
Constants.CUSTOMER_ZIP_INPUT = "[data-testid='customer-zip'], .zip-input, #customerZip";
Constants.CUSTOMER_SERVICE_TYPE_CHECKBOXES = "[data-testid='service-types'], .service-type-checkbox, .service-options";
Constants.CUSTOMER_PREFERRED_TECHNICIAN_DROPDOWN = "[data-testid='preferred-tech'], .preferred-tech-select, #preferredTechnician";
Constants.CUSTOMER_SPECIAL_INSTRUCTIONS_TEXTAREA = "[data-testid='customer-instructions'], .customer-instructions, #customerInstructions";
// Customer Detail View Selectors
Constants.CUSTOMER_DETAIL_CONTAINER = "[data-testid='customer-detail'], .customer-detail-container, .customer-profile";
Constants.CUSTOMER_EDIT_BUTTON = "[data-testid='edit-customer-btn'], .edit-customer-btn, .customer-edit";
Constants.CUSTOMER_DELETE_BUTTON = "[data-testid='delete-customer-btn'], .delete-customer-btn, .customer-delete";
Constants.CUSTOMER_SERVICE_HISTORY_SECTION = "[data-testid='service-history'], .service-history, .customer-history";
Constants.CUSTOMER_TICKETS_SECTION = "[data-testid='customer-tickets'], .customer-tickets, .related-tickets";
Constants.CUSTOMER_NOTES_SECTION = "[data-testid='customer-notes'], .customer-notes, .notes-section";
Constants.CUSTOMER_ADD_NOTE_BUTTON = "[data-testid='add-note-btn'], .add-note-btn, #addCustomerNote";
// ===== ROUTE MANAGEMENT ELEMENTS =====
// Route List and Planning Selectors
Constants.ROUTE_LIST_CONTAINER = "[data-testid='route-list'], .route-list-container, .routes-grid";
Constants.ROUTE_CREATE_BUTTON = "[data-testid='create-route-btn'], .create-route-btn, #createRouteBtn";
Constants.ROUTE_DATE_PICKER = "[data-testid='route-date'], .route-date-picker, #routeDate";
Constants.ROUTE_TECHNICIAN_DROPDOWN = "[data-testid='route-technician'], .technician-select, #routeTechnician";
Constants.ROUTE_NAME_INPUT = "[data-testid='route-name'], .route-name-input, #routeName";
Constants.ROUTE_STATUS_DROPDOWN = "[data-testid='route-status'], .route-status-select, #routeStatus";
// Route Planning and Optimization Selectors
Constants.ROUTE_PLANNING_CONTAINER = "[data-testid='route-planning'], .route-planning-container, .route-builder";
Constants.ROUTE_UNASSIGNED_TICKETS = "[data-testid='unassigned-tickets'], .unassigned-tickets, .available-tickets";
Constants.ROUTE_ASSIGNED_TICKETS = "[data-testid='assigned-tickets'], .assigned-tickets, .route-tickets";
Constants.ROUTE_DRAG_DROP_ZONE = "[data-testid='drag-drop-zone'], .drag-drop-zone, .sortable-list";
Constants.ROUTE_OPTIMIZE_BUTTON = "[data-testid='optimize-route-btn'], .optimize-route-btn, #optimizeRoute";
Constants.ROUTE_MAP_CONTAINER = "[data-testid='route-map'], .route-map-container, .map-view";
Constants.ROUTE_DIRECTIONS_PANEL = "[data-testid='route-directions'], .directions-panel, .route-steps";
// Route Actions and Export Selectors
Constants.ROUTE_PRINT_BUTTON = "[data-testid='print-route-btn'], .print-route-btn, #printRoute";
Constants.ROUTE_EXPORT_BUTTON = "[data-testid='export-route-btn'], .export-route-btn, #exportRoute";
Constants.ROUTE_SHARE_BUTTON = "[data-testid='share-route-btn'], .share-route-btn, #shareRoute";
Constants.ROUTE_DUPLICATE_BUTTON = "[data-testid='duplicate-route-btn'], .duplicate-route-btn, #duplicateRoute";
Constants.ROUTE_DELETE_BUTTON = "[data-testid='delete-route-btn'], .delete-route-btn, .route-delete";
// Route Print Preview Selectors
Constants.ROUTE_PRINT_PREVIEW = "[data-testid='print-preview'], .print-preview-container, .route-print-view";
Constants.ROUTE_PRINT_OPTIONS = "[data-testid='print-options'], .print-options-panel, .print-settings";
Constants.ROUTE_PRINT_FORMAT_DROPDOWN = "[data-testid='print-format'], .print-format-select, #printFormat";
Constants.ROUTE_INCLUDE_MAP_CHECKBOX = "[data-testid='include-map'], .include-map-checkbox, #includeMap";
Constants.ROUTE_INCLUDE_DIRECTIONS_CHECKBOX = "[data-testid='include-directions'], .include-directions-checkbox, #includeDirections";
// ===== DASHBOARD AND REPORTING ELEMENTS =====
// Dashboard Selectors
Constants.DASHBOARD_CONTAINER = "[data-testid='dashboard'], .dashboard-container, .main-dashboard";
Constants.DASHBOARD_STATS_CARDS = "[data-testid='stats-cards'], .stats-cards, .dashboard-metrics";
Constants.DASHBOARD_CHARTS_SECTION = "[data-testid='dashboard-charts'], .charts-section, .analytics-charts";
Constants.DASHBOARD_RECENT_TICKETS = "[data-testid='recent-tickets'], .recent-tickets, .latest-tickets";
Constants.DASHBOARD_ACTIVE_ROUTES = "[data-testid='active-routes'], .active-routes, .current-routes";
Constants.DASHBOARD_NOTIFICATIONS = "[data-testid='notifications'], .notifications-panel, .alerts-section";
// Reporting Selectors
Constants.REPORTS_CONTAINER = "[data-testid='reports'], .reports-container, .reports-section";
Constants.REPORT_TYPE_DROPDOWN = "[data-testid='report-type'], .report-type-select, #reportType";
Constants.REPORT_DATE_RANGE_PICKER = "[data-testid='date-range'], .date-range-picker, .report-dates";
Constants.REPORT_GENERATE_BUTTON = "[data-testid='generate-report-btn'], .generate-report-btn, #generateReport";
Constants.REPORT_EXPORT_BUTTON = "[data-testid='export-report-btn'], .export-report-btn, #exportReport";
Constants.REPORT_RESULTS_CONTAINER = "[data-testid='report-results'], .report-results, .report-output";
// ===== MOBILE-SPECIFIC CSS CLASSES =====
Constants.MOBILE_HIDDEN_CLASS = "d-none d-md-block";
Constants.MOBILE_VISIBLE_CLASS = "d-block d-md-none";
Constants.RESPONSIVE_CONTAINER_CLASS = "container-fluid";
Constants.MOBILE_NAVIGATION_CLASS = "navbar-collapse";
// ===== HOME PAGE SPECIFIC ELEMENTS =====
Constants.HERO_SECTION = ".hero, .hero-section, .banner, [data-hero]";
Constants.SEARCH_SECTION = ".search-section, .home-search, [data-search-section]";
Constants.QUICK_ACTIONS = ".quick-actions, .action-buttons, [data-quick-actions]";
Constants.FEATURE_CARDS = ".feature-cards, .features, .home-features, [data-features]";
// ===== TOUCH INTERACTION CONSTANTS =====
Constants.TOUCH_START_EVENT = "touchstart";
Constants.TOUCH_END_EVENT = "touchend";
Constants.TOUCH_MOVE_EVENT = "touchmove";
Constants.MOUSE_DOWN_EVENT = "mousedown";
Constants.MOUSE_UP_EVENT = "mouseup";
// ===== MOBILE PERFORMANCE CONSTANTS =====
Constants.MOBILE_SLOW_NETWORK_TIMEOUT = 15000;
Constants.MOBILE_FAST_NETWORK_TIMEOUT = 5000;
Constants.MOBILE_IMAGE_LOAD_TIMEOUT = 8000;
Constants.MOBILE_SCRIPT_LOAD_TIMEOUT = 10000;
// ===== RESPONSIVE GRID CONSTANTS =====
Constants.MOBILE_COLUMNS = 1;
Constants.TABLET_COLUMNS = 2;
Constants.DESKTOP_COLUMNS = 3;
Constants.LARGE_DESKTOP_COLUMNS = 4;
// ===== MOBILE NAVIGATION PATTERNS =====
Constants.HAMBURGER_MENU_SELECTOR = ".navbar-toggler, .hamburger, .mobile-menu-btn";
Constants.MOBILE_MENU_SLIDE_DURATION = 300;
Constants.MOBILE_MENU_FADE_DURATION = 200;
// ===== MOBILE FORM INTERACTION CONSTANTS =====
Constants.MOBILE_INPUT_FOCUS_DELAY = 300;
Constants.MOBILE_KEYBOARD_SHOW_DELAY = 500;
Constants.MOBILE_KEYBOARD_HIDE_DELAY = 300;
Constants.MOBILE_FORM_VALIDATION_DELAY = 200;
// ===== MOBILE SCROLL BEHAVIOR CONSTANTS =====
Constants.MOBILE_SCROLL_BEHAVIOR = "smooth";
Constants.MOBILE_SCROLL_BLOCK = "center";
Constants.MOBILE_SCROLL_INLINE = "nearest";
Constants.MOBILE_INFINITE_SCROLL_THRESHOLD = 100;
// ===== DEVICE ORIENTATION CONSTANTS =====
Constants.PORTRAIT_ORIENTATION = "portrait-primary";
Constants.LANDSCAPE_ORIENTATION = "landscape-primary";
Constants.ORIENTATION_CHANGE_DELAY = 500;
// ===== MOBILE-SPECIFIC SELECTORS =====
Constants.MOBILE_SEARCH_SELECTOR = ".mobile-search, .search-mobile, [data-mobile-search]";
Constants.MOBILE_FILTER_SELECTOR = ".mobile-filter, .filter-mobile, [data-mobile-filter]";
Constants.MOBILE_SORT_SELECTOR = ".mobile-sort, .sort-mobile, [data-mobile-sort]";
Constants.MOBILE_PAGINATION_SELECTOR = ".mobile-pagination, .pagination-mobile";
// Mobile Navigation Selectors
Constants.MOBILE_MENU_BUTTON = "[data-testid='mobile-menu-btn'], .mobile-menu-btn, .hamburger-menu";
Constants.MOBILE_MENU_OVERLAY = "[data-testid='mobile-overlay'], .mobile-menu-overlay, .menu-backdrop";
Constants.MOBILE_MENU_CLOSE_BUTTON = "[data-testid='mobile-close-btn'], .mobile-close-btn, .menu-close";
Constants.MOBILE_BOTTOM_NAV = "[data-testid='bottom-nav'], .bottom-navigation, .mobile-bottom-nav";
Constants.MOBILE_TAB_BAR = "[data-testid='tab-bar'], .tab-bar, .mobile-tabs";
// Mobile Form Selectors
Constants.MOBILE_FORM_CONTAINER = "[data-testid='mobile-form'], .mobile-form-container, .form-mobile";
Constants.MOBILE_INPUT_GROUP = "[data-testid='mobile-input-group'], .mobile-input-group, .input-group-mobile";
Constants.MOBILE_FLOATING_LABEL = "[data-testid='floating-label'], .floating-label, .form-floating";
Constants.MOBILE_KEYBOARD_TOOLBAR = "[data-testid='keyboard-toolbar'], .keyboard-toolbar, .input-toolbar";
// Mobile List and Card Selectors
Constants.MOBILE_CARD_CONTAINER = "[data-testid='mobile-card'], .mobile-card, .card-mobile";
Constants.MOBILE_LIST_ITEM = "[data-testid='mobile-list-item'], .mobile-list-item, .list-item-mobile";
Constants.MOBILE_SWIPE_ACTIONS = "[data-testid='swipe-actions'], .swipe-actions, .mobile-actions";
Constants.MOBILE_PULL_TO_REFRESH = "[data-testid='pull-refresh'], .pull-to-refresh, .refresh-trigger";
Constants.MOBILE_INFINITE_SCROLL = "[data-testid='infinite-scroll'], .infinite-scroll, .load-more-trigger";
// Mobile Modal and Dialog Selectors
Constants.MOBILE_MODAL_CONTAINER = "[data-testid='mobile-modal'], .mobile-modal, .modal-mobile";
Constants.MOBILE_BOTTOM_SHEET = "[data-testid='bottom-sheet'], .bottom-sheet, .mobile-drawer";
Constants.MOBILE_ACTION_SHEET = "[data-testid='action-sheet'], .action-sheet, .mobile-actions-menu";
Constants.MOBILE_TOAST_NOTIFICATION = "[data-testid='mobile-toast'], .mobile-toast, .toast-mobile";
// Mobile Touch Interaction Selectors
Constants.MOBILE_TOUCH_TARGET = "[data-testid='touch-target'], .touch-target, .mobile-clickable";
Constants.MOBILE_DRAG_HANDLE = "[data-testid='drag-handle'], .drag-handle, .mobile-drag";
Constants.MOBILE_SWIPE_CONTAINER = "[data-testid='swipe-container'], .swipe-container, .swipeable";
Constants.MOBILE_PINCH_ZOOM_CONTAINER = "[data-testid='pinch-zoom'], .pinch-zoom, .zoomable";
// Mobile-Specific Feature Selectors
Constants.MOBILE_CAMERA_BUTTON = "[data-testid='camera-btn'], .camera-btn, .mobile-camera";
Constants.MOBILE_GPS_BUTTON = "[data-testid='gps-btn'], .gps-btn, .location-btn";
Constants.MOBILE_PHONE_LINK = "[data-testid='phone-link'], .phone-link, .tel-link";
Constants.MOBILE_EMAIL_LINK = "[data-testid='email-link'], .email-link, .mailto-link";
Constants.MOBILE_SHARE_BUTTON = "[data-testid='mobile-share'], .mobile-share, .share-native";
// Mobile Performance and Loading Selectors
Constants.MOBILE_LOADING_SPINNER = "[data-testid='mobile-loading'], .mobile-loading, .spinner-mobile";
Constants.MOBILE_SKELETON_LOADER = "[data-testid='skeleton-loader'], .skeleton-loader, .loading-skeleton";
Constants.MOBILE_LAZY_IMAGE = "[data-testid='lazy-image'], .lazy-image, .img-lazy";
Constants.MOBILE_OFFLINE_INDICATOR = "[data-testid='offline-indicator'], .offline-indicator, .connection-status";
// ===== RESPONSIVE IMAGE CONSTANTS =====
Constants.MOBILE_IMAGE_QUALITY = 0.8;
Constants.TABLET_IMAGE_QUALITY = 0.9;
Constants.DESKTOP_IMAGE_QUALITY = 1.0;
Constants.LAZY_LOAD_THRESHOLD = "200px";
// ===== MOBILE ACCESSIBILITY CONSTANTS =====
Constants.MOBILE_MIN_TOUCH_TARGET = 44; // pixels
Constants.MOBILE_RECOMMENDED_TOUCH_TARGET = 48; // pixels
Constants.MOBILE_FOCUS_OUTLINE_WIDTH = 2; // pixels
Constants.MOBILE_TEXT_CONTRAST_RATIO = 4.5;
//# sourceMappingURL=Constants.js.map