Feature: NinjaOne Login and MFA Setup
  As a NinjaOne user,
  I want to log in to my account and set up MFA authentication,
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
   
    # Step 3: First login and MFA setup
    When user logs in with the email and password
    Then user should see the first-time MFA setup message
    When user selects Authenticator App as the MFA method
    And user saves the MFA secret for future use
    And user enters the generated MFA code
    Then user should be successfully logged in
   # Then user logs out

  @setup @signup @mfa-login @existing-user
  Scenario: Existing user sign in flow with MFA 
    # Step 1: Verify login with MFA
    Given existing user logs in with the email and password
      | email                          | password         |
      | ninja.one.test01+325@gmail.com | TestPassword123! |
    When user enters the MFA code for existing user
    Then user should be successfully logged in
   # Then user logs out

    
    

  