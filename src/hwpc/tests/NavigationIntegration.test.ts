import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestModeDetector } from '../../support/testing/TestModeDetector';
import { TestMode, TestContext } from '../../support/testing/types';

/**
 * Integration test suite for dual-mode navigation functionality
 * Validates that the mode detection and test execution works correctly
 */
describe('Navigation Integration Tests', () => {
    let modeDetector: TestModeDetector;

    beforeEach(() => {
        modeDetector = new TestModeDetector();
    });

    afterEach(() => {
        // Clean up environment variables
        delete process.env.TEST_MODE;
        delete process.env.NODE_ENV;
    });

    describe('Mode Detection Integration', () => {
        it('should detect isolated mode from @isolated tag', () => {
            // Clear any environment variables that might interfere
            delete process.env.TEST_MODE;
            delete process.env.NODE_ENV;
            
            const testContext: TestContext = {
                testName: 'Navigate to main pages with responsive validation (Isolated Mode)',
                tags: ['@isolated'],
                testId: 'test-1'
            };

            const result = modeDetector.detectMode(testContext);
            console.log('Debug - Mode detection result:', result);
            expect(result.mode).toBe(TestMode.ISOLATED);
            expect(result.confidence).toBeGreaterThan(0.8);
            expect(result.source).toBe('tags');
        });

        it('should detect production mode from @production tag', () => {
            const testContext: TestContext = {
                testName: 'Navigate to main pages with responsive validation (Production Mode)',
                tags: ['@navigation', '@responsive', '@regression', '@sanity', '@production'],
                testId: 'test-2'
            };

            const result = modeDetector.detectMode(testContext);
            expect(result.mode).toBe(TestMode.PRODUCTION);
            expect(result.confidence).toBeGreaterThan(0.8);
            expect(result.source).toBe('tags');
        });

        it('should detect dual mode from @dual tag', () => {
            const testContext: TestContext = {
                testName: 'Navigate to main pages with dual-mode validation',
                tags: ['@navigation', '@responsive', '@dual'],
                testId: 'test-3'
            };

            const result = modeDetector.detectMode(testContext);
            expect(result.mode).toBe(TestMode.DUAL);
            expect(result.confidence).toBeGreaterThan(0.8);
            expect(result.source).toBe('tags');
        });

        it('should detect mode from environment variable', () => {
            process.env.TEST_MODE = 'production';

            const testContext: TestContext = {
                testName: 'Test without mode tags',
                tags: ['@navigation'],
                testId: 'test-4'
            };

            const result = modeDetector.detectMode(testContext);
            expect(result.mode).toBe(TestMode.PRODUCTION);
            expect(result.confidence).toBe(1.0);
            expect(result.source).toBe('environment');
        });

        it('should fall back to isolated mode when no mode specified', () => {
            const testContext: TestContext = {
                testName: 'Test without mode indicators',
                tags: ['@navigation'],
                testId: 'test-5'
            };

            const result = modeDetector.detectMode(testContext);
            expect(result.mode).toBe(TestMode.ISOLATED);
            expect(result.fallbackReason).toBeDefined();
        });
    });

    describe('Test Definition Creation', () => {
        it('should create test definition with isolated mode support', () => {
            const testDef = modeDetector.createTestDefinition(
                'Navigation Test',
                ['@navigation', '@isolated'],
                ['6.1', '6.2']
            );

            expect(testDef.name).toBe('Navigation Test');
            expect(testDef.supportedModes).toContain(TestMode.ISOLATED);
            expect(testDef.requirements).toEqual(['6.1', '6.2']);
        });

        it('should create test definition with production mode support', () => {
            const testDef = modeDetector.createTestDefinition(
                'Navigation Test',
                ['@navigation', '@production'],
                ['6.1', '6.2', '6.3']
            );

            expect(testDef.name).toBe('Navigation Test');
            expect(testDef.supportedModes).toContain(TestMode.PRODUCTION);
            expect(testDef.requirements).toEqual(['6.1', '6.2', '6.3']);
        });

        it('should create test definition with dual mode support', () => {
            const testDef = modeDetector.createTestDefinition(
                'Navigation Test',
                ['@navigation', '@dual'],
                ['6.1', '6.2', '6.3', '4.1']
            );

            expect(testDef.name).toBe('Navigation Test');
            expect(testDef.supportedModes).toContain(TestMode.DUAL);
            expect(testDef.requirements).toEqual(['6.1', '6.2', '6.3', '4.1']);
        });

        it('should default to dual mode support when no explicit mode tags', () => {
            const testDef = modeDetector.createTestDefinition(
                'Navigation Test',
                ['@navigation', '@responsive'],
                ['6.1']
            );

            expect(testDef.supportedModes).toContain(TestMode.DUAL);
        });
    });

    describe('Mode Compatibility Validation', () => {
        it('should validate compatible mode and test definition', () => {
            const testDef = modeDetector.createTestDefinition(
                'Navigation Test',
                ['@navigation', '@isolated'],
                ['6.1']
            );

            const isCompatible = modeDetector.validateModeCompatibility(TestMode.ISOLATED, testDef);
            expect(isCompatible).toBe(true);
        });

        it('should reject incompatible mode and test definition', () => {
            const testDef = modeDetector.createTestDefinition(
                'Navigation Test',
                ['@navigation', '@isolated'],
                ['6.1']
            );

            const isCompatible = modeDetector.validateModeCompatibility(TestMode.PRODUCTION, testDef);
            expect(isCompatible).toBe(false);
        });

        it('should accept any mode for dual-mode tests', () => {
            const testDef = modeDetector.createTestDefinition(
                'Navigation Test',
                ['@navigation', '@dual'],
                ['6.1']
            );

            expect(modeDetector.validateModeCompatibility(TestMode.ISOLATED, testDef)).toBe(true);
            expect(modeDetector.validateModeCompatibility(TestMode.PRODUCTION, testDef)).toBe(true);
            expect(modeDetector.validateModeCompatibility(TestMode.DUAL, testDef)).toBe(true);
        });
    });

    describe('Feature File Tag Analysis', () => {
        it('should correctly analyze isolated mode scenarios', () => {
            const scenarios = [
                {
                    name: 'Navigate to main pages with responsive validation (Isolated Mode)',
                    tags: ['@navigation', '@responsive', '@regression', '@sanity', '@isolated']
                },
                {
                    name: 'Mobile navigation via mobile menu (Isolated Mode)',
                    tags: ['@navigation', '@mobile', '@responsive', '@isolated']
                }
            ];

            scenarios.forEach(scenario => {
                const testContext: TestContext = {
                    testName: scenario.name,
                    tags: scenario.tags,
                    testId: `test-${scenario.name}`
                };

                const result = modeDetector.detectMode(testContext);
                expect(result.mode).toBe(TestMode.ISOLATED);
            });
        });

        it('should correctly analyze production mode scenarios', () => {
            const scenarios = [
                {
                    name: 'Navigate to main pages with responsive validation (Production Mode)',
                    tags: ['@navigation', '@responsive', '@regression', '@sanity', '@production']
                },
                {
                    name: 'Mobile navigation via mobile menu (Production Mode)',
                    tags: ['@navigation', '@mobile', '@responsive', '@production']
                }
            ];

            scenarios.forEach(scenario => {
                const testContext: TestContext = {
                    testName: scenario.name,
                    tags: scenario.tags,
                    testId: `test-${scenario.name}`
                };

                const result = modeDetector.detectMode(testContext);
                expect(result.mode).toBe(TestMode.PRODUCTION);
            });
        });

        it('should correctly analyze dual mode scenarios', () => {
            const scenarios = [
                {
                    name: 'Navigate to main pages with dual-mode validation',
                    tags: ['@navigation', '@responsive', '@dual']
                },
                {
                    name: 'Cross-viewport navigation responsiveness',
                    tags: ['@navigation', '@responsive', '@cross-viewport', '@dual']
                },
                {
                    name: 'Navigation error recovery',
                    tags: ['@navigation', '@error-handling', '@dual']
                },
                {
                    name: 'Navigation accessibility validation',
                    tags: ['@navigation', '@accessibility', '@dual']
                }
            ];

            scenarios.forEach(scenario => {
                const testContext: TestContext = {
                    testName: scenario.name,
                    tags: scenario.tags,
                    testId: `test-${scenario.name}`
                };

                const result = modeDetector.detectMode(testContext);
                expect(result.mode).toBe(TestMode.DUAL);
            });
        });
    });
});