export class SharedState {
    private static instance: SharedState;
    private testEmail: string = '';

    private constructor() {}

    static getInstance(): SharedState {
        if (!SharedState.instance) {
            SharedState.instance = new SharedState();
        }
        return SharedState.instance;
    }

    setTestEmail(email: string) {
        console.log('Setting test email:', email);
        this.testEmail = email;
    }

    getTestEmail(): string {
        if (!this.testEmail) {
            throw new Error('Test email has not been set');
        }
        return this.testEmail;
    }
} 