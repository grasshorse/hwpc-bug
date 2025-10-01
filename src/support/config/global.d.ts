/**
 * Global type declarations for dual-mode testing
 */

declare global {
  interface Window {
    __TEST_CONTEXT__?: {
      mode: string;
      testId: string;
      testRunId: string;
      hasTestData: boolean;
    };
  }
}

export {};