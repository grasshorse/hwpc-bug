/**
 * ApplicationReadinessDetector Tests
 * 
 * Tests for the ApplicationReadinessDetector class to ensure proper functionality
 * of navigation-specific readiness detection.
 */

import { describe, test, expect, vi } from 'vitest';
import { ApplicationReadinessDetector, NavigationReadinessConfig } from './ApplicationReadinessDetector';

// Mock Page interface for testing
interface MockPage {
  evaluate: (fn: (config: any) => any, config?: any) => Promise<any>;
  viewportSize?: () => Promise<{ width: number; height: number }>;
}

describe('ApplicationReadinessDetector - Navigation Readiness', () => {
  
  test('should detect navigation elements correctly', async () => {
    const mockPage = {
      evaluate: vi.fn().mockImplementation((fn, config) => {
        // Mock DOM with navigation elements
        const mockDocument = {
          querySelectorAll: vi.fn((selector: string) => {
            if (selector === 'nav') {
              return [{
                offsetParent: {},
                hidden: false,
                children: [{ tagName: 'A' }],
                textContent: 'Home About Contact',
                querySelector: vi.fn(() => ({ tagName: 'UL' })),
                querySelectorAll: vi.fn(() => [
                  { tagName: 'A', getAttribute: () => '/home' },
                  { tagName: 'A', getAttribute: () => '/about' }
                ])
              }];
            }
            return [];
          }),
          querySelector: vi.fn((selector: string) => {
            if (selector === 'nav') {
              return {
                offsetParent: {},
                hidden: false,
                children: [{ tagName: 'A' }],
                textContent: 'Home About Contact',
                querySelector: vi.fn(() => ({ tagName: 'UL' })),
                querySelectorAll: vi.fn(() => [
                  { tagName: 'A', getAttribute: () => '/home' },
                  { tagName: 'A', getAttribute: () => '/about' }
                ])
              };
            }
            return null;
          })
        };

        // Mock window and getComputedStyle
        const mockWindow = {
          innerWidth: 1200,
          innerHeight: 800
        };

        const mockGetComputedStyle = vi.fn(() => ({
          display: 'block',
          visibility: 'visible'
        }));

        // Execute the function with mocked globals
        return fn.call({
          document: mockDocument,
          window: mockWindow,
          getComputedStyle: mockGetComputedStyle
        }, config);
      })
    } as MockPage;

    const detector = new ApplicationReadinessDetector(mockPage as any);
    
    const config: NavigationReadinessConfig = {
      navigationSelectors: ['nav'],
      interactivityRequired: true,
      responsiveCheck: false,
      timeout: 1000
    };

    const result = await detector.waitForNavigationReadiness(config);
    
    expect(result.isReady).toBe(true);
    expect(result.foundNavigationElements).toBe(1);
    expect(result.interactiveElements).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
  });

  test('should detect mobile navigation correctly', async () => {
    const mockPage = {
      evaluate: vi.fn().mockImplementation((fn, config) => {
        // Mock mobile viewport and mobile navigation
        const mockDocument = {
          querySelectorAll: vi.fn((selector: string) => {
            if (selector === 'nav') {
              return [{
                offsetParent: {},
                hidden: false,
                children: [{ tagName: 'A' }],
                textContent: 'Home About Contact'
              }];
            }
            if (selector === '.mobile-nav') {
              return [{
                offsetParent: {},
                hidden: false,
                querySelector: vi.fn(() => ({ tagName: 'BUTTON' }))
              }];
            }
            if (selector.includes('hamburger') || selector.includes('menu-toggle')) {
              return [{
                offsetParent: {},
                hidden: false,
                tagName: 'BUTTON',
                hasAttribute: () => true,
                getAttribute: () => 'button'
              }];
            }
            return [];
          }),
          querySelector: vi.fn((selector: string) => {
            if (selector === '.mobile-nav') {
              return {
                offsetParent: {},
                hidden: false
              };
            }
            if (selector.includes('hamburger')) {
              return {
                offsetParent: {},
                hidden: false,
                tagName: 'BUTTON'
              };
            }
            return null;
          })
        };

        const mockWindow = {
          innerWidth: 600, // Mobile viewport
          innerHeight: 800
        };

        const mockGetComputedStyle = vi.fn(() => ({
          display: 'block',
          visibility: 'visible'
        }));

        return fn.call({
          document: mockDocument,
          window: mockWindow,
          getComputedStyle: mockGetComputedStyle
        }, config);
      })
    } as MockPage;

    const detector = new ApplicationReadinessDetector(mockPage as any);
    
    const config: NavigationReadinessConfig = {
      navigationSelectors: ['nav'],
      mobileNavigationSelectors: ['.mobile-nav'],
      interactivityRequired: true,
      responsiveCheck: true,
      timeout: 1000
    };

    const result = await detector.waitForNavigationReadiness(config);
    
    expect(result.isReady).toBe(true);
    expect(result.mobileNavigationReady).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should fail when required navigation elements are missing', async () => {
    const mockPage = {
      evaluate: vi.fn().mockImplementation((fn, config) => {
        // Mock DOM without navigation elements
        const mockDocument = {
          querySelectorAll: vi.fn(() => []), // No elements found
          querySelector: vi.fn(() => null)   // No elements found
        };

        const mockWindow = {
          innerWidth: 1200,
          innerHeight: 800
        };

        const mockGetComputedStyle = vi.fn(() => ({
          display: 'none',
          visibility: 'hidden'
        }));

        return fn.call({
          document: mockDocument,
          window: mockWindow,
          getComputedStyle: mockGetComputedStyle
        }, config);
      })
    } as MockPage;

    const detector = new ApplicationReadinessDetector(mockPage as any);
    
    const config: NavigationReadinessConfig = {
      navigationSelectors: ['nav'],
      interactivityRequired: true,
      responsiveCheck: false,
      timeout: 100 // Short timeout for quick test
    };

    await expect(detector.waitForNavigationReadiness(config)).rejects.toThrow(/Navigation readiness timeout/);
  });

  test('should validate interactive elements correctly', async () => {
    const mockPage = {
      evaluate: vi.fn().mockImplementation((fn, config) => {
        const mockDocument = {
          querySelectorAll: vi.fn((selector: string) => {
            if (selector === 'nav') {
              return [{
                offsetParent: {},
                hidden: false,
                children: [{ tagName: 'A' }],
                textContent: 'Home About Contact',
                querySelectorAll: vi.fn((interactiveSelector: string) => {
                  if (interactiveSelector.includes('a, button')) {
                    return [
                      {
                        tagName: 'A',
                        offsetParent: {},
                        hidden: false,
                        hasAttribute: (attr: string) => attr === 'href',
                        getAttribute: (attr: string) => attr === 'href' ? '/home' : null
                      },
                      {
                        tagName: 'BUTTON',
                        offsetParent: {},
                        hidden: false,
                        hasAttribute: () => false,
                        getAttribute: () => null
                      }
                    ];
                  }
                  return [];
                })
              }];
            }
            return [];
          }),
          querySelector: vi.fn(() => null)
        };

        const mockWindow = {
          innerWidth: 1200,
          innerHeight: 800
        };

        const mockGetComputedStyle = vi.fn(() => ({
          display: 'block',
          visibility: 'visible'
        }));

        return fn.call({
          document: mockDocument,
          window: mockWindow,
          getComputedStyle: mockGetComputedStyle
        }, config);
      })
    } as MockPage;

    const detector = new ApplicationReadinessDetector(mockPage as any);
    
    const config: NavigationReadinessConfig = {
      navigationSelectors: ['nav'],
      interactivityRequired: true,
      validateLinkTargets: true,
      responsiveCheck: false,
      timeout: 1000
    };

    const result = await detector.waitForNavigationReadiness(config);
    
    expect(result.isReady).toBe(true);
    expect(result.interactiveElements).toBe(2); // 1 link + 1 button
    expect(result.validLinks).toBe(2); // Both should be valid
  });

  test('should handle backward compatibility with simple method', async () => {
    const mockPage = {
      evaluate: vi.fn().mockImplementation((fn, config) => {
        const mockDocument = {
          querySelectorAll: vi.fn((selector: string) => {
            if (selector === 'nav') {
              return [{
                offsetParent: {},
                hidden: false,
                children: [{ tagName: 'A' }],
                textContent: 'Home About Contact',
                querySelector: vi.fn(() => ({ tagName: 'UL' })),
                querySelectorAll: vi.fn(() => [
                  { tagName: 'A', getAttribute: () => '/home' }
                ])
              }];
            }
            return [];
          }),
          querySelector: vi.fn(() => null)
        };

        const mockWindow = {
          innerWidth: 1200,
          innerHeight: 800
        };

        const mockGetComputedStyle = vi.fn(() => ({
          display: 'block',
          visibility: 'visible'
        }));

        return fn.call({
          document: mockDocument,
          window: mockWindow,
          getComputedStyle: mockGetComputedStyle
        }, config);
      })
    } as MockPage;

    const detector = new ApplicationReadinessDetector(mockPage as any);
    
    // Test the simple backward-compatible method
    await expect(detector.waitForNavigationReadinessSimple()).resolves.not.toThrow();
  });
});