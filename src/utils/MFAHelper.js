const { authenticator } = require('otplib');

class MFAHelper {
    constructor() {
        this.authenticator = authenticator;
    }

    generateToken(secret) {
        return this.authenticator.generate(secret);
    }

    verifyToken(token, secret) {
        return this.authenticator.verify({ token, secret });
    }
}

module.exports = MFAHelper; 