
import Teacher from './models/Teacher.js';
import Principal from './models/Principal.js';
import { databases, DATABASE_ID } from './utils/appwrite.js';

async function testFetch() {
    try {
        console.log('Fetching teachers...');
        const teachers = await Teacher.find({}).lean();
        console.log(`Teachers found: ${teachers.length}`);
        if (teachers.length > 0) console.log('Sample:', teachers[0]);

        console.log('Fetching principal...');
        const principal = await Principal.findOne({});
        console.log('Principal:', principal);

    } catch (e) {
        console.error('Error fetching:', e);
    }
}

testFetch();
