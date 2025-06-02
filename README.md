# NinjaRMM Login Automation

This project contains automated tests for NinjaRMM login process including MFA authentication using Playwright.

## Project Structure

```
├── pages/
│   └── LoginPage.js         # Page object for login functionality
├── utils/
│   └── MFAHelper.js        # Helper class for MFA token generation
├── tests/
│   └── login.spec.js       # Test scenarios
├── playwright.config.js    # Playwright configuration
├── package.json           # Project dependencies
└── .env                   # Environment variables (create this file)
```

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the project root with your credentials:
```
EMAIL=your_email@example.com
PASSWORD=your_password
MFA_SECRET=your_mfa_secret  # For Google Authenticator
PHONE_NUMBER=your_phone_number  # For SMS verification
```

3. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

Run all tests:
```bash
npx playwright test
```

Run tests with UI mode:
```bash
npx playwright test --ui
```

View test report:
```bash
npx playwright show-report
```

## Features

- Page Object Model (POM) implementation
- Support for both Google Authenticator and SMS MFA
- Automatic TOTP token generation
- Screenshot and video capture on failure
- HTML report generation

## Notes

- For SMS verification, you'll need to either:
  - Manually input the code during test execution
  - Integrate with an SMS API service
  - Use a test phone number that can be automated
- Make sure to add `.env` to your `.gitignore` file to keep credentials secure 