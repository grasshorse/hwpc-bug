/**
 * Core types and interfaces for the dual testing architecture
 */

export enum TestMode {
  ISOLATED = 'isolated',
  PRODUCTION = 'production',
  DUAL = 'dual'
}

export interface TestContext {
  testName: string;
  tags: string[];
  testId: string;
  scenario?: any;
  feature?: any;
}

export interface TestDefinition {
  name: string;
  tags: string[];
  requirements: string[];
  supportedModes: TestMode[];
}

export interface TestConfig {
  mode: TestMode;
  databaseConfig?: DatabaseConfig;
  productionConfig?: ProductionConfig;
  tags: string[];
  retries: number;
  timeout: number;
}

export interface DatabaseConfig {
  backupPath: string;
  connectionString: string;
  restoreTimeout: number;
  verificationQueries: string[];
}

export interface ProductionConfig {
  testDataPrefix: string; // 'looneyTunesTest'
  locations: string[]; // ['Cedar Falls', 'Winfield', "O'Fallon"]
  customerNames: string[]; // Looney Tunes characters
  cleanupPolicy: 'preserve' | 'cleanup' | 'archive';
}

export interface DataContext {
  mode: TestMode;
  testData: TestDataSet;
  connectionInfo: ConnectionInfo;
  metadata: TestMetadata;
  cleanup: () => Promise<void>;
}

export interface TestDataSet {
  customers: TestCustomer[];
  routes: TestRoute[];
  tickets: TestTicket[];
  metadata: TestMetadata;
}

export interface TestCustomer {
  id: string;
  name: string; // e.g., "Bugs Bunny - looneyTunesTest"
  email: string;
  phone: string;
  isTestData: boolean;
}

export interface TestRoute {
  id: string;
  name: string;
  location: string; // Cedar Falls, Winfield, O'Fallon
  isTestData: boolean;
}

export interface TestTicket {
  id: string;
  customerId: string;
  routeId: string;
  status: string;
  isTestData: boolean;
}

export interface TestMetadata {
  createdAt: Date;
  mode: TestMode;
  version: string;
  testRunId: string;
}

export interface ConnectionInfo {
  host: string;
  port?: number;
  database: string;
  isTestConnection?: boolean;
}

export interface ModeDetectionResult {
  mode: TestMode;
  confidence: number;
  source: 'environment' | 'tags' | 'default';
  fallbackReason?: string;
}