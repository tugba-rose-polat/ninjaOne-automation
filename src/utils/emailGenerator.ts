import { randomBytes } from 'crypto';

export class EmailGenerator {
    private static readonly BASE_EMAIL = 'ninja.one.test01';
    private static readonly EMAIL_DOMAIN = '@gmail.com';

    /**
     * Generates a test email address in the format: ninja.one.test01+XXX@gmail.com
     * where XXX is a number between 001 and 999
     * @returns {string} A test email address
     */
    static generateTestEmail(): string {
        // Generate random number between 1 and 999
        const randomNum = Math.floor(Math.random() * 999) + 1;
        // Pad with leading zeros to ensure 3 digits
        const paddedNum = randomNum.toString().padStart(3, '0');
        
        return `${this.BASE_EMAIL}+${paddedNum}${this.EMAIL_DOMAIN}`;
    }

    /**
     * Validates if an email matches our test email pattern
     * @param email Email address to validate
     * @returns {boolean} True if email matches test pattern
     */
    static isTestEmail(email: string): boolean {
        const pattern = new RegExp(`^${this.BASE_EMAIL}\\+\\d{3}${this.EMAIL_DOMAIN}$`);
        return pattern.test(email);
    }
}

// Example usage:
if (require.main === module) {
    // Generate a single test email
    console.log('Single test email:', EmailGenerator.generateTestEmail());
    
    // Validate test emails
    const testEmail = EmailGenerator.generateTestEmail();
    console.log('Is valid test email?', EmailGenerator.isTestEmail(testEmail));
} 