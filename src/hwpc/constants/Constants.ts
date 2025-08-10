/**
 * HWPC Constants - Comprehensive UI element selectors and configuration constants
 * Enhanced with comprehensive selectors for tickets, customers, routes, and mobile-first testing
 */

export default class Constants {
    // Legacy constants (keeping for backward compatibility)
    static readonly PRODUCT = "Product";
    static readonly SEARCH_BUTTON = "Search Button";
    static readonly MESSAGE = "Message";
    static readonly MY_ACCOUNT = "My Account";
    static readonly LOGOUT = "Logout";
    static readonly REGISTER = "Register";
    static readonly FIRST_NAME = "First Name";
    static readonly LAST_NAME = "Last Name";
    static readonly EMAIL = "Email";
    static readonly TELEPHONE = "Telephone";
    static readonly PASSWORD = "Password";
    static readonly CONFIRM_PASSWORD = "Confirm Password";
    static readonly PRIVACY_POLICY = "Privacy Policy";
    static readonly CONTINUE = "Continue";

    // ===== HWPC PAGE ROUTES =====
    static readonly TICKETS_PAGE = "/tickets";
    static readonly HOME_PAGE = "/";
    static readonly LOGIN_PAGE = "/login";
    static readonly REGISTER_PAGE = "/register";
    static readonly PROFILE_PAGE = "/profile";

    // ===== HWPC SEARCH FUNCTIONALITY =====
    static readonly SEARCH_INPUT = "Search Input";
    static readonly SEARCH_FORM = "Search Form";
    static readonly SEARCH_RESULTS = "Search Results";
    static readonly NO_RESULTS_MESSAGE = "No Results Message";
    static readonly LOADING_INDICATOR = "Loading Indicator";
    static readonly SEARCH_RESULTS_COUNT = "Search Results Count";

    // ===== HWPC TICKET ELEMENTS =====
    static readonly TICKET = "Ticket";
    static readonly TICKET_LIST = "Ticket List";
    static readonly TICKET_ITEM = "Ticket Item";
    static readonly TICKET_TITLE = "Ticket Title";
    static readonly TICKET_ID = "Ticket ID";
    static readonly TICKET_STATUS = "Ticket Status";
    static readonly TICKET_PRIORITY = "Ticket Priority";
    static readonly TICKET_DESCRIPTION = "Ticket Description";
    static readonly TICKET_CREATED_DATE = "Ticket Created Date";
    static readonly TICKET_UPDATED_DATE = "Ticket Updated Date";
    static readonly TICKET_ASSIGNEE = "Ticket Assignee";
    
    // Enhanced Ticket Management Selectors
    static readonly TICKET_CREATE_BUTTON = "[data-testid='create-ticket-btn'], .create-ticket-btn, #createTicketBtn";
    static readonly TICKET_EDIT_BUTTON = "[data-testid='edit-ticket-btn'], .edit-ticket-btn, .ticket-edit";
    static readonly TICKET_DELETE_BUTTON = "[data-testid='delete-ticket-btn'], .delete-ticket-btn, .ticket-delete";
    static readonly TICKET_STATUS_DROPDOWN = "[data-testid='ticket-status-select'], .ticket-status-select, #ticketStatus";
    static readonly TICKET_PRIORITY_DROPDOWN = "[data-testid='ticket-priority-select'], .ticket-priority-select, #ticketPriority";
    static readonly TICKET_ASSIGNEE_DROPDOWN = "[data-testid='ticket-assignee-select'], .ticket-assignee-select, #ticketAssignee";
    static readonly TICKET_CUSTOMER_DROPDOWN = "[data-testid='ticket-customer-select'], .ticket-customer-select, #ticketCustomer";
    static readonly TICKET_SERVICE_TYPE_DROPDOWN = "[data-testid='ticket-service-type-select'], .service-type-select, #serviceType";
    static readonly TICKET_SCHEDULED_DATE_INPUT = "[data-testid='ticket-scheduled-date'], .scheduled-date-input, #scheduledDate";
    static readonly TICKET_ESTIMATED_DURATION_INPUT = "[data-testid='ticket-duration'], .duration-input, #estimatedDuration";
    static readonly TICKET_SPECIAL_INSTRUCTIONS_TEXTAREA = "[data-testid='ticket-instructions'], .special-instructions, #specialInstructions";
    
    // Ticket List and Search Selectors
    static readonly TICKET_SEARCH_INPUT = "[data-testid='ticket-search'], .ticket-search-input, #ticketSearch";
    static readonly TICKET_FILTER_BUTTON = "[data-testid='ticket-filter-btn'], .filter-btn, .ticket-filter";
    static readonly TICKET_SORT_DROPDOWN = "[data-testid='ticket-sort'], .sort-dropdown, #ticketSort";
    static readonly TICKET_VIEW_TOGGLE = "[data-testid='view-toggle'], .view-toggle-btn, .list-grid-toggle";
    static readonly TICKET_BULK_SELECT_CHECKBOX = "[data-testid='bulk-select'], .bulk-select-checkbox, .select-all";
    static readonly TICKET_BULK_ACTIONS_DROPDOWN = "[data-testid='bulk-actions'], .bulk-actions-dropdown, #bulkActions";
    
    // Ticket Detail View Selectors
    static readonly TICKET_DETAIL_CONTAINER = "[data-testid='ticket-detail'], .ticket-detail-container, .ticket-view";
    static readonly TICKET_HISTORY_SECTION = "[data-testid='ticket-history'], .ticket-history, .activity-log";
    static readonly TICKET_COMMENTS_SECTION = "[data-testid='ticket-comments'], .ticket-comments, .comments-section";
    static readonly TICKET_ATTACHMENTS_SECTION = "[data-testid='ticket-attachments'], .ticket-attachments, .attachments";
    static readonly TICKET_ADD_COMMENT_BUTTON = "[data-testid='add-comment-btn'], .add-comment-btn, #addComment";
    static readonly TICKET_COMMENT_TEXTAREA = "[data-testid='comment-text'], .comment-textarea, #commentText";
    static readonly TICKET_ATTACH_FILE_BUTTON = "[data-testid='attach-file-btn'], .attach-file-btn, #attachFile";

    // ===== HWPC NAVIGATION ELEMENTS =====
    static readonly NAVIGATION_MENU = "Navigation Menu";
    static readonly MOBILE_MENU_TOGGLE = "Mobile Menu Toggle";
    static readonly HOME_LINK = "Home Link";
    static readonly TICKETS_LINK = "Tickets Link";
    static readonly PROFILE_LINK = "Profile Link";
    static readonly LOGIN_LINK = "Login Link";
    static readonly REGISTER_LINK = "Register Link";
    static readonly LOGOUT_LINK = "Logout Link";

    // ===== HWPC MOBILE NAVIGATION =====
    static readonly MOBILE_NAV_MENU = "Mobile Navigation Menu";
    static readonly MOBILE_NAV_TOGGLE = "Mobile Navigation Toggle";
    static readonly HAMBURGER_MENU = "Hamburger Menu";
    static readonly MOBILE_DROPDOWN = "Mobile Dropdown";

    // ===== HWPC FORM ELEMENTS =====
    static readonly SUBMIT_BUTTON = "Submit Button";
    static readonly CANCEL_BUTTON = "Cancel Button";
    static readonly SAVE_BUTTON = "Save Button";
    static readonly DELETE_BUTTON = "Delete Button";
    static readonly EDIT_BUTTON = "Edit Button";
    static readonly CREATE_BUTTON = "Create Button";

    // ===== HWPC RESULT DISPLAY ELEMENTS =====
    static readonly RESULTS_CONTAINER = "Results Container";
    static readonly MOBILE_RESULT_CARD = "Mobile Result Card";
    static readonly DESKTOP_RESULT_TABLE = "Desktop Result Table";
    static readonly PAGINATION_CONTAINER = "Pagination Container";
    static readonly NEXT_PAGE_BUTTON = "Next Page Button";
    static readonly PREVIOUS_PAGE_BUTTON = "Previous Page Button";

    // ===== HWPC MESSAGE ELEMENTS =====
    static readonly SUCCESS_MESSAGE = "Success Message";
    static readonly ERROR_MESSAGE = "Error Message";
    static readonly WARNING_MESSAGE = "Warning Message";
    static readonly INFO_MESSAGE = "Info Message";
    static readonly VALIDATION_ERROR = "Validation Error";

    // ===== HWPC USER INTERFACE ELEMENTS =====
    static readonly PAGE_TITLE = "Page Title";
    static readonly PAGE_HEADER = "Page Header";
    static readonly BREADCRUMB = "Breadcrumb";
    static readonly FOOTER = "Footer";
    static readonly SIDEBAR = "Sidebar";
    static readonly MAIN_CONTENT = "Main Content";

    // ===== MOBILE VIEWPORT CONFIGURATIONS =====
    static readonly MOBILE_VIEWPORT = { width: 375, height: 667 };
    static readonly MOBILE_LARGE_VIEWPORT = { width: 414, height: 896 };
    static readonly TABLET_VIEWPORT = { width: 768, height: 1024 };
    static readonly TABLET_LANDSCAPE_VIEWPORT = { width: 1024, height: 768 };
    static readonly DESKTOP_VIEWPORT = { width: 1920, height: 1080 };
    static readonly DESKTOP_SMALL_VIEWPORT = { width: 1366, height: 768 };

    // ===== RESPONSIVE BREAKPOINTS =====
    static readonly RESPONSIVE_BREAKPOINT_MOBILE = 768;
    static readonly RESPONSIVE_BREAKPOINT_TABLET = 1024;
    static readonly RESPONSIVE_BREAKPOINT_DESKTOP = 1200;
    static readonly RESPONSIVE_BREAKPOINT_LARGE_DESKTOP = 1920;

    // ===== MOBILE-SPECIFIC INTERACTION CONSTANTS =====
    static readonly TOUCH_TIMEOUT = 3000;
    static readonly MOBILE_WAIT_TIMEOUT = 5000;
    static readonly MOBILE_SCROLL_TIMEOUT = 2000;
    static readonly MOBILE_ANIMATION_TIMEOUT = 1000;
    static readonly MOBILE_NETWORK_TIMEOUT = 10000;

    // ===== MOBILE GESTURE CONSTANTS =====
    static readonly SWIPE_DISTANCE = 100;
    static readonly SWIPE_DURATION = 300;
    static readonly TAP_DURATION = 100;
    static readonly LONG_PRESS_DURATION = 1000;
    static readonly PINCH_SCALE_FACTOR = 0.5;

    // ===== MOBILE INTERACTION DELAYS =====
    static readonly MOBILE_CLICK_DELAY = 100;
    static readonly MOBILE_TYPE_DELAY = 50;
    static readonly MOBILE_SCROLL_DELAY = 200;
    static readonly MOBILE_TRANSITION_DELAY = 500;

    // ===== ENVIRONMENT-SPECIFIC CONSTANTS =====
    static readonly DEFAULT_BASE_URL = "http://10.147.17.219:3004";
    static readonly TEST_ENVIRONMENT = "test";
    static readonly QA_ENVIRONMENT = "qa";
    static readonly PROD_ENVIRONMENT = "prod";

    // ===== HWPC API ENDPOINTS (for future API testing) =====
    static readonly API_BASE_PATH = "/api/v1";
    static readonly TICKETS_API_ENDPOINT = "/tickets";
    static readonly USERS_API_ENDPOINT = "/users";
    static readonly AUTH_API_ENDPOINT = "/auth";
    static readonly SEARCH_API_ENDPOINT = "/search";

    // ===== TEST DATA CONSTANTS =====
    static readonly TEST_TICKET_PREFIX = "TEST_TICKET_";
    static readonly TEST_USER_PREFIX = "TEST_USER_";
    static readonly INVALID_SEARCH_TERM = "INVALID_SEARCH_TERM_12345";
    static readonly VALID_SEARCH_TERM = "ticket";

    // ===== ACCESSIBILITY CONSTANTS =====
    static readonly ARIA_LABEL = "aria-label";
    static readonly ARIA_EXPANDED = "aria-expanded";
    static readonly ARIA_HIDDEN = "aria-hidden";
    static readonly ROLE_BUTTON = "button";
    static readonly ROLE_NAVIGATION = "navigation";
    static readonly ROLE_MAIN = "main";

    // ===== ADDITIONAL MOBILE VIEWPORT CONFIGURATIONS =====
    static readonly IPHONE_SE_VIEWPORT = { width: 375, height: 667 };
    static readonly IPHONE_12_VIEWPORT = { width: 390, height: 844 };
    static readonly IPHONE_12_PRO_MAX_VIEWPORT = { width: 428, height: 926 };
    static readonly SAMSUNG_GALAXY_S21_VIEWPORT = { width: 360, height: 800 };
    static readonly PIXEL_5_VIEWPORT = { width: 393, height: 851 };
    static readonly IPAD_VIEWPORT = { width: 768, height: 1024 };
    static readonly IPAD_PRO_VIEWPORT = { width: 1024, height: 1366 };

    // ===== RESPONSIVE DESIGN UTILITY CONSTANTS =====
    static readonly CSS_MOBILE_MEDIA_QUERY = "(max-width: 767px)";
    static readonly CSS_TABLET_MEDIA_QUERY = "(min-width: 768px) and (max-width: 1023px)";
    static readonly CSS_DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

    // ===== CUSTOMER MANAGEMENT ELEMENTS =====
    
    // Customer List and Search Selectors
    static readonly CUSTOMER_LIST_CONTAINER = "[data-testid='customer-list'], .customer-list-container, .customers-grid";
    static readonly CUSTOMER_SEARCH_INPUT = "[data-testid='customer-search'], .customer-search-input, #customerSearch";
    static readonly CUSTOMER_FILTER_BUTTON = "[data-testid='customer-filter-btn'], .customer-filter-btn, .filter-customers";
    static readonly CUSTOMER_CREATE_BUTTON = "[data-testid='create-customer-btn'], .create-customer-btn, #createCustomerBtn";
    static readonly CUSTOMER_SORT_DROPDOWN = "[data-testid='customer-sort'], .customer-sort-dropdown, #customerSort";
    static readonly CUSTOMER_VIEW_TOGGLE = "[data-testid='customer-view-toggle'], .customer-view-toggle, .grid-list-toggle";
    
    // Customer Form Selectors
    static readonly CUSTOMER_COMPANY_NAME_INPUT = "[data-testid='customer-company'], .company-name-input, #companyName";
    static readonly CUSTOMER_CONTACT_NAME_INPUT = "[data-testid='customer-contact'], .contact-name-input, #contactName";
    static readonly CUSTOMER_PHONE_INPUT = "[data-testid='customer-phone'], .phone-input, #customerPhone";
    static readonly CUSTOMER_EMAIL_INPUT = "[data-testid='customer-email'], .email-input, #customerEmail";
    static readonly CUSTOMER_ADDRESS_INPUT = "[data-testid='customer-address'], .address-input, #customerAddress";
    static readonly CUSTOMER_CITY_INPUT = "[data-testid='customer-city'], .city-input, #customerCity";
    static readonly CUSTOMER_STATE_DROPDOWN = "[data-testid='customer-state'], .state-dropdown, #customerState";
    static readonly CUSTOMER_ZIP_INPUT = "[data-testid='customer-zip'], .zip-input, #customerZip";
    static readonly CUSTOMER_SERVICE_TYPE_CHECKBOXES = "[data-testid='service-types'], .service-type-checkbox, .service-options";
    static readonly CUSTOMER_PREFERRED_TECHNICIAN_DROPDOWN = "[data-testid='preferred-tech'], .preferred-tech-select, #preferredTechnician";
    static readonly CUSTOMER_SPECIAL_INSTRUCTIONS_TEXTAREA = "[data-testid='customer-instructions'], .customer-instructions, #customerInstructions";
    
    // Customer Detail View Selectors
    static readonly CUSTOMER_DETAIL_CONTAINER = "[data-testid='customer-detail'], .customer-detail-container, .customer-profile";
    static readonly CUSTOMER_EDIT_BUTTON = "[data-testid='edit-customer-btn'], .edit-customer-btn, .customer-edit";
    static readonly CUSTOMER_DELETE_BUTTON = "[data-testid='delete-customer-btn'], .delete-customer-btn, .customer-delete";
    static readonly CUSTOMER_SERVICE_HISTORY_SECTION = "[data-testid='service-history'], .service-history, .customer-history";
    static readonly CUSTOMER_TICKETS_SECTION = "[data-testid='customer-tickets'], .customer-tickets, .related-tickets";
    static readonly CUSTOMER_NOTES_SECTION = "[data-testid='customer-notes'], .customer-notes, .notes-section";
    static readonly CUSTOMER_ADD_NOTE_BUTTON = "[data-testid='add-note-btn'], .add-note-btn, #addCustomerNote";
    
    // ===== ROUTE MANAGEMENT ELEMENTS =====
    
    // Route List and Planning Selectors
    static readonly ROUTE_LIST_CONTAINER = "[data-testid='route-list'], .route-list-container, .routes-grid";
    static readonly ROUTE_CREATE_BUTTON = "[data-testid='create-route-btn'], .create-route-btn, #createRouteBtn";
    static readonly ROUTE_DATE_PICKER = "[data-testid='route-date'], .route-date-picker, #routeDate";
    static readonly ROUTE_TECHNICIAN_DROPDOWN = "[data-testid='route-technician'], .technician-select, #routeTechnician";
    static readonly ROUTE_NAME_INPUT = "[data-testid='route-name'], .route-name-input, #routeName";
    static readonly ROUTE_STATUS_DROPDOWN = "[data-testid='route-status'], .route-status-select, #routeStatus";
    
    // Route Planning and Optimization Selectors
    static readonly ROUTE_PLANNING_CONTAINER = "[data-testid='route-planning'], .route-planning-container, .route-builder";
    static readonly ROUTE_UNASSIGNED_TICKETS = "[data-testid='unassigned-tickets'], .unassigned-tickets, .available-tickets";
    static readonly ROUTE_ASSIGNED_TICKETS = "[data-testid='assigned-tickets'], .assigned-tickets, .route-tickets";
    static readonly ROUTE_DRAG_DROP_ZONE = "[data-testid='drag-drop-zone'], .drag-drop-zone, .sortable-list";
    static readonly ROUTE_OPTIMIZE_BUTTON = "[data-testid='optimize-route-btn'], .optimize-route-btn, #optimizeRoute";
    static readonly ROUTE_MAP_CONTAINER = "[data-testid='route-map'], .route-map-container, .map-view";
    static readonly ROUTE_DIRECTIONS_PANEL = "[data-testid='route-directions'], .directions-panel, .route-steps";
    
    // Route Actions and Export Selectors
    static readonly ROUTE_PRINT_BUTTON = "[data-testid='print-route-btn'], .print-route-btn, #printRoute";
    static readonly ROUTE_EXPORT_BUTTON = "[data-testid='export-route-btn'], .export-route-btn, #exportRoute";
    static readonly ROUTE_SHARE_BUTTON = "[data-testid='share-route-btn'], .share-route-btn, #shareRoute";
    static readonly ROUTE_DUPLICATE_BUTTON = "[data-testid='duplicate-route-btn'], .duplicate-route-btn, #duplicateRoute";
    static readonly ROUTE_DELETE_BUTTON = "[data-testid='delete-route-btn'], .delete-route-btn, .route-delete";
    
    // Route Print Preview Selectors
    static readonly ROUTE_PRINT_PREVIEW = "[data-testid='print-preview'], .print-preview-container, .route-print-view";
    static readonly ROUTE_PRINT_OPTIONS = "[data-testid='print-options'], .print-options-panel, .print-settings";
    static readonly ROUTE_PRINT_FORMAT_DROPDOWN = "[data-testid='print-format'], .print-format-select, #printFormat";
    static readonly ROUTE_INCLUDE_MAP_CHECKBOX = "[data-testid='include-map'], .include-map-checkbox, #includeMap";
    static readonly ROUTE_INCLUDE_DIRECTIONS_CHECKBOX = "[data-testid='include-directions'], .include-directions-checkbox, #includeDirections";
    
    // ===== DASHBOARD AND REPORTING ELEMENTS =====
    
    // Dashboard Selectors
    static readonly DASHBOARD_CONTAINER = "[data-testid='dashboard'], .dashboard-container, .main-dashboard";
    static readonly DASHBOARD_STATS_CARDS = "[data-testid='stats-cards'], .stats-cards, .dashboard-metrics";
    static readonly DASHBOARD_CHARTS_SECTION = "[data-testid='dashboard-charts'], .charts-section, .analytics-charts";
    static readonly DASHBOARD_RECENT_TICKETS = "[data-testid='recent-tickets'], .recent-tickets, .latest-tickets";
    static readonly DASHBOARD_ACTIVE_ROUTES = "[data-testid='active-routes'], .active-routes, .current-routes";
    static readonly DASHBOARD_NOTIFICATIONS = "[data-testid='notifications'], .notifications-panel, .alerts-section";
    
    // Reporting Selectors
    static readonly REPORTS_CONTAINER = "[data-testid='reports'], .reports-container, .reports-section";
    static readonly REPORT_TYPE_DROPDOWN = "[data-testid='report-type'], .report-type-select, #reportType";
    static readonly REPORT_DATE_RANGE_PICKER = "[data-testid='date-range'], .date-range-picker, .report-dates";
    static readonly REPORT_GENERATE_BUTTON = "[data-testid='generate-report-btn'], .generate-report-btn, #generateReport";
    static readonly REPORT_EXPORT_BUTTON = "[data-testid='export-report-btn'], .export-report-btn, #exportReport";
    static readonly REPORT_RESULTS_CONTAINER = "[data-testid='report-results'], .report-results, .report-output";
    
    // ===== MOBILE-SPECIFIC CSS CLASSES =====
    static readonly MOBILE_HIDDEN_CLASS = "d-none d-md-block";
    static readonly MOBILE_VISIBLE_CLASS = "d-block d-md-none";
    static readonly RESPONSIVE_CONTAINER_CLASS = "container-fluid";
    static readonly MOBILE_NAVIGATION_CLASS = "navbar-collapse";

    // ===== HOME PAGE SPECIFIC ELEMENTS =====
    static readonly HERO_SECTION = ".hero, .hero-section, .banner, [data-hero]";
    static readonly SEARCH_SECTION = ".search-section, .home-search, [data-search-section]";
    static readonly QUICK_ACTIONS = ".quick-actions, .action-buttons, [data-quick-actions]";
    static readonly FEATURE_CARDS = ".feature-cards, .features, .home-features, [data-features]";

    // ===== TOUCH INTERACTION CONSTANTS =====
    static readonly TOUCH_START_EVENT = "touchstart";
    static readonly TOUCH_END_EVENT = "touchend";
    static readonly TOUCH_MOVE_EVENT = "touchmove";
    static readonly MOUSE_DOWN_EVENT = "mousedown";
    static readonly MOUSE_UP_EVENT = "mouseup";

    // ===== MOBILE PERFORMANCE CONSTANTS =====
    static readonly MOBILE_SLOW_NETWORK_TIMEOUT = 15000;
    static readonly MOBILE_FAST_NETWORK_TIMEOUT = 5000;
    static readonly MOBILE_IMAGE_LOAD_TIMEOUT = 8000;
    static readonly MOBILE_SCRIPT_LOAD_TIMEOUT = 10000;

    // ===== RESPONSIVE GRID CONSTANTS =====
    static readonly MOBILE_COLUMNS = 1;
    static readonly TABLET_COLUMNS = 2;
    static readonly DESKTOP_COLUMNS = 3;
    static readonly LARGE_DESKTOP_COLUMNS = 4;

    // ===== MOBILE NAVIGATION PATTERNS =====
    static readonly HAMBURGER_MENU_SELECTOR = ".navbar-toggler, .hamburger, .mobile-menu-btn";
    static readonly MOBILE_MENU_SLIDE_DURATION = 300;
    static readonly MOBILE_MENU_FADE_DURATION = 200;

    // ===== MOBILE FORM INTERACTION CONSTANTS =====
    static readonly MOBILE_INPUT_FOCUS_DELAY = 300;
    static readonly MOBILE_KEYBOARD_SHOW_DELAY = 500;
    static readonly MOBILE_KEYBOARD_HIDE_DELAY = 300;
    static readonly MOBILE_FORM_VALIDATION_DELAY = 200;

    // ===== MOBILE SCROLL BEHAVIOR CONSTANTS =====
    static readonly MOBILE_SCROLL_BEHAVIOR = "smooth";
    static readonly MOBILE_SCROLL_BLOCK = "center";
    static readonly MOBILE_SCROLL_INLINE = "nearest";
    static readonly MOBILE_INFINITE_SCROLL_THRESHOLD = 100;

    // ===== DEVICE ORIENTATION CONSTANTS =====
    static readonly PORTRAIT_ORIENTATION = "portrait-primary";
    static readonly LANDSCAPE_ORIENTATION = "landscape-primary";
    static readonly ORIENTATION_CHANGE_DELAY = 500;

    // ===== MOBILE-SPECIFIC SELECTORS =====
    static readonly MOBILE_SEARCH_SELECTOR = ".mobile-search, .search-mobile, [data-mobile-search]";
    static readonly MOBILE_FILTER_SELECTOR = ".mobile-filter, .filter-mobile, [data-mobile-filter]";
    static readonly MOBILE_SORT_SELECTOR = ".mobile-sort, .sort-mobile, [data-mobile-sort]";
    static readonly MOBILE_PAGINATION_SELECTOR = ".mobile-pagination, .pagination-mobile";
    
    // Mobile Navigation Selectors
    static readonly MOBILE_MENU_BUTTON = "[data-testid='mobile-menu-btn'], .mobile-menu-btn, .hamburger-menu";
    static readonly MOBILE_MENU_OVERLAY = "[data-testid='mobile-overlay'], .mobile-menu-overlay, .menu-backdrop";
    static readonly MOBILE_MENU_CLOSE_BUTTON = "[data-testid='mobile-close-btn'], .mobile-close-btn, .menu-close";
    static readonly MOBILE_BOTTOM_NAV = "[data-testid='bottom-nav'], .bottom-navigation, .mobile-bottom-nav";
    static readonly MOBILE_TAB_BAR = "[data-testid='tab-bar'], .tab-bar, .mobile-tabs";
    
    // Mobile Form Selectors
    static readonly MOBILE_FORM_CONTAINER = "[data-testid='mobile-form'], .mobile-form-container, .form-mobile";
    static readonly MOBILE_INPUT_GROUP = "[data-testid='mobile-input-group'], .mobile-input-group, .input-group-mobile";
    static readonly MOBILE_FLOATING_LABEL = "[data-testid='floating-label'], .floating-label, .form-floating";
    static readonly MOBILE_KEYBOARD_TOOLBAR = "[data-testid='keyboard-toolbar'], .keyboard-toolbar, .input-toolbar";
    
    // Mobile List and Card Selectors
    static readonly MOBILE_CARD_CONTAINER = "[data-testid='mobile-card'], .mobile-card, .card-mobile";
    static readonly MOBILE_LIST_ITEM = "[data-testid='mobile-list-item'], .mobile-list-item, .list-item-mobile";
    static readonly MOBILE_SWIPE_ACTIONS = "[data-testid='swipe-actions'], .swipe-actions, .mobile-actions";
    static readonly MOBILE_PULL_TO_REFRESH = "[data-testid='pull-refresh'], .pull-to-refresh, .refresh-trigger";
    static readonly MOBILE_INFINITE_SCROLL = "[data-testid='infinite-scroll'], .infinite-scroll, .load-more-trigger";
    
    // Mobile Modal and Dialog Selectors
    static readonly MOBILE_MODAL_CONTAINER = "[data-testid='mobile-modal'], .mobile-modal, .modal-mobile";
    static readonly MOBILE_BOTTOM_SHEET = "[data-testid='bottom-sheet'], .bottom-sheet, .mobile-drawer";
    static readonly MOBILE_ACTION_SHEET = "[data-testid='action-sheet'], .action-sheet, .mobile-actions-menu";
    static readonly MOBILE_TOAST_NOTIFICATION = "[data-testid='mobile-toast'], .mobile-toast, .toast-mobile";
    
    // Mobile Touch Interaction Selectors
    static readonly MOBILE_TOUCH_TARGET = "[data-testid='touch-target'], .touch-target, .mobile-clickable";
    static readonly MOBILE_DRAG_HANDLE = "[data-testid='drag-handle'], .drag-handle, .mobile-drag";
    static readonly MOBILE_SWIPE_CONTAINER = "[data-testid='swipe-container'], .swipe-container, .swipeable";
    static readonly MOBILE_PINCH_ZOOM_CONTAINER = "[data-testid='pinch-zoom'], .pinch-zoom, .zoomable";
    
    // Mobile-Specific Feature Selectors
    static readonly MOBILE_CAMERA_BUTTON = "[data-testid='camera-btn'], .camera-btn, .mobile-camera";
    static readonly MOBILE_GPS_BUTTON = "[data-testid='gps-btn'], .gps-btn, .location-btn";
    static readonly MOBILE_PHONE_LINK = "[data-testid='phone-link'], .phone-link, .tel-link";
    static readonly MOBILE_EMAIL_LINK = "[data-testid='email-link'], .email-link, .mailto-link";
    static readonly MOBILE_SHARE_BUTTON = "[data-testid='mobile-share'], .mobile-share, .share-native";
    
    // Mobile Performance and Loading Selectors
    static readonly MOBILE_LOADING_SPINNER = "[data-testid='mobile-loading'], .mobile-loading, .spinner-mobile";
    static readonly MOBILE_SKELETON_LOADER = "[data-testid='skeleton-loader'], .skeleton-loader, .loading-skeleton";
    static readonly MOBILE_LAZY_IMAGE = "[data-testid='lazy-image'], .lazy-image, .img-lazy";
    static readonly MOBILE_OFFLINE_INDICATOR = "[data-testid='offline-indicator'], .offline-indicator, .connection-status";

    // ===== RESPONSIVE IMAGE CONSTANTS =====
    static readonly MOBILE_IMAGE_QUALITY = 0.8;
    static readonly TABLET_IMAGE_QUALITY = 0.9;
    static readonly DESKTOP_IMAGE_QUALITY = 1.0;
    static readonly LAZY_LOAD_THRESHOLD = "200px";

    // ===== MOBILE ACCESSIBILITY CONSTANTS =====
    static readonly MOBILE_MIN_TOUCH_TARGET = 44; // pixels
    static readonly MOBILE_RECOMMENDED_TOUCH_TARGET = 48; // pixels
    static readonly MOBILE_FOCUS_OUTLINE_WIDTH = 2; // pixels
    static readonly MOBILE_TEXT_CONTRAST_RATIO = 4.5;
}