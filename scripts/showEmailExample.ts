import { EmailGenerator } from '../utils/emailGenerator';
 
// Generate 5 example emails
for (let i = 0; i < 5; i++) {
    console.log(`Example ${i + 1}:`, EmailGenerator.generateTestEmail());
} 