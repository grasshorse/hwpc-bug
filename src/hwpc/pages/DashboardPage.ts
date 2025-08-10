import UIActions from "../../support/playwright/actions/UIActions";
import NavigationPage from "./NavigationPage";
import NavigationConstants from "../constants/NavigationConstants";

/**
 * DashboardPage - Page object for dashboard navigation and widget responsiveness validation
 * Extends NavigationPage with dashboard-specific functionality and mobile-optimized widget interactions
 */
export default class DashboardPage extends NavigationPage {
    
    // Dashboard-specific selectors
    private readonly DASHBOARD_CONTAINER = "[data-testid='dashboard-container'], .dashboard-container, .dashboard-widgets, .dashboard-main";
    private readonly WIDGET_CONTAINER = "[data-testid='widget'], .widget, .dashboard-widget, .widget-container";
    private readonly WIDGET_HEADER = "[data-testid='widget-header'], .widget-header, .widget-title";
    private readonly WIDGET_CONTENT = "[data-testid='widget-content'], .widget-content, .widget-body";
    private readonly WIDGET_ACTIONS = "[data-testid='widget-actions'], .widget-actions, .widget-controls";
    
    // Mobile-specific dashboard selectors
    private readonly MOBILE_DASHBOARD_CARD = "[data-testid='mobile-dashboard-card'], .mobile-dashboard-card, .dashboard-mobile";
    private readonly MOBILE_WIDGET_TOGGLE = "[data-testid='mobile-widget-toggle'], .mobile-widget-toggle, .widget-toggle-mobile";
    private readonly MOBILE_DASHBOARD_MENU = "[data-testid='mobile-dashboard-menu'], .mobile-dashboard-menu, .dashboard-menu-mobile";
    private readonly MOBILE_QUICK_ACTIONS = "[data-testid='mobile-quick-actions'], .mobile-quick-actions, .quick-actions-mobile";
    
    // Widget types selectors
    private readonly CHART_WIDGET = "[data-testid='chart-widget'], .chart-widget, .widget-chart";
    private readonly STATS_WIDGET = "[data-testid='stats-widget'], .stats-widget, .widget-stats";
    private readonly LIST_WIDGET = "[data-testid='list-widget'], .list-widget, .widget-list";
    private readonly CALENDAR_WIDGET = "[data-testid='calendar-widget'], .calendar-widget, .widget-calendar";
    private readonly MAP_WIDGET = "[data-testid='map-widget'], .map-widget, .widget-map";
    
    // Quick actions selectors
    private readonly QUICK_ACTIONS_CONTAINER = "[data-testid='quick-actions'], .quick-actions, .dashboard-actions";
    private readonly CREATE_TICKET_ACTION = "[data-testid='create-ticket'], .create-ticket, .btn-create-ticket";
    private readonly VIEW_REPORTS_ACTION = "[data-testid='view-reports'], .view-reports, .btn-view-reports";
    private readonly MANAGE_ROUTES_ACTION = "[data-testid='manage-routes'], .manage-routes, .btn-manage-routes";
    
    // Dashboard customization selectors
    private readonly CUSTOMIZE_DASHBOARD_BUTTON = "[data-testid='customize-dashboard'], .customize-dashboard, .btn-customize";
    private readonly WIDGET_SETTINGS = "[data-testid='widget-settings'], .widget-settings, .widget-config";
    private readonly ADD_WIDGET_BUTTON = "[data-testid='add-widget'], .add-widget, .btn-add-widget";
    
    constructor(web: UIActions) {
        super(web);
    }

    /**
     * Initialize the dashboard page with dashboard-specific validation
     */
    public async initialize(): Promise<void> {
        try {
            console.log("Initializing DashboardPage...");
            
            // Call parent initialization
            await super.initialize();
            
            // Verify dashboard-specific elements
            await this.validateDashboardPageElements();
            
            console.log("DashboardPage initialized successfully");
            
        } catch (error) {
            console.log(`DashboardPage initialization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate dashboard page elements are present and responsive
     */
    public async validatePageElements(): Promise<void> {
        try {
            await this.validateDashboardPageElements();
        } catch (error) {
            console.log(`Dashboard page element validation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate dashboard-specific page elements
     */
    private async validateDashboardPageElements(): Promise<void> {
        try {
            console.log("Validating dashboard page elements...");
            
            // Verify dashboard container
            const isDashboardVisible = await this.web.element(this.DASHBOARD_CONTAINER, "Dashboard Container").isVisible(3);
            if (!isDashboardVisible) {
                console.log("Warning: Dashboard container not found");
            }
            
            // Verify search interface
            const searchSelector = NavigationConstants.getSearchInterfaceSelector('dashboard', this.isMobile);
            const isSearchVisible = await this.web.element(searchSelector, "Dashboard Search Interface").isVisible(3);
            if (!isSearchVisible) {
                console.log("Warning: Dashboard search interface not found");
            }
            
            // Verify widgets are present
            const widgetCount = await this.page.locator(this.WIDGET_CONTAINER).count();
            if (widgetCount > 0) {
                console.log(`Found ${widgetCount} dashboard widgets`);
            } else {
                console.log("Warning: No dashboard widgets found");
            }
            
            // Verify mobile-specific elements if on mobile
            if (this.isMobile) {
                await this.validateMobileDashboardElements();
            }
            
            console.log("Dashboard page elements validated successfully");
            
        } catch (error) {
            console.log(`Dashboard page element validation failed: ${error.message}`);
        }
    }

    /**
     * Validate mobile-specific dashboard elements
     */
    private async validateMobileDashboardElements(): Promise<void> {
        try {
            console.log("Validating mobile dashboard elements...");
            
            // Check for mobile dashboard cards
            const isMobileCardVisible = await this.web.element(this.MOBILE_DASHBOARD_CARD, "Mobile Dashboard Card").isVisible(2);
            if (isMobileCardVisible) {
                console.log("Mobile dashboard cards found");
            }
            
            // Check for mobile widget toggle
            const isWidgetToggleVisible = await this.web.element(this.MOBILE_WIDGET_TOGGLE, "Mobile Widget Toggle").isVisible(2);
            if (isWidgetToggleVisible) {
                console.log("Mobile widget toggle found");
            }
            
            // Check for mobile quick actions
            const isQuickActionsVisible = await this.web.element(this.MOBILE_QUICK_ACTIONS, "Mobile Quick Actions").isVisible(2);
            if (isQuickActionsVisible) {
                console.log("Mobile quick actions found");
            }
            
        } catch (error) {
            console.log(`Mobile dashboard element validation failed: ${error.message}`);
        }
    }

    /**
     * Perform dashboard search with mobile-optimized interface
     * @param searchTerm - The term to search for
     */
    public async searchDashboard(searchTerm: string): Promise<void> {
        try {
            console.log(`Searching dashboard with term: "${searchTerm}"`);
            
            const searchSelector = NavigationConstants.getSearchInterfaceSelector('dashboard', this.isMobile);
            const searchInput = this.web.editBox(searchSelector, "Dashboard Search Input");
            
            // Ensure search input is visible
            await searchInput.waitTillVisible();
            
            if (this.isMobile) {
                // Mobile-specific search interaction
                await this.touchFriendlyClick(searchSelector, "Dashboard Search Input");
                await this.page.waitForTimeout(500); // Wait for mobile keyboard
            }
            
            // Clear and type search term
            await searchInput.fill(searchTerm);
            
            // Submit search
            await searchInput.keyPress('Enter');
            
            // Wait for search results
            await this.waitForDashboardSearchResults();
            
            console.log(`Dashboard search completed for: "${searchTerm}"`);
            
        } catch (error) {
            console.log(`Dashboard search failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Wait for dashboard search results to load
     */
    private async waitForDashboardSearchResults(): Promise<void> {
        try {
            // Wait for loading to complete
            await this.waitForLoadingComplete();
            
            // Wait for dashboard to update
            await this.page.waitForTimeout(1000);
            
            // Verify results are displayed
            const isResultsVisible = await this.web.element(this.DASHBOARD_CONTAINER, "Dashboard Results").isVisible(3);
            if (isResultsVisible) {
                console.log("Dashboard search results loaded successfully");
            }
            
        } catch (error) {
            console.log(`Waiting for dashboard search results failed: ${error.message}`);
        }
    }

    /**
     * Verify dashboard search interface responsiveness
     */
    public async verifyDashboardSearchResponsiveness(): Promise<boolean> {
        try {
            console.log("Verifying dashboard search interface responsiveness...");
            
            const searchSelector = NavigationConstants.getSearchInterfaceSelector('dashboard', this.isMobile);
            const isSearchVisible = await this.web.element(searchSelector, "Dashboard Search").isVisible(3);
            
            if (!isSearchVisible) {
                console.log("Dashboard search interface not visible");
                return false;
            }
            
            // Verify search interface adapts to viewport
            if (this.isMobile) {
                return await this.verifyMobileDashboardSearchInterface();
            } else {
                return await this.verifyDesktopDashboardSearchInterface();
            }
            
        } catch (error) {
            console.log(`Dashboard search responsiveness verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify mobile dashboard search interface
     */
    private async verifyMobileDashboardSearchInterface(): Promise<boolean> {
        try {
            const searchSelector = NavigationConstants.getSearchInterfaceSelector('dashboard', true);
            const searchElement = this.web.element(searchSelector, "Mobile Dashboard Search");
            
            // Check if search input is touch-friendly
            const boundingBox = await searchElement.getLocator().boundingBox();
            if (boundingBox) {
                const isTouchFriendly = NavigationConstants.isTouchTargetAdequate(boundingBox.width, boundingBox.height);
                if (!isTouchFriendly) {
                    console.log("Mobile dashboard search input is not touch-friendly");
                    return false;
                }
            }
            
            console.log("Mobile dashboard search interface verified successfully");
            return true;
            
        } catch (error) {
            console.log(`Mobile dashboard search interface verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify desktop dashboard search interface
     */
    private async verifyDesktopDashboardSearchInterface(): Promise<boolean> {
        try {
            const searchSelector = NavigationConstants.getSearchInterfaceSelector('dashboard', false);
            const isSearchVisible = await this.web.element(searchSelector, "Desktop Dashboard Search").isVisible(3);
            
            if (!isSearchVisible) {
                console.log("Desktop dashboard search interface not visible");
                return false;
            }
            
            console.log("Desktop dashboard search interface verified successfully");
            return true;
            
        } catch (error) {
            console.log(`Desktop dashboard search interface verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify widget responsiveness across different viewports
     */
    public async verifyWidgetResponsiveness(): Promise<boolean> {
        try {
            console.log("Verifying widget responsiveness...");
            
            const widgetCount = await this.page.locator(this.WIDGET_CONTAINER).count();
            if (widgetCount === 0) {
                console.log("No widgets found to verify");
                return false;
            }
            
            const viewportCategory = await this.getCurrentViewportCategory();
            
            switch (viewportCategory) {
                case 'mobile':
                    return await this.verifyMobileWidgetDisplay();
                case 'tablet':
                    return await this.verifyTabletWidgetDisplay();
                case 'desktop':
                    return await this.verifyDesktopWidgetDisplay();
                default:
                    return false;
            }
            
        } catch (error) {
            console.log(`Widget responsiveness verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify mobile widget display
     */
    private async verifyMobileWidgetDisplay(): Promise<boolean> {
        try {
            console.log("Verifying mobile widget display...");
            
            // Check for mobile dashboard cards
            const mobileCards = await this.page.locator(this.MOBILE_DASHBOARD_CARD).count();
            if (mobileCards === 0) {
                console.log("No mobile dashboard cards found");
                return false;
            }
            
            // Verify first widget is touch-friendly
            const firstWidget = this.page.locator(this.WIDGET_CONTAINER).first();
            const boundingBox = await firstWidget.boundingBox();
            
            if (boundingBox) {
                const isTouchFriendly = NavigationConstants.isTouchTargetAdequate(boundingBox.width, boundingBox.height);
                if (!isTouchFriendly) {
                    console.log("Mobile widgets are not touch-friendly");
                    return false;
                }
                
                // Verify widget doesn't exceed mobile viewport width
                if (boundingBox.width > this.viewport!.width) {
                    console.log("Widget may be too wide for mobile viewport");
                    return false;
                }
            }
            
            // Check for mobile widget toggle
            const isWidgetToggleVisible = await this.web.element(this.MOBILE_WIDGET_TOGGLE, "Mobile Widget Toggle").isVisible(2);
            
            console.log("Mobile widget display verified successfully");
            return true;
            
        } catch (error) {
            console.log(`Mobile widget display verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify tablet widget display
     */
    private async verifyTabletWidgetDisplay(): Promise<boolean> {
        try {
            console.log("Verifying tablet widget display...");
            
            // Check widget layout for tablet
            const widgets = await this.page.locator(this.WIDGET_CONTAINER).count();
            if (widgets === 0) {
                console.log("No widgets found on tablet");
                return false;
            }
            
            // Verify widgets are properly sized for tablet
            const firstWidget = this.page.locator(this.WIDGET_CONTAINER).first();
            const boundingBox = await firstWidget.boundingBox();
            
            if (boundingBox && boundingBox.width < 200) {
                console.log("Widgets may be too small for tablet view");
                return false;
            }
            
            console.log("Tablet widget display verified successfully");
            return true;
            
        } catch (error) {
            console.log(`Tablet widget display verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify desktop widget display
     */
    private async verifyDesktopWidgetDisplay(): Promise<boolean> {
        try {
            console.log("Verifying desktop widget display...");
            
            // Check for widget customization options
            const isCustomizeVisible = await this.web.element(this.CUSTOMIZE_DASHBOARD_BUTTON, "Customize Dashboard").isVisible(2);
            
            // Check for widget actions
            const isActionsVisible = await this.web.element(this.WIDGET_ACTIONS, "Widget Actions").isVisible(2);
            
            console.log("Desktop widget display verified successfully");
            return true;
            
        } catch (error) {
            console.log(`Desktop widget display verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Interact with dashboard widgets
     * @param widgetIndex - Index of the widget to interact with (0-based)
     * @param action - Action to perform ('expand', 'collapse', 'refresh')
     */
    public async interactWithWidget(widgetIndex: number = 0, action: 'expand' | 'collapse' | 'refresh' = 'expand'): Promise<void> {
        try {
            console.log(`Interacting with widget ${widgetIndex} - action: ${action}`);
            
            const widgets = await this.page.locator(this.WIDGET_CONTAINER).count();
            if (widgetIndex >= widgets) {
                throw new Error(`Widget index ${widgetIndex} is out of range. Found ${widgets} widgets.`);
            }
            
            const widget = this.page.locator(this.WIDGET_CONTAINER).nth(widgetIndex);
            
            if (this.isMobile) {
                // Mobile interaction - tap widget or use toggle
                if (action === 'expand' || action === 'collapse') {
                    const isToggleVisible = await this.web.element(this.MOBILE_WIDGET_TOGGLE, "Mobile Widget Toggle").isVisible(2);
                    if (isToggleVisible) {
                        await this.touchFriendlyClick(this.MOBILE_WIDGET_TOGGLE, "Mobile Widget Toggle");
                    } else {
                        await this.touchFriendlyClick(this.WIDGET_HEADER, "Widget Header");
                    }
                }
            } else {
                // Desktop interaction - click widget header or actions
                const widgetHeader = widget.locator(this.WIDGET_HEADER);
                await widgetHeader.click();
            }
            
            // Wait for widget interaction to complete
            await this.page.waitForTimeout(300);
            
            console.log(`Widget interaction completed for widget ${widgetIndex}`);
            
        } catch (error) {
            console.log(`Widget interaction failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verify quick actions accessibility
     */
    public async verifyQuickActionsAccessibility(): Promise<boolean> {
        try {
            console.log("Verifying quick actions accessibility...");
            
            const quickActionsSelector = this.isMobile ? this.MOBILE_QUICK_ACTIONS : this.QUICK_ACTIONS_CONTAINER;
            const isQuickActionsVisible = await this.web.element(quickActionsSelector, "Quick Actions").isVisible(3);
            
            if (!isQuickActionsVisible) {
                console.log("Quick actions not visible");
                return false;
            }
            
            // Check individual quick actions
            const actions = [
                { selector: this.CREATE_TICKET_ACTION, name: "Create Ticket" },
                { selector: this.VIEW_REPORTS_ACTION, name: "View Reports" },
                { selector: this.MANAGE_ROUTES_ACTION, name: "Manage Routes" }
            ];
            
            let accessibleActions = 0;
            
            for (const action of actions) {
                const isActionVisible = await this.web.element(action.selector, action.name).isVisible(2);
                if (isActionVisible) {
                    accessibleActions++;
                    
                    // Verify touch-friendliness on mobile
                    if (this.isMobile) {
                        const actionElement = this.web.element(action.selector, action.name);
                        const boundingBox = await actionElement.getLocator().boundingBox();
                        
                        if (boundingBox) {
                            const isTouchFriendly = NavigationConstants.isTouchTargetAdequate(boundingBox.width, boundingBox.height);
                            if (!isTouchFriendly) {
                                console.log(`${action.name} is not touch-friendly`);
                                return false;
                            }
                        }
                    }
                }
            }
            
            const isAccessible = accessibleActions > 0;
            console.log(`Quick actions accessibility verified: ${accessibleActions}/${actions.length} actions accessible`);
            return isAccessible;
            
        } catch (error) {
            console.log(`Quick actions accessibility verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Use quick action with mobile-optimized interaction
     * @param actionType - Type of quick action ('create-ticket', 'view-reports', 'manage-routes')
     */
    public async useQuickAction(actionType: 'create-ticket' | 'view-reports' | 'manage-routes'): Promise<void> {
        try {
            console.log(`Using quick action: ${actionType}`);
            
            let actionSelector: string;
            let actionName: string;
            
            switch (actionType) {
                case 'create-ticket':
                    actionSelector = this.CREATE_TICKET_ACTION;
                    actionName = "Create Ticket";
                    break;
                case 'view-reports':
                    actionSelector = this.VIEW_REPORTS_ACTION;
                    actionName = "View Reports";
                    break;
                case 'manage-routes':
                    actionSelector = this.MANAGE_ROUTES_ACTION;
                    actionName = "Manage Routes";
                    break;
                default:
                    throw new Error(`Unknown quick action type: ${actionType}`);
            }
            
            const isActionVisible = await this.web.element(actionSelector, actionName).isVisible(3);
            if (!isActionVisible) {
                throw new Error(`Quick action ${actionName} not found`);
            }
            
            if (this.isMobile) {
                await this.touchFriendlyClick(actionSelector, actionName);
            } else {
                await this.web.element(actionSelector, actionName).click();
            }
            
            // Wait for action to complete
            await this.page.waitForTimeout(1000);
            
            console.log(`Quick action ${actionName} completed successfully`);
            
        } catch (error) {
            console.log(`Quick action failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get widget count from the dashboard
     */
    public async getWidgetCount(): Promise<number> {
        try {
            const widgetCount = await this.page.locator(this.WIDGET_CONTAINER).count();
            console.log(`Found ${widgetCount} widgets on the dashboard`);
            return widgetCount;
            
        } catch (error) {
            console.log(`Getting widget count failed: ${error.message}`);
            return 0;
        }
    }

    /**
     * Verify dashboard navigation responsiveness
     */
    public async verifyDashboardNavigationResponsiveness(): Promise<boolean> {
        try {
            console.log("Verifying dashboard navigation responsiveness...");
            
            const viewportCategory = await this.getCurrentViewportCategory();
            
            // Verify navigation adapts to viewport
            if (this.isMobile) {
                // Check for mobile dashboard menu
                const isMobileMenuVisible = await this.web.element(this.MOBILE_DASHBOARD_MENU, "Mobile Dashboard Menu").isVisible(2);
                if (!isMobileMenuVisible) {
                    console.log("Mobile dashboard menu not found");
                    return false;
                }
            }
            
            // Verify quick actions are accessible
            const areQuickActionsAccessible = await this.verifyQuickActionsAccessibility();
            if (!areQuickActionsAccessible) {
                console.log("Quick actions are not accessible");
                return false;
            }
            
            console.log("Dashboard navigation responsiveness verified successfully");
            return true;
            
        } catch (error) {
            console.log(`Dashboard navigation responsiveness verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify widget content loads correctly
     * @param widgetType - Type of widget to verify ('chart', 'stats', 'list', 'calendar', 'map')
     */
    public async verifyWidgetContent(widgetType: 'chart' | 'stats' | 'list' | 'calendar' | 'map'): Promise<boolean> {
        try {
            console.log(`Verifying ${widgetType} widget content...`);
            
            let widgetSelector: string;
            
            switch (widgetType) {
                case 'chart':
                    widgetSelector = this.CHART_WIDGET;
                    break;
                case 'stats':
                    widgetSelector = this.STATS_WIDGET;
                    break;
                case 'list':
                    widgetSelector = this.LIST_WIDGET;
                    break;
                case 'calendar':
                    widgetSelector = this.CALENDAR_WIDGET;
                    break;
                case 'map':
                    widgetSelector = this.MAP_WIDGET;
                    break;
                default:
                    throw new Error(`Unknown widget type: ${widgetType}`);
            }
            
            const isWidgetVisible = await this.web.element(widgetSelector, `${widgetType} Widget`).isVisible(5);
            if (!isWidgetVisible) {
                console.log(`${widgetType} widget not found`);
                return false;
            }
            
            // Verify widget content is present
            const widgetContent = this.page.locator(widgetSelector).locator(this.WIDGET_CONTENT);
            const isContentVisible = await widgetContent.isVisible();
            
            if (!isContentVisible) {
                console.log(`${widgetType} widget content not visible`);
                return false;
            }
            
            console.log(`${widgetType} widget content verified successfully`);
            return true;
            
        } catch (error) {
            console.log(`${widgetType} widget content verification failed: ${error.message}`);
            return false;
        }
    }
}