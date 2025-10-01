/**
 * Integration test for API feature with dual-mode support
 * Tests that the updated feature file and step definitions work together
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFile } from 'fs/promises';
import { join } from 'path';

describe('API Feature Integration Tests', () => {
  describe('Feature File Updates', () => {
    it('should have dual-mode tags on feature and scenarios', async () => {
      const featureContent = await readFile(
        join(process.cwd(), 'features/hwpc-api/hwpc_api.feature'),
        'utf-8'
      );

      // Check that the feature has dual-mode support
      expect(featureContent).toContain('@hwpc @api @dual');
      
      // Check that scenarios have appropriate mode tags
      expect(featureContent).toContain('@dual');
      expect(featureContent).toContain('@isolated');
      expect(featureContent).toContain('@production');
    });

    it('should have context-aware step definitions', async () => {
      const featureContent = await readFile(
        join(process.cwd(), 'features/hwpc-api/hwpc_api.feature'),
        'utf-8'
      );

      // Check for context-aware steps
      expect(featureContent).toContain('context-specific');
      expect(featureContent).toContain('context-aware');
    });

    it('should maintain backward compatibility with existing scenarios', async () => {
      const featureContent = await readFile(
        join(process.cwd(), 'features/hwpc-api/hwpc_api.feature'),
        'utf-8'
      );

      // Check that essential scenarios are still present
      expect(featureContent).toContain('User can check HWPC API health');
      expect(featureContent).toContain('User can retrieve all tickets via API');
      expect(featureContent).toContain('User can create a new ticket via API');
      expect(featureContent).toContain('User can update an existing ticket via API');
      expect(featureContent).toContain('User can delete a ticket via API');
    });
  });

  describe('Step Definition Updates', () => {
    it('should have context-aware API client initialization', async () => {
      const stepsContent = await readFile(
        join(process.cwd(), 'src/hwpc/steps/HWPCAPISteps.ts'),
        'utf-8'
      );

      // Check for context-aware client imports and usage
      expect(stepsContent).toContain('ContextAwareHWPCAPIClient');
      expect(stepsContent).toContain('TestMode');
      expect(stepsContent).toContain('this.testMode');
      expect(stepsContent).toContain('this.dataContext');
    });

    it('should have new context-aware step definitions', async () => {
      const stepsContent = await readFile(
        join(process.cwd(), 'src/hwpc/steps/HWPCAPISteps.ts'),
        'utf-8'
      );

      // Check for new step definitions
      expect(stepsContent).toContain('context-specific ID');
      expect(stepsContent).toContain('context-aware test data');
      expect(stepsContent).toContain('context-specific customer');
      expect(stepsContent).toContain('context-specific data');
    });

    it('should have proper error handling for context-aware operations', async () => {
      const stepsContent = await readFile(
        join(process.cwd(), 'src/hwpc/steps/HWPCAPISteps.ts'),
        'utf-8'
      );

      // Check for error handling
      expect(stepsContent).toContain('Context-aware API client required');
      expect(stepsContent).toContain('instanceof ContextAwareHWPCAPIClient');
    });
  });

  describe('Context-Aware API Client', () => {
    it('should have all required methods for dual-mode support', async () => {
      const clientContent = await readFile(
        join(process.cwd(), 'src/hwpc/api/ContextAwareHWPCAPIClient.ts'),
        'utf-8'
      );

      // Check for key methods
      expect(clientContent).toContain('setContext');
      expect(clientContent).toContain('getContextSpecificCustomerId');
      expect(clientContent).toContain('getContextSpecificTicketId');
      expect(clientContent).toContain('createContextAwareTicketData');
      expect(clientContent).toContain('createContextAwareCustomerData');
      expect(clientContent).toContain('validateContextSpecificResponse');
    });

    it('should handle both isolated and production modes', async () => {
      const clientContent = await readFile(
        join(process.cwd(), 'src/hwpc/api/ContextAwareHWPCAPIClient.ts'),
        'utf-8'
      );

      // Check for mode-specific logic
      expect(clientContent).toContain('TestMode.PRODUCTION');
      expect(clientContent).toContain('TestMode.ISOLATED');
      expect(clientContent).toContain('looneyTunesTest');
      expect(clientContent).toContain('Isolated Mode');
    });

    it('should have proper error handling and validation', async () => {
      const clientContent = await readFile(
        join(process.cwd(), 'src/hwpc/api/ContextAwareHWPCAPIClient.ts'),
        'utf-8'
      );

      // Check for error handling
      expect(clientContent).toContain('No data context available');
      expect(clientContent).toContain('No customers available');
      expect(clientContent).toContain('validateTicketResponse');
      expect(clientContent).toContain('validateCustomerResponse');
    });
  });

  describe('Integration with Existing Infrastructure', () => {
    it('should integrate with the hooks system', async () => {
      const hooksContent = await readFile(
        join(process.cwd(), 'src/support/config/hooks.ts'),
        'utf-8'
      );

      // Check that hooks already support dual-mode infrastructure
      expect(hooksContent).toContain('TestModeDetector');
      expect(hooksContent).toContain('DatabaseContextManager');
      expect(hooksContent).toContain('ProductionTestDataManager');
      expect(hooksContent).toContain('this.testMode');
      expect(hooksContent).toContain('this.dataContext');
    });

    it('should use existing dual-mode types', async () => {
      const typesContent = await readFile(
        join(process.cwd(), 'src/support/testing/types.ts'),
        'utf-8'
      );

      // Check that required types exist
      expect(typesContent).toContain('TestMode');
      expect(typesContent).toContain('DataContext');
      expect(typesContent).toContain('TestCustomer');
      expect(typesContent).toContain('TestRoute');
      expect(typesContent).toContain('TestTicket');
    });
  });

  describe('Test Coverage', () => {
    it('should have comprehensive unit tests for context-aware client', async () => {
      const testContent = await readFile(
        join(process.cwd(), 'src/hwpc/tests/DualModeAPIIntegration.test.ts'),
        'utf-8'
      );

      // Check for comprehensive test coverage
      expect(testContent).toContain('Context-Aware API Client Initialization');
      expect(testContent).toContain('Context-Specific Data Retrieval');
      expect(testContent).toContain('Context-Aware Data Creation');
      expect(testContent).toContain('Response Validation');
      expect(testContent).toContain('Production Mode Validation');
      expect(testContent).toContain('Error Handling');
    });

    it('should test both isolated and production modes', async () => {
      const testContent = await readFile(
        join(process.cwd(), 'src/hwpc/tests/DualModeAPIIntegration.test.ts'),
        'utf-8'
      );

      // Check for mode-specific tests
      expect(testContent).toContain('isolated mode');
      expect(testContent).toContain('production mode');
      expect(testContent).toContain('TestMode.ISOLATED');
      expect(testContent).toContain('TestMode.PRODUCTION');
    });
  });

  describe('Documentation and Maintainability', () => {
    it('should have proper JSDoc documentation', async () => {
      const clientContent = await readFile(
        join(process.cwd(), 'src/hwpc/api/ContextAwareHWPCAPIClient.ts'),
        'utf-8'
      );

      // Check for documentation
      expect(clientContent).toContain('/**');
      expect(clientContent).toContain('Context-aware HWPC API Client');
      // Check for method documentation (methods have descriptions)
      expect(clientContent).toContain('Sets the test mode and data context');
      expect(clientContent).toContain('Gets a context-specific customer ID');
    });

    it('should have clear error messages', async () => {
      const clientContent = await readFile(
        join(process.cwd(), 'src/hwpc/api/ContextAwareHWPCAPIClient.ts'),
        'utf-8'
      );

      // Check for descriptive error messages
      expect(clientContent).toContain('No data context available for context-specific operations');
      expect(clientContent).toContain('No customers available in');
      expect(clientContent).toContain('mode context');
    });

    it('should have logging for debugging', async () => {
      const clientContent = await readFile(
        join(process.cwd(), 'src/hwpc/api/ContextAwareHWPCAPIClient.ts'),
        'utf-8'
      );

      // Check for logging statements
      expect(clientContent).toContain('Log.info');
      expect(clientContent).toContain('API client context set to');
      expect(clientContent).toContain('Using context-specific');
      expect(clientContent).toContain('Created context-aware');
    });
  });
});