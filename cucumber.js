require('dotenv').config({
    path: process.env.TEST_ENV ? `.env.${process.env.TEST_ENV}` : '.env',
    override: process.env.TEST_ENV ? true : false,
});

// Load mode-specific environment configuration
if (process.env.TEST_MODE) {
    require('dotenv').config({
        path: `.env.${process.env.TEST_MODE}`,
        override: true,
    });
}

require('fs-extra').ensureDir('./test-results/reports');
require('fs-extra').remove('./test-results/screenshots');
require('fs-extra').remove('./test-results/videos');

// Base options for all configurations
const baseOptions = [
    '--require-module ts-node/register',
    '--require **/steps/*.ts',
    '--require ./src/support/config/hooks.ts',
    '--format summary',
    '--format rerun:@rerun.txt',
    '--format json:./test-results/reports/cucumber.json',
    '--publish-quiet true',
    `--parallel=${process.env.PARALLEL_THREAD}`,
    `--format-options '{"snippetInterface":"async-await"}'`,
    `--retry=${process.env.RETRIES}`,
];

// Mode-specific tag configurations
const getModeSpecificTags = (mode) => {
    switch (mode) {
        case 'isolated':
            return 'not @ignore and (@isolated or @dual)';
        case 'production':
            return 'not @ignore and (@production or @dual)';
        case 'dual':
            return 'not @ignore and @dual';
        default:
            return 'not @ignore';
    }
};

let options = [
    ...baseOptions,
    `--tags "${getModeSpecificTags()}"`,
].join(' ');

// Base compiled options
const baseCompiledOptions = [
    '--require ./dist/**/steps/*.js',
    '--require ./dist/src/support/config/hooks.js',
    '--format summary',
    '--format rerun:@rerun.txt',
    '--format json:./test-results/reports/cucumber.json',
    '--publish-quiet true',
    `--parallel=${process.env.PARALLEL_THREAD}`,
    `--format-options '{"snippetInterface":"async-await"}'`,
    `--retry=${process.env.RETRIES}`,
];

let compiledOptions = [
    ...baseCompiledOptions,
    `--tags "${getModeSpecificTags()}"`,
].join(' ');

// Mode-specific configurations
const createModeConfig = (mode) => {
    const modeOptions = [
        ...baseOptions,
        `--tags "${getModeSpecificTags(mode)}"`,
    ].join(' ');
    
    const modeCompiledOptions = [
        ...baseCompiledOptions,
        `--tags "${getModeSpecificTags(mode)}"`,
    ].join(' ');
    
    return {
        runner: ['./features/', modeOptions].join(' '),
        compiled: ['./features/', modeCompiledOptions].join(' '),
        rerun: ['@rerun.txt', modeOptions].join(' '),
    };
};

// Default configurations
let runner = [
    './features/',
    options,
].join(' ');

let compiled = [
    './features/',
    compiledOptions,
].join(' ');

let rerun = [
    '@rerun.txt',
    options,
].join(' ');

// Mode-specific configurations
const isolated = createModeConfig('isolated');
const production = createModeConfig('production');
const dual = createModeConfig('dual');

module.exports = { 
    runner, 
    compiled, 
    rerun,
    isolated: isolated.runner,
    production: production.runner,
    dual: dual.runner
}
