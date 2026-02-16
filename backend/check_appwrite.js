
import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from the backend directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkConnection() {
    console.log('--- Appwrite Connection Check ---');
    console.log(`Endpoint: ${process.env.APPWRITE_ENDPOINT}`);
    console.log(`Project ID: ${process.env.APPWRITE_PROJECT_ID}`);

    // Check API Key format (simple heuristic)
    const apiKey = process.env.APPWRITE_API_KEY || '';
    if (apiKey.startsWith('eyJ')) {
        console.error('❌ ERROR: APPWRITE_API_KEY looks like a JWT token. It should be a Secret API Key (hex string) from the "API Keys" section in settings.');
    } else if (apiKey.length < 20) {
        console.error('❌ ERROR: APPWRITE_API_KEY seems too short.');
    } else {
        console.log('API Key format: Looks like a valid Secret API Key (length matches).');
    }

    const client = new Client();
    client
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    try {
        console.log('Attempting to list databases...');
        // Try to list databases to verify connection and permissions
        const result = await databases.list();
        console.log('✅ Connection Successful!');
        console.log(`Found ${result.total} database(s).`);

        // Check if our specific database exists
        const dbId = process.env.APPWRITE_DATABASE_ID || 'timetable';
        const dbExists = result.databases.some(db => db.$id === dbId);
        if (dbExists) {
            console.log(`✅ Database "${dbId}" found.`);
        } else {
            console.warn(`⚠️ Warning: Database "${dbId}" NOT found in the list.`);
            console.log('Existing Databases:', result.databases.map(d => d.$id).join(', '));
        }

    } catch (error) {
        console.error('❌ Connection Failed.');
        console.error(`Error: ${error.message}`);

        if (error.code === 404) {
            console.error('Hint: "Project not found" usually means the Project ID is wrong OR you are using the wrong Endpoint (e.g. Cloud vs Localhost).');
        } else if (error.code === 401) {
            console.error('Hint: "Unauthorized" usually means the API Key is invalid or missing required scopes.');
        }
    }
}

checkConnection();
