# NinjaOne Test Automation Framework

This project contains automated tests for NinjaOne application, focusing on user authentication flows including signup, login, and MFA verification using Playwright and Cucumber.js.

## Project Structure

```
├── src/
│   ├── pages/              # Page Object Models
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   ├── SignupPage.ts
│   │   └── VerificationPage.ts
│   ├── test/
│   │   ├── features/       # Cucumber feature files
│   │   │   └── login.feature
│   │   ├── steps/         # Step definitions
│   │   │   ├── login-steps.ts
│   │   │   └── mfa-steps.ts
│   │   └── support/       # Test support files
│   │       └── browser.ts
│   └── utils/             # Utility classes
│       ├── emailGenerator.ts
│       ├── GmailHelper.ts
│       └── MFAHelper.ts
├── cucumber.js           # Cucumber configuration
├── playwright.config.ts  # Playwright configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies
```

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Google Cloud Console project with Gmail API enabled
- Chrome browser

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the project root:
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token
```

3. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

Run login feature tests in headless mode:
```bash
npx cucumber-js src/test/features/login.feature
```

Run tests in headed mode:
```bash
PLAYWRIGHT_HEADLESS=false npx cucumber-js src/test/features/login.feature
```

Generate HTML report:
```bash
npm run generate:report
```

## Features

- Cucumber BDD test scenarios
- Page Object Model (POM) implementation
- TypeScript support
- Gmail API integration for email verification
- Automatic TOTP/MFA token generation and verification
- Support for both new user signup and existing user login flows
- Screenshot capture on test failure
- HTML report generation
- CI/CD integration with GitHub Actions

## Test Scenarios

1. Complete signup flow with MFA setup
   - New user registration
   - Email verification
   - MFA setup with authenticator app
   - First-time login verification

2. Existing user login with MFA
   - Login with saved credentials
   - MFA code verification
   - Dashboard access verification

## Environment Variables

- `GOOGLE_CLIENT_ID`: Google Cloud Console client ID
- `GOOGLE_CLIENT_SECRET`: Google Cloud Console client secret
- `GMAIL_REFRESH_TOKEN`: Gmail API refresh token for email access
- `PLAYWRIGHT_HEADLESS`: Set to 'false' for headed mode testing

## Notes

- The framework uses Gmail API for email verification
- MFA secrets are stored in `mfa_secrets.json` for test automation
- Screenshots are captured on test failures in the `screenshots` directory
- Test reports are generated in the `playwright-report` directory
- Make sure to add `.env` and `mfa_secrets.json` to your `.gitignore` file

## Debugging

- Check `screenshots` directory for failure screenshots
- Review test logs in the terminal output
- Use headed mode for visual debugging
- Check HTML reports for detailed test execution information 