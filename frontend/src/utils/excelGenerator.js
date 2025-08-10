import * as XLSX from 'xlsx';

export const exportToExcel = (timetable, existingTeachers) => {
  // Define days and periods
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const maxPeriods = 9;

  // Organize data by teacher
  const teacherMap = new Map();
  
  // First pass: Initialize all existing teachers with empty schedules
  existingTeachers.forEach(teacher => {
    teacherMap.set(teacher.name, {
      name: teacher.name,
      schedule: {}
    });
  });

  // Second pass: Fill in the schedule
  timetable.forEach(entry => {
    const teacher = teacherMap.get(entry.teacher);
    if (!teacher) return; // Skip if teacher not found
    
    if (!teacher.schedule[entry.day]) {
      teacher.schedule[entry.day] = {};
    }
    teacher.schedule[entry.day][entry.period] = {
      class: entry.class,
      subject: entry.subject
    };
  });

  // Create worksheet data
  const wsData = [];

  // Add header rows
  const headerRow1 = ['Teacher'];
  const headerRow2 = [''];
  
  days.forEach(day => {
    // Add day headers
    for (let i = 0; i < maxPeriods; i++) {
      headerRow1.push(day);
    }
    // Add period numbers
    for (let i = 1; i <= maxPeriods; i++) {
      headerRow2.push(i.toString());
    }
  });

  wsData.push(headerRow1, headerRow2);

  // Add teacher rows in the same order as existingTeachers
  existingTeachers.forEach(existingTeacher => {
    const teacher = teacherMap.get(existingTeacher.name);
    if (!teacher) return; // Skip if teacher not found in timetable
    
    const row = [teacher.name];
    
    days.forEach(day => {
      for (let period = 1; period <= maxPeriods; period++) {
        const cell = teacher.schedule[day]?.[period];
        row.push(cell ? cell.class : '');
      }
    });
    
    wsData.push(row);
  });

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidth = 15;
  const cols = [];
  for (let i = 0; i < headerRow1.length; i++) {
    cols.push({ wch: i === 0 ? 20 : colWidth }); // First column wider for teacher names
  }
  ws['!cols'] = cols;

  // Merge day header cells
  const merges = [];
  let colIndex = 1; // Start after teacher column
  days.forEach(() => {
    merges.push({
      s: { r: 0, c: colIndex },
      e: { r: 0, c: colIndex + maxPeriods - 1 }
    });
    colIndex += maxPeriods;
  });
  ws['!merges'] = merges;

  // Create workbook and add worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Teacher Timetable');

  // Save file
  XLSX.writeFile(wb, 'TeacherTimetable.xlsx');
};
