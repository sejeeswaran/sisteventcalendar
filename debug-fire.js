require('dotenv').config();
var admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'debug-log.txt');
const log = (msg) => {
    fs.appendFileSync(logFile, msg + '\n');
    console.log(msg); // Keep console just in case
};

fs.writeFileSync(logFile, '--- START DEBUG ---\n');

(async () => {
    try {
        log('--- Debugging Firebase Connection ---');
        log(`Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
        log(`Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`);

        const pk = process.env.FIREBASE_PRIVATE_KEY;
        log(`Private Key Type: ${typeof pk}`);

        if (!pk) {
            log('ERROR: FIREBASE_PRIVATE_KEY is missing');
            process.exit(1);
        }

        log(`Private Key Original Length: ${pk.length}`);
        log(`First 20 chars: ${pk.substring(0, 20)}`);

        // Check for escaped newlines
        const hasEscapedNewlines = pk.includes('\\n');

        log(`Has escaped newlines (\\n): ${hasEscapedNewlines}`);

        let finalKey = pk;
        if (hasEscapedNewlines) {
            log('Replacing escaped newlines...');
            finalKey = pk.replace(/\\n/g, '\n');
        }

        log(`Final Key Length: ${finalKey.length}`);

        if (!admin.apps.length) {
            log('Initializing app...');
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: finalKey,
                }),
            });
            log('App initialized.');
        }

        log('Attempting Firestore read...');
        const db = admin.firestore();
        await db.collection('users').limit(1).get();
        log('SUCCESS: Firestore connection established.');

    } catch (error) {
        log('FAILURE DETAILS:');
        log(`Error Code: ${error.code}`);
        log(`Error Message: ${error.message}`);
        if (error.errorInfo) log(`Error Info: ${JSON.stringify(error.errorInfo, null, 2)}`);
        log(`Full Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);
        process.exit(1);
    }
})();
