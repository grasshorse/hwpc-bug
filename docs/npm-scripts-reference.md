# NPM Scripts Reference - Dual-Mode Testing

## Quick Command Reference

### Isolated Mode (Controlled Database States)
```bash
npm run test:isolated              # Full isolated testing with reports
npm run test:isolated:fast         # Fast isolated testing (no reports)
npm run test:isolated:navigation   # Isolated navigation tests only
npm run test:isolated:api          # Isolated API tests only
npm run dry:test:isolated          # Validate isolated test configuration
```

### Production Mode (looneyTunesTest Data)
```bash
npm run test:production            # Full production testing with reports
npm run test:production:fast       # Fast production testing (no reports)
npm run test:production:navigation # Production navigation tests only
npm run test:production:api        # Production API tests only
npm run dry:test:production        # Validate production test configuration
```

### Dual Mode (Both Environments)
```bash
npm run test:dual                  # Full dual-mode testing with reports
npm run test:dual:fast             # Fast dual-mode testing (no reports)
```

### Legacy Commands (Still Available)
```bash
npm run test                       # Default test execution
npm run test:fast                  # Fast default testing
npm run test:navigation            # Navigation tests (default mode)
npm run test:api                   # API tests (default mode)
npm run qa:test                    # QA environment tests
```

## Environment Variables

Set these before running commands (Windows PowerShell):
```powershell
$env:TEST_MODE="isolated"    # For isolated mode
$env:TEST_MODE="production"  # For production mode
$env:TEST_MODE="dual"        # For dual mode
```

## Test Tags Required

- `@isolated` - Runs only in isolated mode
- `@production` - Runs only in production mode  
- `@dual` - Runs in both modes

## Configuration Files

- `.env.isolated` - Isolated mode settings
- `.env.production` - Production mode settings
- `.env.dual` - Dual mode settings

For detailed documentation, see: `docs/dual-mode-testing-configuration.md`