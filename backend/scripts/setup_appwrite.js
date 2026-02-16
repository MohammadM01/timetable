
import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.APPWRITE_DATABASE_ID || 'timetable';

const collections = [
    {
        name: 'teachers',
        id: 'teachers',
        attributes: [
            { key: 'name', type: 'string', size: 128, required: true },
            { key: 'weeklyPeriods', type: 'integer', required: true },
            { key: 'dailyPeriods', type: 'integer', required: true },
            { key: 'id', type: 'integer', required: true }, // Logic ID
            { key: 'rowOrder', type: 'integer', required: false },
        ],
        indexes: [
            { key: 'idx_teacher_id', type: 'unique', attributes: ['id'] }
        ]
    },
    {
        name: 'classes',
        id: 'classes',
        attributes: [
            { key: 'standard', type: 'string', size: 64, required: true },
            { key: 'division', type: 'string', size: 64, required: true },
            { key: 'full_name', type: 'string', size: 128, required: true },
        ]
    },
    {
        name: 'subjects',
        id: 'subjects',
        attributes: [
            { key: 'subject_name', type: 'string', size: 128, required: true },
            { key: 'standard', type: 'string', size: 64, required: true },
            { key: 'weekly_periods', type: 'integer', required: true },
            { key: 'consecutive_periods', type: 'boolean', required: true },
        ]
    },
    {
        name: 'principals',
        id: 'principals',
        attributes: [
            { key: 'name', type: 'string', size: 128, required: true },
            { key: 'weekly_periods', type: 'integer', required: true },
            { key: 'daily_max_periods', type: 'integer', required: true },
        ]
    },
    {
        name: 'users',
        id: 'users',
        attributes: [
            { key: 'username', type: 'string', size: 128, required: true },
            { key: 'passwordHash', type: 'string', size: 256, required: true },
            { key: 'role', type: 'string', size: 64, required: true },
        ],
        indexes: [
            { key: 'idx_username', type: 'unique', attributes: ['username'] }
        ]
    },
    {
        name: 'counters',
        id: 'counters',
        attributes: [
            { key: 'key', type: 'string', size: 64, required: true },
            { key: 'seq', type: 'integer', required: true },
        ],
        indexes: [
            { key: 'idx_key', type: 'unique', attributes: ['key'] }
        ]
    },
    {
        name: 'teacher_subjects',
        id: 'teacher_subjects',
        attributes: [
            { key: 'teacherId', type: 'string', size: 64, required: true }, // Can be Int ID or String ID
            { key: 'teacherName', type: 'string', size: 128, required: true },
            { key: 'subjectId', type: 'string', size: 64, required: true },
            { key: 'subjectName', type: 'string', size: 128, required: true },
            { key: 'standard', type: 'string', size: 64, required: false },
            { key: 'preferredPeriods', type: 'string', size: 1024, required: false, array: true }, // Store as array of strings
            { key: 'avoidPeriods', type: 'string', size: 1024, required: false, array: true },
            { key: 'consecutivePeriods', type: 'boolean', required: false },
        ]
    },
    {
        name: 'timetables',
        id: 'timetables',
        attributes: [
            { key: 'generationStatus', type: 'string', size: 64, required: true },
            { key: 'schoolConfig', type: 'string', size: 10000, required: false }, // JSON string
            { key: 'timetable', type: 'string', size: 1000000, required: false }, // Big JSON
            { key: 'teacherSchedule', type: 'string', size: 1000000, required: false }, // Big JSON
            { key: 'generationLog', type: 'string', size: 50000, required: false, array: true }, // JSON array or string array
            { key: 'stats', type: 'string', size: 5000, required: false }, // JSON
        ]
    }
];

async function setup() {
    console.log('Starting Appwrite Setup...');

    // 1. Create Database
    try {
        await databases.get(DB_ID);
        console.log(`Database '${DB_ID}' already exists.`);
    } catch (e) {
        if (e.code === 404) {
            console.log(`Creating database '${DB_ID}'...`);
            await databases.create(DB_ID, DB_ID);
            console.log('Database created.');
        } else {
            console.error('Error checking database:', e);
            return;
        }
    }

    // 2. Create Collections
    for (const col of collections) {
        console.log(`\nProcessing collection '${col.name}'...`);
        let exists = false;
        try {
            await databases.getCollection(DB_ID, col.id);
            console.log(`Collection '${col.name}' exists.`);
            exists = true;
        } catch (e) {
            if (e.code === 404) {
                console.log(`Creating collection '${col.name}'...`);
                await databases.createCollection(DB_ID, col.id, col.name, [
                    Permission.read(Role.any()),
                    Permission.write(Role.any()),
                    Permission.update(Role.any()),
                    Permission.delete(Role.any()),
                ]);
                console.log('Collection created.');
            } else {
                console.error(`Error checking collection '${col.name}':`, e.message);
                continue;
            }
        }

        // 3. Create Attributes
        console.log(`Checking attributes for '${col.name}'...`);
        // We'll just try to create them. If they exist, it throws 409 (Conflict), which we ignore.
        // Doing strict check is harder.
        for (const attr of col.attributes) {
            try {
                if (attr.type === 'string') {
                    await databases.createStringAttribute(DB_ID, col.id, attr.key, attr.size, attr.required, undefined, attr.array);
                } else if (attr.type === 'integer') {
                    await databases.createIntegerAttribute(DB_ID, col.id, attr.key, attr.required, 0, 2147483647, undefined, attr.array);
                } else if (attr.type === 'boolean') {
                    await databases.createBooleanAttribute(DB_ID, col.id, attr.key, attr.required, undefined, attr.array);
                }
                else if (attr.type === 'float') {
                    await databases.createFloatAttribute(DB_ID, col.id, attr.key, attr.required, undefined, attr.array);
                }
                console.log(` + Attribute '${attr.key}' created.`);
                // Wait a bit because Appwrite attribute creation is async background process
                await new Promise(r => setTimeout(r, 500));
            } catch (e) {
                if (e.code === 409) {
                    console.log(` - Attribute '${attr.key}' already exists.`);
                } else {
                    console.error(` ! Error creating attribute '${attr.key}':`, e.message);
                }
            }
        }

        // 4. Create Indexes
        if (col.indexes) {
            console.log(`Checking indexes for '${col.name}'...`);
            for (const idx of col.indexes) {
                try {
                    await databases.createIndex(DB_ID, col.id, idx.key, idx.type, idx.attributes);
                    console.log(` + Index '${idx.key}' created.`);
                    await new Promise(r => setTimeout(r, 1000));
                } catch (e) {
                    if (e.code === 409) {
                        console.log(` - Index '${idx.key}' already exists.`);
                    } else {
                        console.error(` ! Error creating index '${idx.key}':`, e.message);
                    }
                }
            }
        }
    }

    console.log('\nAppwrite Setup Complete!');
}

setup();
