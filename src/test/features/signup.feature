

Feature: NinjaOne Signup and MFA Setup
  As a NinjaOne user,
  I want to sign up to account and set up MFA authentication,
  so that I can securely access my account.

  Background:
    Given user navigates to the NinjaOne login page

  @setup @signup @mfa-setup @first-time-login
  Scenario: Complete signup flow with MFA setup for first-time login
    # Step 1: Sign up
    Given user clicks to the do not have an account button
    And user generates a unique test email using EmailGenerator
    When user creates a new account with the following details
      | field       | value            |
      | firstName   | Test             |
      | lastName    | User             |
      | companyName | Test Company     |
      | phoneNumber | +12345678901     |
      | password    | TestPassword123! |
    Then user should see an email verification message

    # Step 2: Activate account
    When user waits for the verification email
    And user clicks the activation link in the email
    Then user should see the account activation success message