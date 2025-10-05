# hwpc-bug
hwpc site debugging with Playwright and Cucumber

# WIP
- 2025.08.10 cat 
```sh
npm test
```
```
17 scenarios (17 passed)
83 steps (83 passed)
```

## Supported Browsers

1. Chrome - default browser
2. Firefox
3. MS Edge
4. WebKit - web browser engine used by Safari


#### Steps to use
##### 1. Installation

Playwright framework requires [Node.js](https://nodejs.org/) v14+ to run.

clone [hwpc-bug](https://github.com/grasshorse/hwpc-bug) using git command.

Installing the dependencies.
```sh
npm install
```
Install ci/cd
```sh
npm ci
```
##### 2. Test creation
- Test scenarios are organized into features and these feature files should be placed inside features folder.
- Step definitions connect Gherkin steps in feature files to programming code. A step definition carries out the action that should be performed by the scenario steps. These step definitions should placed inside steps folder in different packages.
- For web UI based tests maintain all the selectors inside pages folder.

##### 3. Execution

#### Standard Test Execution
To run test scenarios use below command.
```sh
npm run test
```
To run specific scenario, use tags command. Below are few examples.
```sh
npm run test:tags '@hwpc'
```

#### Dual-Mode Testing (New Feature)
The framework now supports dual-mode testing with three execution modes:

**Isolated Mode** - Tests with controlled database states:
```sh
npm run test:isolated              # Full isolated testing with reports
npm run test:isolated:fast         # Fast isolated testing (no reports)
npm run test:isolated:navigation   # Isolated navigation tests only
npm run test:isolated:api          # Isolated API tests only
```

**Production Mode** - Tests with looneyTunesTest data in production:
```sh
npm run test:production            # Full production testing with reports
npm run test:production:fast       # Fast production testing (no reports)
npm run test:production:navigation # Production navigation tests only
npm run test:production:api        # Production API tests only
```

**Dual Mode** - Tests that work in both environments:
```sh
npm run test:dual                  # Full dual-mode testing with reports
npm run test:dual:fast             # Fast dual-mode testing (no reports)
```

#### Test Validation and Debugging
To dry run test scenarios use below command.
```sh
npm run dry:test
npm run dry:test:isolated          # Validate isolated mode configuration
npm run dry:test:production        # Validate production mode configuration
```

To rerun the failed test scenarios use below command.
```sh
npm run failed:test
```

#### Environment Configuration
To change any environment configuration in .env file at run time use set command.
Eg: To change browser to Firefox use below command
```sh
set BROWSER=firefox
```

For dual-mode testing, set the test mode (Windows PowerShell):
```powershell
$env:TEST_MODE="isolated"    # For isolated mode
$env:TEST_MODE="production"  # For production mode
$env:TEST_MODE="dual"        # For dual mode
```

#### Test Tags for Dual-Mode
Tests should be tagged appropriately:
- `@isolated` - Runs only in isolated mode
- `@production` - Runs only in production mode
- `@dual` - Runs in both isolated and production modes

#### Reports
To generate HTML and Cucumber report use below command
```sh
npm run report
```

For detailed dual-mode testing documentation, see:
- `docs/dual-mode-testing-configuration.md` - Complete configuration guide
- `docs/npm-scripts-reference.md` - Quick command reference
##### 4. Report & Logs
Cucumber HTML report will be present inside
```sh
test-results/reports/cucumber.html
```
HTML report will be present inside
```sh
test-results/reports/html/index.html
```
Execution log will be present in the log file.
```sh
test-results/logs/execution.log
```


## **Overview:**

This is a sample test automation framework developed using **Playwright** with **Cucumber**. [reference repo](https://github.com/VinayKumarBM/playwright-cucumber-sample.git)

**Playwright** is a framework for Web Testing and Automation. It allows testing Chromium, Firefox and WebKit with a single API. Playwright is built to enable cross-browser web automation that is ever-green, capable, reliable and fast.

**Cucumber** is a tool for running automated tests written in plain language. Because they're written in plain language, they can be read by anyone on your team. Because they can be read by anyone, you can use them to help improve communication, collaboration and trust on your team. Cucumber supports behavior-driven development. Central to the Cucumber BDD approach is its ordinary language parser called Gherkin. 

## Features

- This testing framework supports Behavior Driven Development (BDD). Tests are written in plain English text called Gherkin
- Framework has built in library to operate on UI, API (both SOAP & REST API) and DB (MSSQL, DB2 & Oracle).
- Supports execution of tests in different browsers.
- Supports running scenarios in parallel mode. It runs 2 scenarios in parallel by default.
- Flaky scenario can be Retried multiple times until either it passes or the maximum number of attempts is reached. You can enable this via the retry configuration option.
- Supports rerun of the failed scenarios.
- Scenarios can be easily skipped by adding @ignore tag to scenarios
- Supports dry run of scenarios this helps to identifies the undefined and ambiguous steps.
- Has utility built in for file download, Read PDF files etc.
- Generates Cucumber HTML Report & HTML Report.
- HTML reports are included with snapshots and video in case of failed scenarios.
- Test execution logs are captured in the log file.
- All the configuration are controlled by .env file and environment variables can be modified at runtime.
- Easy and simple integration to CI/CD tools like Jenkins.
