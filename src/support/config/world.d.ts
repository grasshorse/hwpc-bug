/**
 * TypeScript declarations for extending Cucumber World with dual-mode testing support
 */

import { BrowserContext, Page } from "@playwright/test";
import UIActions from "../playwright/actions/UIActions";
import RESTRequest from "../playwright/API/RESTRequest";
import SOAPRequest from "../playwright/API/SOAPRequest";
import { TestMode, TestConfig, DataContext } from "../testing/types";

declare module "@cucumber/cucumber" {
  interface World {
    // Existing Playwright properties
    context?: BrowserContext;
    page?: Page;
    web?: UIActions;
    rest?: RESTRequest;
    soap?: SOAPRequest;
    
    // New dual-mode testing properties
    testMode?: TestMode;
    dataContext?: DataContext;
    testConfig?: TestConfig;
  }
}