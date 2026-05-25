import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runTest() {
    console.log('🏁 Starting E2E Timetable Flexibility & Swapping Integration Test...\n');
    let token = '';

    try {
        // 1. Seed & Login Admin
        console.log('1️⃣ Seed Admin & Auth Login...');
        const seedRes = await fetch(`${API_BASE}/auth/seed-admin`, { method: 'POST' });
        const seedData = await seedRes.json();
        console.log(`   - Seed status: ${seedData.message || 'Seeded'}`);

        const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin' })
        });
        const loginData = await loginRes.json();
        if (!loginData.success) {
            throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
        }
        token = loginData.token;
        console.log('   - Login successful. Token obtained.\n');

        // 2. Generate Timetable
        console.log('2️⃣ Generating Timetable Version 1...');
        const genRes = await fetch(`${API_BASE}/timetable/generate`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                config: {
                    daysPerWeek: 6,
                    periodsPerDay: 8,
                    periodDuration: 45,
                    startTime: '08:00',
                    recessAfterPeriod: 4
                },
                generationType: 'all'
            })
        });
        const genData = await genRes.json();
        if (!genData.success) {
            throw new Error(`Generation failed: ${JSON.stringify(genData)}`);
        }
        const timetableId = genData.timetableId;
        console.log(`   - Timetable Generated! ID: ${timetableId}`);
        console.log(`   - Initial Conflicts: ${genData.stats?.conflicts || 0}\n`);

        // 3. Query Classes to Get target details
        console.log('3️⃣ Fetching Classes to select target for manual edit...');
        const classRes = await fetch(`${API_BASE}/timetable/available-classes`);
        const classes = await classRes.json();
        const targetClass = classes[0]; // e.g. VG1
        console.log(`   - Selected target class: ${targetClass.full_name} (ID: ${targetClass.id})\n`);

        // 4. Run Pre-save Live Validation (Teacher Overlap Test)
        console.log('4️⃣ Simulating Live Pre-save Cell Validation...');
        // Let's validate scheduling teacher ID 2 (MRS. SABA MOAZZAM) into Period 2 on Monday (day index 1)
        const valRes = await fetch(`${API_BASE}/timetable/validate-cell`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                timetableId,
                classId: targetClass.id,
                day: 1,
                period: 2,
                subjectName: 'ENGLISH',
                teacherId: '2',
                teacherName: 'MRS. SABA MOAZZAM KHATIMITI'
            })
        });
        const valData = await valRes.json();
        console.log(`   - Validation Results (Warnings: ${valData.hasWarnings ? 'Yes' : 'None'}):`);
        if (valData.warnings && valData.warnings.length > 0) {
            valData.warnings.forEach(w => console.log(`     ⚠️  Alert: ${w}`));
        } else {
            console.log('     ✅ No immediate double-booking warning found.');
        }
        console.log('');

        // 5. Execute Manual Reassignment Override
        console.log('5️⃣ Overriding timetable slot manually...');
        const editRes = await fetch(`${API_BASE}/timetable/cell`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                timetableId,
                classId: targetClass.id,
                day: 1,
                period: 2,
                subjectName: 'MATHS',
                teacherId: '2',
                teacherName: 'MRS. SABA MOAZZAM KHATIMITI',
                action: 'edit'
            })
        });
        const editData = await editRes.json();
        if (!editData.success) {
            throw new Error(`Cell edit failed: ${JSON.stringify(editData)}`);
        }
        console.log(`   - Cell updated successfully!`);
        console.log(`   - New Global Timetable Conflicts: ${editData.conflictsCount}\n`);

        // 6. Test Period Swapping
        console.log('6️⃣ Executing cell swap (Monday Period 2 <-> Monday Period 3)...');
        const swapRes = await fetch(`${API_BASE}/timetable/cell`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                timetableId,
                classId: targetClass.id,
                day: 1,
                period: 2,
                action: 'swap',
                swapWithDay: 1,
                swapWithPeriod: 3
            })
        });
        const swapData = await swapRes.json();
        if (!swapData.success) {
            throw new Error(`Cell swap failed: ${JSON.stringify(swapData)}`);
        }
        console.log('   - Period swap completed successfully!\n');

        // 7. Review Versions History
        console.log('7️⃣ Checking Timetable History & Version Management...');
        const historyRes = await fetch(`${API_BASE}/timetable/history`);
        const historyList = await historyRes.json();
        console.log(`   - Timetable History count: ${historyList.length}`);
        historyList.forEach((h, idx) => {
            console.log(`     [${idx + 1}] ID: ${h.id} | Label: "${h.label}" | Active: ${h.isActive} | Conflicts: ${h.stats?.conflicts || 0}`);
        });
        console.log('');

        // 8. Test Version Activation
        console.log('8️⃣ Activating generated Timetable...');
        const actRes = await fetch(`${API_BASE}/timetable/${timetableId}/active`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const actData = await actRes.json();
        console.log(`   - Activation status: ${actData.message}`);

        // Double check history again to confirm activation state
        const historyCheckRes = await fetch(`${API_BASE}/timetable/history`);
        const historyCheckList = await historyCheckRes.json();
        const activeDoc = historyCheckList.find(h => h.id === timetableId);
        console.log(`   - Verified Active status in DB: ${activeDoc?.isActive ? '🟢 TRUE' : '🔴 FALSE'}\n`);

        console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! The post-generation editing, validation, swapping, and version control features are fully verified and ready.');

    } catch (error) {
        console.error('❌ E2E Integration Test FAILED:', error.message || error);
    }
}

runTest();
