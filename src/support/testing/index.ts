/**
 * Core testing mode infrastructure exports
 */

// Types and interfaces
export * from './types';

// Core classes
export { TestModeDetector } from './TestModeDetector';
export { ModeValidator } from './ModeValidator';
export { TestConfigManager, ConfigValidationError } from './TestConfigManager';

// Core test data independence infrastructure
export { TestDataFactory, BaseTestDataFactory } from './TestDataFactory';
export { TestContextManager } from './TestContextManager';
export { IsolationManager } from './IsolationManager';
export { CleanupService } from './CleanupService';
export { ProductionSafetyValidator } from './ProductionSafetyValidator';

// Data context management
export { DataContextManager, BaseDataContextManager } from './DataContextManager';
export { DatabaseContextManager } from './DatabaseContextManager';
export { ProductionTestDataManager } from './ProductionTestDataManager';
export { DataContextFactory } from './DataContextFactory';

// Data providers
export { LooneyTunesDataProvider } from './LooneyTunesDataProvider';
export { IsolatedDataProvider } from './IsolatedDataProvider';

// Test data management utilities
export { TestDataManager } from './TestDataManager';
export { SnapshotManager } from './SnapshotManager';
export { ProductionDataMaintenance } from './ProductionDataMaintenance';
export { DataIntegrityValidator } from './DataIntegrityValidator';
export { DataVersionManager } from './DataVersionManager';

// Error handling and recovery system
export * from './errors';

// Re-export commonly used types for convenience
export type {
  ValidationResult,
  FallbackResult,
  EnvironmentValidation
} from './ModeValidator';

// Test data independence types
export type {
  CustomerOptions,
  TicketOptions,
  RouteOptions,
  Assignment,
  CleanupTask,
  CleanupResult,
  CleanupError,
  TestOperation,
  SafetyValidationResult
} from './TestDataFactory';

export type {
  ExtendedTestContext,
  DataRegistry,
  TestContextManagerOptions
} from './TestContextManager';

export type {
  IsolationConfig
} from './IsolationManager';

export type {
  CleanupServiceOptions
} from './CleanupService';