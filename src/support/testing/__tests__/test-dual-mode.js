// Simple test configuration for dual-mode testing
const options = [
    '--require-module ts-node/register',
    '--require ./src/support/testing/__tests__/DualModeTestSteps.ts',
    '--require ./src/support/config/hooks.ts',
    '--format summary',
    '--format json:./test-results/reports/dual-mode-test.json',
    '--publish-quiet true',
    '--parallel=1',
    '--format-options \'{"snippetInterface":"async-await"}\'',
    '--retry=0',
    '--tags "@dual-mode-test"',
].join(' ');

const runner = [
    './src/support/testing/__tests__/dual-mode-test.feature',
    options,
].join(' ');

module.exports = { runner };