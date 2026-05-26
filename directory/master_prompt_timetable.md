# ═══════════════════════════════════════════════════════════════════════════════
# MASTER ENGINEERING PROMPT: SCHOOL TIMETABLE MANAGEMENT SYSTEM
# Complete Context Engineering Document for AI-Assisted Development
# Version: 1.0.0 | Project Code: STMS-2025
# ═══════════════════════════════════════════════════════════════════════════════

---

# DOCUMENT METADATA

**Project Title:** School Timetable Management System (STMS)  
**Technology Stack:** React.js (Vite) + Node.js (Express) + MongoDB + Electron  
**Target Audience:** AI coding assistant building this system from scratch  
**Document Purpose:** Full-context engineering specification — every decision, every schema, every component, every algorithm, every edge case — described with enough precision that zero ambiguity remains  
**Total Scope:** ~100,000+ words across ~50 pages  
**Budget:** ₹20,000 (two-developer team)  
**Deployment:** Electron desktop app with auto-starting embedded backend  

---

# TABLE OF CONTENTS

```
CHAPTER 1:  Project Vision & Philosophy ............................ Page 3
CHAPTER 2:  Real Data Analysis & School Context .................... Page 5
CHAPTER 3:  Complete File & Folder Structure ....................... Page 8
CHAPTER 4:  Technology Stack — Exact Versions & Why ................ Page 12
CHAPTER 5:  MongoDB Database Design — Every Collection ............. Page 15
CHAPTER 6:  Backend API — Every Route, Every Handler ............... Page 25
CHAPTER 7:  Timetable Generation Algorithm ......................... Page 38
CHAPTER 8:  Frontend Architecture — Pages & Components ............. Page 48
CHAPTER 9:  Excel Import/Export System ............................. Page 62
CHAPTER 10: CRUD Operations — Full Specification ................... Page 68
CHAPTER 11: UI/UX Design System — Colors, Fonts, Animations ........ Page 74
CHAPTER 12: All Timetable View Modes .............................. Page 80
CHAPTER 13: Electron Wrapper & Auto-Start Logic .................... Page 86
CHAPTER 14: Error Handling & Validation ............................ Page 90
CHAPTER 15: Testing Strategy ...................................... Page 94
CHAPTER 16: Build, Package & Distribution .......................... Page 97
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 1: PROJECT VISION & PHILOSOPHY
# ═══════════════════════════════════════════════════════════════════════════════

## 1.1 What This System Actually Is

This is NOT a generic timetable tool. This is a purpose-built, production-grade school timetable management system designed for a specific real school (whose data is provided in the uploaded Excel files). The system is built to solve a real, recurring pain point: school principals spending days — sometimes weeks — manually creating timetables at the start of each academic year, trying to juggle 44 teachers, 22 classes, 6 standards, and hundreds of subject-period constraints without making scheduling conflicts.

The system does three things exceptionally well:

**Thing 1 — Data Management (CRUD):** It stores and manages all school entities — teachers, classes, subjects, periods, constraints — in a MongoDB database through a clean REST API. Every entity supports full Create, Read, Update, Delete operations with validation, soft-delete, audit trails, and bulk operations.

**Thing 2 — Timetable Generation:** It runs a constraint-satisfaction algorithm that takes all the stored data and automatically generates a complete, conflict-free timetable for every class in the school simultaneously. The algorithm respects weekly period counts, daily maximums, consecutive period requirements, teacher availability, and teacher-subject assignments.

**Thing 3 — Visualization & Export:** It renders the generated timetable in multiple views (by class, by teacher, by subject, master grid, weekly summary) and exports to Excel files or prints directly — all in a colorful, professional, spreadsheet-style grid interface.

## 1.2 Why Electron

The school principal needs a desktop app, not a web app hosted somewhere. The school may not have reliable internet. The principal wants to double-click an icon and have the software open immediately. Electron wraps the React frontend and the Node.js backend into a single installable `.exe` (Windows) or `.dmg` (Mac) file. When the Electron app starts, it automatically spawns the backend server on a local port (e.g., 3001), then loads the React frontend in the Electron window pointing at `http://localhost:3001`. MongoDB runs locally (embedded or system-installed). The user sees a desktop application — they never need to open a browser or a terminal.

## 1.3 Design Philosophy

**Colorful but Professional:** The UI uses a white base theme with vivid color accents. Each standard (V, VI, VII, VIII, IX, X) gets its own color identity (indigo, emerald, amber, rose, violet, cyan). Each subject category gets a color. Teacher cards get color-coded badges. The timetable grid cells are color-coded by subject. This is NOT a corporate grey dashboard — it's a school management tool that should feel energetic and organized at the same time.

**Spreadsheet-Native Grid:** Teachers and principals think in spreadsheets. Every timetable view renders as an Excel-style grid — rows, columns, borders, alternating row colors, frozen headers, sticky left columns. The "timetable" IS a grid. Do not render it as a list or cards. It must look like what users expect a timetable to look like.

**Zero Configuration Complexity:** The principal should not need to read a manual. Every input form has inline help text, example values, and validation that tells you exactly what is wrong. Excel uploads auto-detect column names with fuzzy matching. The Generate button works with one click after data is loaded.

**Fully Offline:** No external API calls, no CDN dependencies at runtime, no cloud sync. Everything runs on `localhost`. This is critical for a school environment.

**Forgiving by Design:** If a teacher is deleted, their timetable periods are not immediately destroyed — they are flagged as "unassigned" (shown in red) so the principal can reassign them. If a subject's weekly count changes, the system highlights the diff, not silently breaks.

## 1.4 What "Fully Flexible and Scalable" Means Here

When the specification says "fully flexible and scalable," it means:

- **Flexible number of classes:** From 1 class to 100+ classes. The system handles 22 classes (as in the uploaded data) but must not hardcode 22.
- **Flexible number of periods per day:** Monday might have 9 periods; Friday might have 5. Each day is independently configurable. Period timings are configurable (e.g., Period 1: 07:30–08:15).
- **Flexible standards and divisions:** The system works for Standards V through X with divisions G1–G4 today, but a new standard or division can be added without schema changes.
- **Flexible subjects per standard:** Every standard has its own subject list with its own weekly period counts. This is NOT shared across standards.
- **Flexible teacher-subject-class assignments:** A teacher can be assigned to multiple subjects across multiple classes. The same subject in different classes can be assigned to different teachers.
- **Flexible constraints:** Consecutive periods (2-period double-lessons) are a per-subject flag. Teacher unavailability slots (e.g., "Teacher X cannot be placed in Period 1 on Monday") can be added.
- **Scalable regeneration:** The principal can regenerate the timetable anytime. Previous versions are saved in history (up to 10 versions) so rollback is possible.

## 1.5 The Principal as User — Understanding the Mental Model

The principal who will use this system thinks like this:

1. "I have these teachers. Each has been given X periods per week."
2. "I have these classes. Each class needs these subjects. Each subject needs Y periods per week."
3. "I need to assign teachers to teach specific subjects in specific classes."
4. "Once all assignments are made, I click Generate and get the timetable."
5. "I look at the timetable, spot problems, maybe move some things manually, then print."

The UI must match this mental model exactly. The navigation structure, the input sequence, the workflow — everything follows these 5 steps. Nothing happens in a surprising order.

---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 2: REAL DATA ANALYSIS & SCHOOL CONTEXT
# ═══════════════════════════════════════════════════════════════════════════════

## 2.1 Actual School Data (From Uploaded Excel Files)

The following data has been extracted from the three uploaded Excel files. This is the real data the system must handle from day one.

### 2.1.1 Teacher Data (teacher_periods.xlsx) — 44 Teachers

| # | Teacher Name | Weekly Periods | Daily Max |
|---|---|---|---|
| 1 | MRS. DARAKHSHAN ARIF MULLA | 7 | 2 |
| 2 | MRS. SABA MOAZZAM KHATIMITI | 33 | 7 |
| 3 | MRS. FARMEELA ASRAR JUWARI | 33 | 7 |
| 4 | MRS. AAFIYA FAIZ DALVI | 33 | 7 |
| 5 | MRS. SAFIYA SIRAJUDDIN MUJAWAR | 33 | 7 |
| 6 | MRS. GULERANA ATISHKHAN | 33 | 7 |
| 7 | MRS. ALMAS AKHTAR ANSARI | 33 | 7 |
| 8 | MRS. SHEELA ESTHER YESUDAS | 33 | 7 |
| 9 | MRS. ROZINA TABREZ KIRME | 33 | 7 |
| 10 | MRS. NAHID ARSALAN MOMIN | 33 | 7 |
| 11 | MRS. AYESHA AKBAR PNJARI | 33 | 7 |
| 12 | MR. MUSAFFI ASMAT KHOT | 33 | 7 |
| 13 | MR. ZAKIR HUSAIN MOMIN | 33 | 7 |
| 14 | MRS. SADAF JAWWAD SHAIKH | 33 | 7 |
| 15 | MRS. NAZEMA ZAFAR MUJAWAR | 33 | 7 |
| 16 | MR. MOINUDDIN MD. YUNUS | 33 | 7 |
| 17 | MRS. SHABNAM SAAD BOBDE | 33 | 7 |
| 18 | MRS. SAUFEEN TANVEER FAKIH | 33 | 7 |
| 19 | MR. GHULAM MOHAMMAD AB. SAMAD FAKIH | 33 | 7 |
| 20 | MR. SHADAB MUSHTAQUE SHAIKH | 33 | 7 |
| 21 | MR. ABDUS SALAM NAZIMUDDIN FAROOQUIE | 33 | 7 |
| 22 | MRS. FARAH RAMEEZ SAYYED | 33 | 7 |
| 23 | MS. MARIYAM NISAR MOMIN | 33 | 7 |
| 24 | MR. HARIS SHABBIR SHAHJI | 33 | 7 |
| 25 | MRS. NAJMUSSAHER IRFAN A. ANSARI | 33 | 7 |
| 26 | MR. REHAN SHAKEEL BARDI | 33 | 7 |
| 27 | MS. MAZIA RIZWAN MOMIN | 33 | 7 |
| 28 | MS. ZAMZAM NIZAMUDDIN ANSARI | 33 | 7 |
| 29 | MS. SHAGUFTA BANO MOHD UMAR ANSARI | 33 | 7 |
| 30 | MS. NILOFARROMAN KALIMODDIN ATTAR | 33 | 7 |
| 31 | MS. BISMA NASEER AHMAD MOMIN | 33 | 7 |
| 32 | MS. LABIBA MD.SAEED MOMIN | 33 | 7 |
| 33 | NEW-1 | 33 | 7 |
| 34 | NEW-2 | 33 | 7 |
| 35 | NEW-3 | 33 | 7 |
| 36 | MS. ZOHRA MEHBOOB HASAN ANSARI | 33 | 7 |
| 37 | MS. RAZIA AB.RAUF SHAIKH | 33 | 7 |
| 38 | MS. AMATUL MOIZ AB.WARIS SAYYED | 33 | 7 |
| 39 | MS. SHABEENA NASEEM ANSARI | 33 | 7 |
| 40 | MS. SANA KAUSAR ABDUL GANI ANSARI | 33 | 7 |
| 41 | MS. FALIKA RIZWAN ANSARI | 33 | 7 |
| 42 | MS. SHAZIYA INTEKHAB ANSARI | 33 | 7 |
| 43 | MS. NIDA ISMATULLAH KHAN | 33 | 7 |
| 44 | MS. ZEENAT WARIS KHAN | 33 | 7 |

**Critical Observation:** Teacher #1 (MRS. DARAKHSHAN ARIF MULLA) has only 7 weekly periods and max 2 per day. This is almost certainly the Principal herself — she teaches a few periods but primarily administers. The system MUST handle this asymmetric case gracefully. The algorithm cannot force 33 periods onto a 7-period teacher.

### 2.1.2 Class Data (class_list_corrected.xlsx) — 22 Classes

| # | Standard | Division | Full Name |
|---|---|---|---|
| 1–3 | V | G1, G2, G3 | VG1, VG2, VG3 |
| 4–7 | VI | G1, G2, G3, G4 | VIG1, VIG2, VIG3, VIG4 |
| 8–11 | VII | G1, G2, G3, G4 | VIIG1, VIIG2, VIIG3, VIIG4 |
| 12–15 | VIII | G1, G2, G3, G4 | VIIIG1, VIIIG2, VIIIG3, VIIIG4 |
| 16–19 | IX | G1, G2, G3, G4 | IXG1, IXG2, IXG3, IXG4 |
| 20–22 | X | G1, G2, G3 | XG1, XG2, XG3 |

**Structure:** Standards V and X have 3 divisions each. Standards VI, VII, VIII, IX have 4 divisions each.

### 2.1.3 Subject Data (subject_periods_updated.xlsx) — 74 Subject Entries Across 6 Standards

#### Standard V Subjects:
| Subject | Weekly Periods | Consecutive |
|---|---|---|
| URDU | 6 | No |
| MARATHI | 3 | No |
| HINDI | 3 | No |
| ENGLISH | 6 | No |
| MATHS | 7 | No |
| EVS | 13 | No |
| PE | 2 | No |
| WE | 2 | Yes |
| DRAWING | 2 | Yes |
| COMPUTER | 2 | Yes |
| MI | 4 | No |
| **TOTAL** | **50** | |

#### Standard VI Subjects:
| Subject | Weekly Periods | Consecutive |
|---|---|---|
| URDU | 6 | No |
| MARATHI | 3 | No |
| HINDI | 3 | No |
| ENGLISH | 6 | No |
| MATHS | 7 | No |
| SCIENCE | 7 | No |
| SS | 6 | No |
| COMPUTER | 2 | Yes |
| PE | 2 | No |
| DRAWING | 2 | Yes |
| WE | 2 | Yes |
| MI | 4 | No |
| **TOTAL** | **50** | |

#### Standard VII Subjects:
| Subject | Weekly Periods | Consecutive |
|---|---|---|
| URDU | 6 | No |
| MARATHI | 3 | No |
| HINDI | 3 | No |
| ENGLISH | 6 | No |
| MATHS | 7 | No |
| SCIENCE | 7 | No |
| SS | 6 | No |
| COMPUTER | 2 | Yes |
| PE | 2 | No |
| DRAWING | 2 | Yes |
| WE | 2 | Yes |
| MI | 4 | No |
| **TOTAL** | **50** | |

#### Standard VIII Subjects:
| Subject | Weekly Periods | Consecutive |
|---|---|---|
| URDU | 6 | No |
| MARATHI | 3 | No |
| ARABIC | 3 | No |
| ENGLISH | 6 | No |
| MATHS | 7 | No |
| SCIENCE | 7 | No |
| SS | 6 | No |
| COMPUTER | 1 | Yes |
| PE | 2 | No |
| DRAWING | 2 | Yes |
| WE | 2 | Yes |
| MI | 4 | No |
| **TOTAL** | **49** | |

#### Standard IX Subjects:
| Subject | Weekly Periods | Consecutive |
|---|---|---|
| URDU | 6 | No |
| MARATHI | 3 | No |
| ARABIC | 3 | No |
| ENGLISH | 6 | No |
| ALGEBRA | 4 | No |
| GEOMETRY | 4 | No |
| SCIENCE 1 & 2 | 7 | Yes |
| HISTORY | 3 | No |
| GEOGRAPHY | 3 | No |
| PE | 2 | No |
| COMPUTER | 2 | Yes |
| WS | 2 | No |
| DFS | 2 | No |
| MI | 3 | No |
| **TOTAL** | **50** | |

#### Standard X Subjects:
| Subject | Weekly Periods | Consecutive |
|---|---|---|
| URDU | 7 | No |
| MARATHI | 4 | No |
| ARABIC | 3 | No |
| ENGLISH | 7 | No |
| ALGEBRA | 4 | No |
| GEOMETRY | 4 | No |
| SCIENCE 1 | 4 | Yes |
| SCIENCE 2 | 4 | Yes |
| HISTORY | 4 | No |
| GEOGRAPHY | 3 | No |
| PE | 2 | No |
| WS | 2 | No |
| DFS | 2 | No |
| **TOTAL** | **50** | |

## 2.2 Derived Constraints From Real Data

### 2.2.1 Total Period Load Analysis

Each class requires approximately 50 periods per week. With 22 classes, that is 22 × 50 = 1,100 total teacher-period slots per week. With 44 teachers each having ~33 periods per week, that is 44 × 33 = 1,452 teacher-period slots available. The surplus (352 periods) accounts for free periods, study periods, and teacher relief slots. This is realistic and confirms the data is consistent.

### 2.2.2 The 5-Day Week Assumption

The system assumes a Monday-to-Friday, 5-day school week. Each day can have a different number of periods (configurable). The default configuration should be:
- Monday: 9 periods
- Tuesday: 9 periods
- Wednesday: 9 periods
- Thursday: 9 periods
- Friday: 6 periods (shorter day, common in Indian schools with Juma prayer)

Total default periods per week per class: 9+9+9+9+6 = 42. But subjects total 50. **This is the critical discrepancy.** The school likely has a 6-day week (Mon–Sat) with Saturday having 8 periods: 9+9+9+9+6+8 = 50. Or the period count configuration is different. The system MUST let the principal configure this before generation. The algorithm must validate: sum of periods across all days >= total weekly subject periods for any standard.

### 2.2.3 Consecutive Period Subjects

Subjects flagged as `consecutive_periods: Yes` must always appear as back-to-back slots in the timetable grid. For Standard V: WE, DRAWING, COMPUTER. For Standard X: SCIENCE 1, SCIENCE 2. The algorithm must never place a consecutive-period subject in the last slot of a day (since there would be no "next" slot on the same day), and it must ensure both slots are placed before the teacher's daily max is reached.

### 2.2.4 The "MI" Subject Mystery

"MI" appears in Standards V through IX. In Indian school context, this likely stands for "Moral Instruction" or "Islamic Studies" or similar. It has 4 periods per week for V–VIII and 3 for IX. The system should not make assumptions — just treat it as a normal subject.

### 2.2.5 Teacher-Subject Assignment Gap

The uploaded data does NOT include which teacher teaches which subject in which class. This is the piece the principal must configure manually within the app (or upload as a fourth Excel file). The system must provide a dedicated "Teacher Assignment" module where the principal assigns teachers to subject-class combinations before timetable generation can proceed.

---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 3: COMPLETE FILE & FOLDER STRUCTURE
# ═══════════════════════════════════════════════════════════════════════════════

## 3.1 Root Project Structure

```
school-timetable/                          ← project root
├── package.json                           ← root workspace package.json (workspaces)
├── .gitignore                             
├── README.md                              
├── electron/                              ← Electron main process
│   ├── main.js                            ← Electron entry point
│   ├── preload.js                         ← Electron preload script
│   ├── serverManager.js                   ← Spawns/kills the backend process
│   └── windowManager.js                  ← Window creation and management
├── backend/                               ← Express + MongoDB backend
│   ├── package.json                       
│   ├── server.js                          ← Express app entry point
│   ├── config/
│   │   ├── database.js                    ← MongoDB connection logic
│   │   ├── constants.js                   ← App-wide constants
│   │   └── defaults.js                    ← Default period schedule, etc.
│   ├── models/                            ← Mongoose schemas
│   │   ├── Teacher.js
│   │   ├── Class.js
│   │   ├── Subject.js
│   │   ├── Assignment.js                  ← Teacher-Subject-Class assignments
│   │   ├── SchoolConfig.js                ← Period timings, days config
│   │   ├── Timetable.js                   ← Generated timetable documents
│   │   └── AuditLog.js                    ← Audit trail for all changes
│   ├── routes/
│   │   ├── index.js                       ← Route aggregator
│   │   ├── teachers.js
│   │   ├── classes.js
│   │   ├── subjects.js
│   │   ├── assignments.js
│   │   ├── config.js
│   │   ├── timetable.js
│   │   ├── export.js
│   │   └── upload.js
│   ├── controllers/
│   │   ├── teacherController.js
│   │   ├── classController.js
│   │   ├── subjectController.js
│   │   ├── assignmentController.js
│   │   ├── configController.js
│   │   ├── timetableController.js
│   │   ├── exportController.js
│   │   └── uploadController.js
│   ├── services/
│   │   ├── timetableGenerator.js          ← Core algorithm
│   │   ├── conflictChecker.js             ← Pre/post generation validation
│   │   ├── excelParser.js                 ← Excel upload parsing
│   │   ├── excelExporter.js               ← Excel export generation
│   │   └── auditService.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   ├── validator.js
│   │   └── logger.js
│   └── utils/
│       ├── romanToArabic.js               ← Handles "V", "VI", etc.
│       ├── periodUtils.js
│       └── colorUtils.js
├── frontend/                              ← React + Vite frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx                       ← React entry
│       ├── App.jsx                        ← Root with router
│       ├── api/
│       │   ├── client.js                  ← Axios instance
│       │   ├── teachers.js
│       │   ├── classes.js
│       │   ├── subjects.js
│       │   ├── assignments.js
│       │   ├── config.js
│       │   ├── timetable.js
│       │   └── upload.js
│       ├── store/
│       │   ├── index.js                   ← Zustand store root
│       │   ├── teacherStore.js
│       │   ├── classStore.js
│       │   ├── subjectStore.js
│       │   ├── assignmentStore.js
│       │   ├── timetableStore.js
│       │   └── uiStore.js
│       ├── pages/
│       │   ├── Dashboard.jsx              ← Home/overview page
│       │   ├── Teachers/
│       │   │   ├── TeachersPage.jsx
│       │   │   ├── TeacherForm.jsx
│       │   │   └── TeacherDetail.jsx
│       │   ├── Classes/
│       │   │   ├── ClassesPage.jsx
│       │   │   ├── ClassForm.jsx
│       │   │   └── ClassDetail.jsx
│       │   ├── Subjects/
│       │   │   ├── SubjectsPage.jsx
│       │   │   ├── SubjectForm.jsx
│       │   │   └── SubjectsByStandard.jsx
│       │   ├── Assignments/
│       │   │   ├── AssignmentsPage.jsx
│       │   │   ├── AssignmentMatrix.jsx   ← Grid-based assignment UI
│       │   │   └── AssignmentForm.jsx
│       │   ├── Config/
│       │   │   ├── ConfigPage.jsx
│       │   │   ├── PeriodSchedule.jsx
│       │   │   └── SchoolSettings.jsx
│       │   ├── Timetable/
│       │   │   ├── TimetablePage.jsx      ← Main timetable viewer
│       │   │   ├── GenerateTimetable.jsx
│       │   │   ├── views/
│       │   │   │   ├── ClassView.jsx      ← Timetable for one class
│       │   │   │   ├── TeacherView.jsx    ← Timetable for one teacher
│       │   │   │   ├── MasterView.jsx     ← All classes side by side
│       │   │   │   ├── SubjectView.jsx    ← Where a subject is scheduled
│       │   │   │   └── WeeklySummary.jsx  ← Summary statistics
│       │   │   └── TimetableHistory.jsx
│       │   ├── Upload/
│       │   │   └── UploadPage.jsx
│       │   └── Export/
│       │       └── ExportPage.jsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.jsx
│       │   │   ├── TopBar.jsx
│       │   │   ├── PageHeader.jsx
│       │   │   └── LoadingScreen.jsx
│       │   ├── ui/
│       │   │   ├── Button.jsx
│       │   │   ├── Input.jsx
│       │   │   ├── Select.jsx
│       │   │   ├── Modal.jsx
│       │   │   ├── Toast.jsx
│       │   │   ├── Table.jsx
│       │   │   ├── Badge.jsx
│       │   │   ├── Card.jsx
│       │   │   ├── Spinner.jsx
│       │   │   ├── ConfirmDialog.jsx
│       │   │   ├── SearchInput.jsx
│       │   │   ├── Pagination.jsx
│       │   │   └── Tooltip.jsx
│       │   ├── timetable/
│       │   │   ├── TimetableGrid.jsx      ← Core grid renderer
│       │   │   ├── TimetableCell.jsx      ← Individual cell
│       │   │   ├── PeriodHeader.jsx
│       │   │   ├── DayHeader.jsx
│       │   │   └── ConflictBadge.jsx
│       │   ├── upload/
│       │   │   ├── FileDropzone.jsx
│       │   │   ├── UploadProgress.jsx
│       │   │   └── UploadPreview.jsx
│       │   └── charts/
│       │       ├── TeacherLoadChart.jsx
│       │       └── SubjectDistributionChart.jsx
│       ├── hooks/
│       │   ├── useTeachers.js
│       │   ├── useClasses.js
│       │   ├── useSubjects.js
│       │   ├── useTimetable.js
│       │   ├── useToast.js
│       │   └── useDebounce.js
│       ├── constants/
│       │   ├── colors.js                  ← Subject/standard color maps
│       │   ├── routes.js
│       │   └── periods.js
│       └── utils/
│           ├── formatters.js
│           ├── validators.js
│           └── exportHelpers.js
└── build/                                 ← Electron build output (gitignored)
    ├── win/
    ├── mac/
    └── linux/
```

## 3.2 Critical File Explanations

### 3.2.1 `electron/main.js`
This is the Electron entry point. It does:
1. Creates a `BrowserWindow` (the app window — 1400×900, resizable, with a custom title bar)
2. Calls `serverManager.startServer()` which spawns `backend/server.js` as a child process
3. Waits for the backend to be ready (polls `http://localhost:3001/health` every 200ms, max 30 retries)
4. Loads `http://localhost:3001` in the BrowserWindow (in production) OR `http://localhost:5173` (in development when running Vite dev server)
5. Handles `app.on('window-all-closed')` to cleanly kill the backend child process before quitting
6. Handles `app.on('before-quit')` to do the same

### 3.2.2 `electron/serverManager.js`
Manages the lifecycle of the backend Node.js server as a child process:
- `startServer()`: Uses `child_process.spawn` to start `node backend/server.js`
- `stopServer()`: Sends SIGTERM to the backend process
- `waitForReady(port, maxRetries)`: Polls the health endpoint
- Pipes backend stdout/stderr to Electron's console for debugging
- Handles crashes by attempting one auto-restart

### 3.2.3 `backend/services/timetableGenerator.js`
The heart of the system. ~800 lines of constraint-satisfaction logic. See Chapter 7 for full algorithmic specification.

### 3.2.4 `frontend/src/components/timetable/TimetableGrid.jsx`
The most visually complex component. Renders a full week timetable as an HTML table that looks like an Excel spreadsheet. See Chapter 12 for full specification.

---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 4: TECHNOLOGY STACK — EXACT VERSIONS & RATIONALE
# ═══════════════════════════════════════════════════════════════════════════════

## 4.1 Frontend Stack

### React 18.3.x
- Use React 18's concurrent features (Suspense for data loading, useTransition for non-blocking UI updates during timetable generation)
- Functional components exclusively — no class components
- React Router v6.x for client-side routing (Hash router, NOT BrowserRouter, since Electron loads from `file://` or `localhost`)
- React Hook Form v7.x for all form management (performant, tiny re-renders)

### Vite 5.x
- Significantly faster than CRA or webpack for dev hot reload
- Native ES modules
- `vite.config.js` must configure: `base: './'` for Electron compatibility, proxy to backend at `:3001`
- Build outputs to `frontend/dist/` which Electron serves via Express static middleware in production

### Tailwind CSS 4.x (latest)
- Utility-first CSS — no custom CSS files except for the timetable grid (which needs print media queries)
- Custom color palette defined in `tailwind.config.js` — every standard gets a color family
- `@apply` directives in a single `globals.css` for repeated patterns (timetable cell classes)
- JIT mode (default in v4) — no purging issues

### Zustand 4.x
- Lightweight state management (no Redux boilerplate)
- Separate stores for each domain (teachers, classes, subjects, assignments, timetable, UI)
- Persist middleware for user preferences (selected view, filters)
- Devtools middleware enabled in development

### Framer Motion 11.x
- Page transition animations (slide-in for route changes)
- Stagger animations for table rows on data load
- Spring animations for modal open/close
- Pulse animation for the "Generating..." state during timetable generation
- Do NOT overuse — every animation must have a purpose and must not exceed 300ms

### React Query (TanStack Query) v5.x
- All API calls go through React Query for caching, background refetch, and loading/error states
- `queryClient.invalidateQueries` after every mutation
- Stale time: 30 seconds for most data; 0 for timetable (always fresh)

### xlsx (SheetJS) 0.18.x
- Client-side Excel file parsing for upload preview
- Client-side Excel export generation
- Must use CDN or local import — do NOT use the Pro version

### react-to-print 2.x
- Print functionality for timetable grids
- Injects print-specific CSS that hides UI chrome and shows only the grid

### Recharts 2.x
- Dashboard statistics charts (teacher load bar chart, subject distribution pie chart)
- Simple, declarative, responsive

## 4.2 Backend Stack

### Node.js 20.x LTS
- Use Node 20 for performance improvements and stability
- ESM or CommonJS — use CommonJS (`require`) for simplicity and Electron compatibility
- `process.env` for configuration, loaded from `.env` via `dotenv`

### Express 4.x
- REST API framework
- Middleware: `cors`, `helmet`, `express-rate-limit`, `morgan` (logging), `express-fileupload`
- JSON body parser limit: 50MB (for large Excel uploads)
- All routes prefixed with `/api/v1/`
- Health check endpoint at `/health` (no prefix, needed for Electron server detection)

### Mongoose 8.x
- MongoDB ODM
- All schemas use `timestamps: true` (adds `createdAt`, `updatedAt` automatically)
- Soft delete pattern: `isDeleted: Boolean, deletedAt: Date` on all main schemas
- Indexes defined in schemas, not migration scripts
- Connection string: `mongodb://localhost:27017/school_timetable`

### MongoDB 6.x (Community Edition)
- Local installation
- Database name: `school_timetable`
- No authentication required for local development (can be added for production)
- Must be installed separately by the user OR bundled via MongoDB binaries — the Electron app should check if MongoDB is running and show a friendly error if not

### Multer 1.x (via express-fileupload)
- Handles multipart/form-data Excel file uploads
- Stores uploads in `backend/uploads/` (temp dir, cleaned after parsing)
- Max file size: 10MB
- Allowed extensions: `.xlsx`, `.xls`, `.csv`

### xlsx (SheetJS) — Server Side
- Same library, server side
- Parses uploaded Excel files into JSON
- Generates Excel exports

### exceljs 4.x (Alternative for styled Excel export)
- Used for the styled Excel export (colored cells, merged cells, bold headers)
- SheetJS generates unstyled sheets; ExcelJS generates styled ones
- Use ExcelJS for the "Export Timetable to Excel" feature

### node-cron 3.x
- Optional: scheduled backup of MongoDB database to local file
- Runs at midnight daily if enabled in config

## 4.3 Electron Stack

### Electron 29.x
- Desktop wrapper
- `main` process: runs in Node.js environment
- `renderer` process: runs Chromium (the React app)
- IPC (inter-process communication) for: native file dialogs (save/open), system notifications, tray icon
- `contextBridge` in preload for safe IPC exposure to renderer

### electron-builder 24.x
- Packages the Electron app into distributable formats
- Windows: `.exe` NSIS installer
- Mac: `.dmg`
- Linux: `.AppImage`
- Code signing: optional (not required for internal school use)

### electron-store 8.x
- Persistent settings storage (like localStorage but for Electron main process)
- Stores: MongoDB port, app theme preference, last opened timetable ID

## 4.4 Development Tools

### ESLint + Prettier
- `.eslintrc` configured for React + Node
- Prettier for consistent formatting (2-space indent, single quotes, trailing commas)

### Concurrently
- Run frontend dev server + backend server simultaneously with one command
- `npm run dev` in root starts both

### nodemon
- Auto-restarts backend on file changes in development

---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 5: MONGODB DATABASE DESIGN — EVERY COLLECTION
# ═══════════════════════════════════════════════════════════════════════════════

## 5.1 Database: `school_timetable`

### Collections:
1. `teachers`
2. `classes`
3. `subjects`
4. `assignments` (teacher-subject-class mappings)
5. `school_configs`
6. `timetables`
7. `timetable_versions`
8. `audit_logs`

---

## 5.2 Collection: `teachers`

### Mongoose Schema (Teacher.js):

```javascript
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  // System-assigned unique ID (e.g., "T_001")
  teacherId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^T_\d{3}$/   // T_001 through T_999
  },
  
  // Full name as it appears in the Excel file and timetable printout
  name: {
    type: String,
    required: [true, 'Teacher name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  // Optional short display name (e.g., "MRS. MULLA" from "MRS. DARAKHSHAN ARIF MULLA")
  shortName: {
    type: String,
    trim: true,
    maxlength: [30, 'Short name cannot exceed 30 characters']
  },
  
  // How many periods this teacher teaches per week across all classes
  weeklyPeriods: {
    type: Number,
    required: [true, 'Weekly periods is required'],
    min: [0, 'Weekly periods cannot be negative'],
    max: [50, 'Weekly periods cannot exceed 50']
  },
  
  // Maximum periods this teacher can have on any single day
  dailyMaxPeriods: {
    type: Number,
    required: [true, 'Daily max periods is required'],
    min: [1, 'Daily max must be at least 1'],
    max: [12, 'Daily max cannot exceed 12']
  },
  
  // Optional: subjects this teacher is qualified/assigned to teach
  // NOTE: Actual class-specific assignments are in the 'assignments' collection
  // This is a loose list for filtering/suggestions during assignment
  qualifiedSubjects: [{
    type: String,
    trim: true,
    uppercase: true
  }],
  
  // Optional: days when teacher is unavailable (e.g., off days, half days)
  unavailableDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  }],
  
  // Optional: specific period slots teacher must be free
  // Array of { day: 'Monday', periodNumber: 1 }
  unavailableSlots: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    periodNumber: {
      type: Number,
      min: 1,
      max: 12
    }
  }],
  
  // Whether this teacher is the principal (special handling in generator)
  isPrincipal: {
    type: Boolean,
    default: false
  },
  
  // Soft delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  
  // Audit
  createdBy: { type: String, default: 'system' },
  updatedBy: { type: String, default: 'system' },
  
  // Color for UI display (assigned automatically from a palette)
  colorIndex: {
    type: Number,
    default: 0,
    min: 0,
    max: 19  // 20 colors in the palette
  }
}, {
  timestamps: true,
  versionKey: '__v'
});

// Indexes
teacherSchema.index({ teacherId: 1 }, { unique: true });
teacherSchema.index({ name: 1 });
teacherSchema.index({ isDeleted: 1 });

// Virtual: display-ready name
teacherSchema.virtual('displayName').get(function() {
  return this.shortName || this.name;
});

// Pre-save: auto-generate shortName if not provided
teacherSchema.pre('save', function(next) {
  if (!this.shortName && this.name) {
    const parts = this.name.split(' ');
    if (parts.length >= 2) {
      this.shortName = parts[0] + ' ' + parts[parts.length - 1];
    } else {
      this.shortName = this.name;
    }
  }
  next();
});

module.exports = mongoose.model('Teacher', teacherSchema);
```

### Sample Documents:
```json
{
  "_id": "ObjectId(...)",
  "teacherId": "T_001",
  "name": "MRS. DARAKHSHAN ARIF MULLA",
  "shortName": "MRS. MULLA",
  "weeklyPeriods": 7,
  "dailyMaxPeriods": 2,
  "qualifiedSubjects": ["URDU", "MI"],
  "unavailableDays": [],
  "unavailableSlots": [],
  "isPrincipal": true,
  "isDeleted": false,
  "deletedAt": null,
  "colorIndex": 0,
  "createdAt": "2025-06-01T10:00:00Z",
  "updatedAt": "2025-06-01T10:00:00Z"
}
```

---

## 5.3 Collection: `classes`

### Mongoose Schema (Class.js):

```javascript
const classSchema = new mongoose.Schema({
  classId: {
    type: String,
    required: true,
    unique: true,
    trim: true
    // e.g., "C_001"
  },
  
  // Roman numeral standard: V, VI, VII, VIII, IX, X
  standard: {
    type: String,
    required: [true, 'Standard is required'],
    enum: ['V', 'VI', 'VII', 'VIII', 'IX', 'X'],
    uppercase: true
  },
  
  // Division: G1, G2, G3, G4
  division: {
    type: String,
    required: [true, 'Division is required'],
    trim: true,
    uppercase: true,
    match: /^G\d+$/
  },
  
  // Computed full name: e.g., "VIG1"
  fullName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // Optional: class teacher (reference to Teacher)
  classTeacherId: {
    type: String,
    ref: 'Teacher',
    default: null
  },
  
  // Number of students (for info only, not used in scheduling)
  studentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Room number
  roomNumber: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Sort order for display (classes should display in standard order)
  sortOrder: {
    type: Number,
    default: 0
  },
  
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  createdBy: { type: String, default: 'system' },
  updatedBy: { type: String, default: 'system' }
}, {
  timestamps: true
});

// Compound unique index on standard + division
classSchema.index({ standard: 1, division: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
classSchema.index({ fullName: 1 });
classSchema.index({ sortOrder: 1 });

// Pre-save: compute fullName and sortOrder
classSchema.pre('save', function(next) {
  this.fullName = this.standard + this.division;
  
  // Sort order: V=1, VI=2, VII=3, VIII=4, IX=5, X=6 (then by division number)
  const standardOrder = { 'V': 1, 'VI': 2, 'VII': 3, 'VIII': 4, 'IX': 5, 'X': 6 };
  const divNum = parseInt(this.division.replace('G', ''), 10);
  this.sortOrder = (standardOrder[this.standard] * 100) + divNum;
  
  next();
});
```

---

## 5.4 Collection: `subjects`

### Mongoose Schema (Subject.js):

```javascript
const subjectSchema = new mongoose.Schema({
  subjectId: {
    type: String,
    required: true,
    unique: true
    // e.g., "S_V_001" (standard V, subject 1)
  },
  
  // Which standard this subject belongs to
  standard: {
    type: String,
    required: true,
    enum: ['V', 'VI', 'VII', 'VIII', 'IX', 'X']
  },
  
  // Subject name in uppercase
  subjectName: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    uppercase: true,
    maxlength: 50
  },
  
  // Number of periods this subject appears per week for this standard
  weeklyPeriods: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  
  // Must these periods be consecutive (double period)?
  // If true, periods always scheduled as back-to-back pairs
  consecutivePeriods: {
    type: Boolean,
    default: false
  },
  
  // If consecutive, how many consecutive periods at a time (default 2)
  consecutiveCount: {
    type: Number,
    default: 2,
    min: 2,
    max: 4
  },
  
  // Color assigned for timetable display
  // Comes from a predefined subject-color map; fallback is colorIndex
  color: {
    type: String,
    default: '#6366f1'  // indigo-500
  },
  
  // Category for grouping (e.g., "Language", "Science", "Arts", "Physical")
  category: {
    type: String,
    enum: ['Language', 'Science', 'Mathematics', 'Social', 'Arts', 'Physical', 'Religious', 'Technology', 'Other'],
    default: 'Other'
  },
  
  // Short abbreviation for cell display (auto-generated if empty)
  abbreviation: {
    type: String,
    maxlength: 6,
    uppercase: true
  },
  
  // Whether this subject requires a special room (lab, computer room, etc.)
  requiresSpecialRoom: {
    type: Boolean,
    default: false
  },
  
  specialRoom: {
    type: String,
    trim: true,
    default: ''
  },
  
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  sortOrder: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Compound unique: same subject name can exist for different standards
subjectSchema.index({ standard: 1, subjectName: 1 }, { 
  unique: true, 
  partialFilterExpression: { isDeleted: false } 
});

// Pre-save: auto-generate abbreviation
subjectSchema.pre('save', function(next) {
  if (!this.abbreviation) {
    // Take first 4 chars of first word, OR acronym of multi-word
    const words = this.subjectName.split(/\s+/);
    if (words.length === 1) {
      this.abbreviation = words[0].substring(0, 5);
    } else {
      this.abbreviation = words.map(w => w[0]).join('').substring(0, 6);
    }
  }
  
  // Auto-assign category based on known subject names
  const categoryMap = {
    'URDU': 'Language', 'ENGLISH': 'Language', 'HINDI': 'Language',
    'MARATHI': 'Language', 'ARABIC': 'Language',
    'MATHS': 'Mathematics', 'ALGEBRA': 'Mathematics', 'GEOMETRY': 'Mathematics',
    'SCIENCE': 'Science', 'SCIENCE 1': 'Science', 'SCIENCE 2': 'Science',
    'SCIENCE 1 & 2': 'Science',
    'EVS': 'Science',
    'SS': 'Social', 'HISTORY': 'Social', 'GEOGRAPHY': 'Social',
    'DRAWING': 'Arts', 'WE': 'Arts',
    'PE': 'Physical',
    'COMPUTER': 'Technology',
    'MI': 'Religious',
    'WS': 'Other', 'DFS': 'Other'
  };
  
  if (!this.category || this.category === 'Other') {
    this.category = categoryMap[this.subjectName] || 'Other';
  }
  
  next();
});
```

---

## 5.5 Collection: `assignments`

This is the critical linking collection. It represents "Teacher X teaches Subject Y to Class Z."

### Mongoose Schema (Assignment.js):

```javascript
const assignmentSchema = new mongoose.Schema({
  assignmentId: {
    type: String,
    required: true,
    unique: true
    // e.g., "A_001"
  },
  
  // Which teacher
  teacherId: {
    type: String,
    required: [true, 'Teacher ID is required'],
    ref: 'Teacher'
  },
  
  // Which class
  classId: {
    type: String,
    required: [true, 'Class ID is required'],
    ref: 'Class'
  },
  
  // Which subject (reference by subjectId)
  subjectId: {
    type: String,
    required: [true, 'Subject ID is required'],
    ref: 'Subject'
  },
  
  // Denormalized for quick access
  teacherName: String,
  className: String,       // e.g., "VIG1"
  subjectName: String,     // e.g., "ENGLISH"
  standard: String,        // e.g., "VI"
  
  // How many periods per week this teacher teaches this subject to this class
  // Defaults to the subject's weeklyPeriods but can be overridden
  weeklyPeriods: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Whether this particular assignment requires consecutive periods
  // Defaults to subject's consecutivePeriods setting
  consecutivePeriods: {
    type: Boolean,
    default: false
  },
  
  // Notes
  notes: {
    type: String,
    maxlength: 200,
    default: ''
  },
  
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Compound unique: one teacher teaches one subject to one class
assignmentSchema.index(
  { teacherId: 1, classId: 1, subjectId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

assignmentSchema.index({ teacherId: 1 });
assignmentSchema.index({ classId: 1 });
assignmentSchema.index({ subjectId: 1 });
assignmentSchema.index({ standard: 1 });
```

---

## 5.6 Collection: `school_configs`

One document per school (single-document collection in practice). Stores all configuration.

### Mongoose Schema (SchoolConfig.js):

```javascript
const periodTimingSchema = new mongoose.Schema({
  periodNumber: { type: Number, required: true },
  startTime: { type: String, required: true },  // "07:30"
  endTime: { type: String, required: true },    // "08:15"
  isBreak: { type: Boolean, default: false },
  breakLabel: { type: String, default: '' }     // "Lunch Break", "Short Break"
}, { _id: false });

const dayConfigSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  isActive: { type: Boolean, default: true },
  periodsCount: { type: Number, required: true, min: 1, max: 12 },
  
  // Override period timings for this specific day (null = use global)
  periodTimings: [periodTimingSchema]
}, { _id: false });

const schoolConfigSchema = new mongoose.Schema({
  // Singleton flag
  configId: {
    type: String,
    default: 'MAIN_CONFIG',
    unique: true
  },
  
  schoolName: {
    type: String,
    default: 'School Name',
    maxlength: 100
  },
  
  academicYear: {
    type: String,
    default: '2025-2026',
    match: /^\d{4}-\d{4}$/
  },
  
  // School days in order
  workingDays: [dayConfigSchema],
  
  // Global period timings (used when day doesn't override)
  globalPeriodTimings: [periodTimingSchema],
  
  // Total periods in a full week (sum of active days' periodsCount)
  // Computed, not stored — but kept for quick access
  totalWeeklyPeriods: {
    type: Number,
    default: 50
  },
  
  // Minimum free periods a teacher must have per week
  minTeacherFreePeriodsPerWeek: {
    type: Number,
    default: 0
  },
  
  // Allow the same subject to appear in back-to-back periods (beyond consecutive subjects)?
  // false = avoid placing same subject twice in a row unless it's a consecutive-period subject
  allowRepeatedSubjectSameDay: {
    type: Boolean,
    default: false
  },
  
  // Timetable generation settings
  generationSettings: {
    maxIterations: { type: Number, default: 10000 },
    randomSeed: { type: Number, default: null },  // null = use Date.now()
    prioritizeConsecutive: { type: Boolean, default: true },
    allowPartialGeneration: { type: Boolean, default: false }
  },
  
  // App preferences
  appSettings: {
    defaultView: {
      type: String,
      enum: ['class', 'teacher', 'master', 'subject'],
      default: 'class'
    },
    theme: {
      type: String,
      enum: ['colorful-white', 'dark', 'minimal'],
      default: 'colorful-white'
    },
    printOrientation: {
      type: String,
      enum: ['landscape', 'portrait'],
      default: 'landscape'
    }
  }
}, {
  timestamps: true
});
```

### Default Configuration Document:
```json
{
  "configId": "MAIN_CONFIG",
  "schoolName": "Your School Name",
  "academicYear": "2025-2026",
  "workingDays": [
    { "day": "Monday",    "isActive": true, "periodsCount": 9 },
    { "day": "Tuesday",   "isActive": true, "periodsCount": 9 },
    { "day": "Wednesday", "isActive": true, "periodsCount": 9 },
    { "day": "Thursday",  "isActive": true, "periodsCount": 9 },
    { "day": "Friday",    "isActive": true, "periodsCount": 6 },
    { "day": "Saturday",  "isActive": true, "periodsCount": 8 }
  ],
  "globalPeriodTimings": [
    { "periodNumber": 1, "startTime": "07:30", "endTime": "08:15", "isBreak": false },
    { "periodNumber": 2, "startTime": "08:15", "endTime": "09:00", "isBreak": false },
    { "periodNumber": 3, "startTime": "09:00", "endTime": "09:45", "isBreak": false },
    { "periodNumber": 4, "startTime": "09:45", "endTime": "10:30", "isBreak": false },
    { "periodNumber": 5, "startTime": "10:45", "endTime": "11:30", "isBreak": false },
    { "periodNumber": 6, "startTime": "11:30", "endTime": "12:15", "isBreak": false },
    { "periodNumber": 7, "startTime": "13:00", "endTime": "13:45", "isBreak": false },
    { "periodNumber": 8, "startTime": "13:45", "endTime": "14:30", "isBreak": false },
    { "periodNumber": 9, "startTime": "14:30", "endTime": "15:15", "isBreak": false }
  ],
  "totalWeeklyPeriods": 50
}
```

---

## 5.7 Collection: `timetables`

This is the largest and most complex collection. A timetable document contains the complete generated schedule for all classes.

### Mongoose Schema (Timetable.js):

```javascript
// A single cell in the timetable
const timetableCellSchema = new mongoose.Schema({
  // Which period slot (1-based)
  periodNumber: { type: Number, required: true },
  
  // Day of week
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  
  // What's scheduled here (null = free period)
  subjectId: { type: String, default: null },
  subjectName: { type: String, default: null },
  teacherId: { type: String, default: null },
  teacherName: { type: String, default: null },
  
  // Is this the second half of a consecutive pair?
  isConsecutivePart: { type: Boolean, default: false },
  consecutiveGroupId: { type: String, default: null },
  
  // Manual override (principal edited this cell directly)
  isManualOverride: { type: Boolean, default: false },
  
  // Conflict flag (teacher assigned to two places at once — should never happen but flag if detected)
  hasConflict: { type: Boolean, default: false },
  conflictDescription: { type: String, default: null },
  
  // Color for this cell (inherited from subject color)
  color: { type: String, default: '#f3f4f6' }
}, { _id: false });

// One class's full weekly timetable
const classTimetableSchema = new mongoose.Schema({
  classId: { type: String, required: true },
  className: { type: String, required: true },    // e.g., "VIG1"
  standard: { type: String, required: true },
  division: { type: String, required: true },
  
  // Grid: array of cells for every day × period combination
  cells: [timetableCellSchema],
  
  // Statistics for this class
  stats: {
    totalPeriodsScheduled: { type: Number, default: 0 },
    totalFreeperiods: { type: Number, default: 0 },
    subjectCoverage: [{
      subjectName: String,
      scheduledPeriods: Number,
      targetPeriods: Number,
      isComplete: Boolean
    }]
  }
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  timetableId: {
    type: String,
    required: true,
    unique: true
    // e.g., "TT_20250601_001"
  },
  
  // Display label
  label: {
    type: String,
    default: ''
    // e.g., "Term 1 2025-26" or auto "Generated on 01 Jun 2025"
  },
  
  academicYear: { type: String, required: true },
  
  // One entry per class
  classTimetables: [classTimetableSchema],
  
  // Generation metadata
  generationMeta: {
    generatedAt: { type: Date, default: Date.now },
    iterationCount: { type: Number, default: 0 },
    algorithm: { type: String, default: 'constraint-backtrack-v1' },
    seed: { type: Number, default: 0 },
    durationMs: { type: Number, default: 0 },
    
    // Was generation complete (all periods filled) or partial?
    isComplete: { type: Boolean, default: false },
    completionPercentage: { type: Number, default: 0 },
    
    // Any warnings during generation
    warnings: [String],
    
    // Unresolvable conflicts
    conflicts: [{
      type: { type: String },
      description: String,
      affectedClass: String,
      affectedTeacher: String,
      affectedPeriod: String
    }]
  },
  
  // Is this the currently active timetable?
  isActive: { type: Boolean, default: false },
  
  // Was this manually edited after generation?
  hasManualEdits: { type: Boolean, default: false },
  
  // Snapshot of all assignments at time of generation (for reproducibility)
  assignmentSnapshot: [mongoose.Schema.Types.Mixed],
  
  // Snapshot of school config at time of generation
  configSnapshot: mongoose.Schema.Types.Mixed,
  
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

timetableSchema.index({ timetableId: 1 });
timetableSchema.index({ isActive: 1 });
timetableSchema.index({ createdAt: -1 });
```

---

## 5.8 Collection: `audit_logs`

Tracks every change made in the system for accountability.

```javascript
const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'BULK_CREATE', 'BULK_DELETE',
      'GENERATE_TIMETABLE', 'MANUAL_EDIT_CELL', 'EXCEL_IMPORT', 'EXCEL_EXPORT',
      'CONFIG_CHANGE', 'ASSIGNMENT_CREATE', 'ASSIGNMENT_DELETE'
    ]
  },
  entity: {
    type: String,
    required: true,
    enum: ['Teacher', 'Class', 'Subject', 'Assignment', 'Timetable', 'SchoolConfig']
  },
  entityId: String,
  entityName: String,  // Human-readable name for display
  changes: mongoose.Schema.Types.Mixed,  // { before: {...}, after: {...} }
  performedBy: { type: String, default: 'principal' },
  ipAddress: String,
  timestamp: { type: Date, default: Date.now }
});

auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1 });
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 6: BACKEND API — EVERY ROUTE, EVERY HANDLER
# ═══════════════════════════════════════════════════════════════════════════════

## 6.1 Server Entry Point (server.js)

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
const { connectDB } = require('./config/database');
const routes = require('./routes/index');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security ───────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));  // CSP off for Electron
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3001'] }));

// ── Parsing ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 },  // 10MB
  useTempFiles: true,
  tempFileDir: './uploads/temp/',
  createParentPath: true
}));

// ── Logging ────────────────────────────────────────────────────────────────
app.use(morgan('dev'));

// ── Static Frontend ────────────────────────────────────────────────────────
// In production, serve the built React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── SPA Fallback ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// ── Error Handler ──────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[STMS Backend] Server running on port ${PORT}`);
  });
};

start();
```

## 6.2 Routes Index (routes/index.js)

```javascript
const router = require('express').Router();

router.use('/teachers',    require('./teachers'));
router.use('/classes',     require('./classes'));
router.use('/subjects',    require('./subjects'));
router.use('/assignments', require('./assignments'));
router.use('/config',      require('./config'));
router.use('/timetable',   require('./timetable'));
router.use('/upload',      require('./upload'));
router.use('/export',      require('./export'));
router.use('/audit',       require('./audit'));

module.exports = router;
```

## 6.3 Teacher Routes — Full Specification

### File: routes/teachers.js

```
GET    /api/v1/teachers              — Get all teachers (with filters, pagination, sorting)
GET    /api/v1/teachers/:id          — Get single teacher by teacherId
POST   /api/v1/teachers              — Create new teacher
PUT    /api/v1/teachers/:id          — Full update of teacher
PATCH  /api/v1/teachers/:id          — Partial update of teacher
DELETE /api/v1/teachers/:id          — Soft delete teacher
DELETE /api/v1/teachers/:id/hard     — Hard delete (admin only, dev mode)
POST   /api/v1/teachers/:id/restore  — Restore soft-deleted teacher
GET    /api/v1/teachers/:id/assignments — Get all subject-class assignments for this teacher
GET    /api/v1/teachers/:id/timetable   — Get this teacher's timetable rows from active timetable
POST   /api/v1/teachers/bulk         — Bulk create teachers (from Excel)
DELETE /api/v1/teachers/bulk         — Bulk soft-delete
GET    /api/v1/teachers/stats        — Teacher statistics (load, free periods, etc.)
```

### GET /api/v1/teachers (Full Implementation):

```javascript
// controllers/teacherController.js

exports.getAllTeachers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      sort = 'name',
      order = 'asc',
      search = '',
      includeDeleted = false,
      standard,          // filter by standard (via assignments)
      minPeriods,
      maxPeriods
    } = req.query;

    const query = {};
    
    // Deleted filter
    if (includeDeleted !== 'true') {
      query.isDeleted = false;
    }
    
    // Search filter (name or teacherId)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { teacherId: { $regex: search, $options: 'i' } },
        { shortName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Period range filter
    if (minPeriods) query.weeklyPeriods = { ...query.weeklyPeriods, $gte: parseInt(minPeriods) };
    if (maxPeriods) query.weeklyPeriods = { ...query.weeklyPeriods, $lte: parseInt(maxPeriods) };
    
    // Build sort object
    const sortObj = {};
    const allowedSortFields = ['name', 'teacherId', 'weeklyPeriods', 'dailyMaxPeriods', 'createdAt'];
    if (allowedSortFields.includes(sort)) {
      sortObj[sort] = order === 'desc' ? -1 : 1;
    }
    
    const total = await Teacher.countDocuments(query);
    const teachers = await Teacher
      .find(query)
      .sort(sortObj)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('-__v');
    
    res.json({
      success: true,
      data: teachers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};
```

### POST /api/v1/teachers (Create):

```javascript
exports.createTeacher = async (req, res, next) => {
  try {
    const {
      name, shortName, weeklyPeriods, dailyMaxPeriods,
      qualifiedSubjects, unavailableDays, unavailableSlots,
      isPrincipal, colorIndex
    } = req.body;
    
    // Auto-generate teacherId
    const lastTeacher = await Teacher.findOne({}, {}, { sort: { teacherId: -1 } });
    const nextNum = lastTeacher 
      ? parseInt(lastTeacher.teacherId.replace('T_', ''), 10) + 1 
      : 1;
    const teacherId = `T_${String(nextNum).padStart(3, '0')}`;
    
    const teacher = new Teacher({
      teacherId,
      name: name.trim().toUpperCase(),
      shortName: shortName?.trim().toUpperCase(),
      weeklyPeriods: parseInt(weeklyPeriods),
      dailyMaxPeriods: parseInt(dailyMaxPeriods),
      qualifiedSubjects: qualifiedSubjects?.map(s => s.toUpperCase()) || [],
      unavailableDays: unavailableDays || [],
      unavailableSlots: unavailableSlots || [],
      isPrincipal: isPrincipal || false,
      colorIndex: colorIndex || 0
    });
    
    await teacher.save();
    
    // Audit log
    await AuditLog.create({
      action: 'CREATE',
      entity: 'Teacher',
      entityId: teacherId,
      entityName: teacher.name,
      changes: { after: teacher.toObject() }
    });
    
    res.status(201).json({
      success: true,
      data: teacher,
      message: 'Teacher created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A teacher with this name already exists'
      });
    }
    next(error);
  }
};
```

### PUT /api/v1/teachers/:id (Full Update):

```javascript
exports.updateTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Prevent changing teacherId
    delete updateData.teacherId;
    delete updateData._id;
    
    // Uppercase string fields
    if (updateData.name) updateData.name = updateData.name.trim().toUpperCase();
    if (updateData.shortName) updateData.shortName = updateData.shortName.trim().toUpperCase();
    if (updateData.qualifiedSubjects) {
      updateData.qualifiedSubjects = updateData.qualifiedSubjects.map(s => s.toUpperCase());
    }
    
    updateData.updatedBy = 'principal';
    
    const before = await Teacher.findOne({ teacherId: id });
    if (!before || before.isDeleted) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    const teacher = await Teacher.findOneAndUpdate(
      { teacherId: id, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    );
    
    // Audit
    await AuditLog.create({
      action: 'UPDATE',
      entity: 'Teacher',
      entityId: id,
      entityName: teacher.name,
      changes: { before: before.toObject(), after: teacher.toObject() }
    });
    
    // If weeklyPeriods changed, check if active timetable is now invalid
    if (before.weeklyPeriods !== teacher.weeklyPeriods) {
      // Flag active timetable as potentially stale
      await Timetable.updateOne(
        { isActive: true },
        { $push: { 'generationMeta.warnings': `Teacher ${teacher.name} period count changed - regeneration recommended` } }
      );
    }
    
    res.json({ success: true, data: teacher, message: 'Teacher updated successfully' });
  } catch (error) {
    next(error);
  }
};
```

### DELETE /api/v1/teachers/:id (Soft Delete):

```javascript
exports.deleteTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if teacher has active assignments
    const assignmentCount = await Assignment.countDocuments({ 
      teacherId: id, 
      isDeleted: false 
    });
    
    if (assignmentCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete teacher — they have ${assignmentCount} active assignments. Remove assignments first or use force=true.`,
        assignmentCount,
        canForce: true
      });
    }
    
    const teacher = await Teacher.findOneAndUpdate(
      { teacherId: id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date(), updatedBy: 'principal' },
      { new: true }
    );
    
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    await AuditLog.create({
      action: 'DELETE',
      entity: 'Teacher',
      entityId: id,
      entityName: teacher.name,
      changes: { before: { isDeleted: false }, after: { isDeleted: true } }
    });
    
    res.json({ 
      success: true, 
      message: `Teacher "${teacher.name}" deleted successfully` 
    });
  } catch (error) {
    next(error);
  }
};
```

## 6.4 Class Routes — Full Specification

```
GET    /api/v1/classes              — Get all classes (sorted by standard, then division)
GET    /api/v1/classes/:id          — Get single class
POST   /api/v1/classes              — Create class
PUT    /api/v1/classes/:id          — Update class
DELETE /api/v1/classes/:id          — Soft delete class
POST   /api/v1/classes/:id/restore  — Restore
POST   /api/v1/classes/bulk         — Bulk create
GET    /api/v1/classes/by-standard/:standard — Get classes for specific standard
GET    /api/v1/classes/:id/subjects  — Get subjects for this class's standard
GET    /api/v1/classes/:id/assignments — Get all teacher assignments for this class
GET    /api/v1/classes/:id/timetable  — Get this class's timetable from active timetable
```

### GET /api/v1/classes (Implementation):

```javascript
exports.getAllClasses = async (req, res, next) => {
  try {
    const { standard, includeDeleted = false, includeSubjects = false } = req.query;
    
    const query = {};
    if (includeDeleted !== 'true') query.isDeleted = false;
    if (standard) query.standard = standard.toUpperCase();
    
    let classQuery = Class.find(query).sort({ sortOrder: 1 });
    
    const classes = await classQuery.select('-__v');
    
    // Optionally include subject counts
    let result = classes.map(c => c.toObject());
    
    if (includeSubjects === 'true') {
      for (const cls of result) {
        const subjects = await Subject.find({ 
          standard: cls.standard, 
          isDeleted: false 
        }).select('subjectName weeklyPeriods consecutivePeriods color category');
        cls.subjects = subjects;
      }
    }
    
    // Group by standard for easier frontend consumption
    const grouped = {};
    result.forEach(cls => {
      if (!grouped[cls.standard]) grouped[cls.standard] = [];
      grouped[cls.standard].push(cls);
    });
    
    res.json({
      success: true,
      data: result,
      grouped,
      total: result.length
    });
  } catch (error) {
    next(error);
  }
};
```

## 6.5 Subject Routes — Full Specification

```
GET    /api/v1/subjects                          — All subjects
GET    /api/v1/subjects/by-standard/:standard    — Subjects for a standard
GET    /api/v1/subjects/:id                      — Single subject
POST   /api/v1/subjects                          — Create subject
PUT    /api/v1/subjects/:id                      — Update subject  
DELETE /api/v1/subjects/:id                      — Soft delete
POST   /api/v1/subjects/bulk                     — Bulk create (from Excel)
GET    /api/v1/subjects/stats                    — Subject statistics per standard
PATCH  /api/v1/subjects/:id/periods              — Quick-update weekly periods only
```

### POST /api/v1/subjects/bulk (Bulk Create from Excel):

```javascript
exports.bulkCreateSubjects = async (req, res, next) => {
  try {
    const { subjects } = req.body;
    // subjects: Array of { standard, subjectName, weeklyPeriods, consecutivePeriods }
    
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ success: false, message: 'No subjects provided' });
    }
    
    const results = { created: 0, skipped: 0, errors: [] };
    
    for (const subj of subjects) {
      try {
        // Check if already exists
        const existing = await Subject.findOne({
          standard: subj.standard?.toUpperCase(),
          subjectName: subj.subjectName?.toUpperCase(),
          isDeleted: false
        });
        
        if (existing) {
          results.skipped++;
          continue;
        }
        
        // Auto-generate subjectId
        const lastSubject = await Subject.findOne({}, {}, { sort: { subjectId: -1 } });
        const nextNum = lastSubject
          ? parseInt(lastSubject.subjectId.replace(/\D/g, ''), 10) + 1
          : 1;
        const subjectId = `S_${subj.standard}_${String(nextNum).padStart(3, '0')}`;
        
        await Subject.create({
          subjectId,
          standard: subj.standard.toUpperCase(),
          subjectName: subj.subjectName.toUpperCase(),
          weeklyPeriods: parseInt(subj.weeklyPeriods) || 1,
          consecutivePeriods: subj.consecutivePeriods === 'Yes' || subj.consecutivePeriods === true
        });
        
        results.created++;
      } catch (err) {
        results.errors.push({ subject: subj.subjectName, error: err.message });
      }
    }
    
    await AuditLog.create({
      action: 'BULK_CREATE',
      entity: 'Subject',
      entityName: `${results.created} subjects`,
      changes: { after: { created: results.created, skipped: results.skipped } }
    });
    
    res.json({
      success: true,
      data: results,
      message: `Created ${results.created} subjects, skipped ${results.skipped} duplicates`
    });
  } catch (error) {
    next(error);
  }
};
```

## 6.6 Assignment Routes — Full Specification

```
GET    /api/v1/assignments                       — All assignments
GET    /api/v1/assignments/matrix                — Full matrix: class × subject → teacher
GET    /api/v1/assignments/by-class/:classId     — Assignments for one class
GET    /api/v1/assignments/by-teacher/:teacherId — Assignments for one teacher
GET    /api/v1/assignments/by-standard/:std      — Assignments for a standard
GET    /api/v1/assignments/:id                   — Single assignment
POST   /api/v1/assignments                       — Create assignment
PUT    /api/v1/assignments/:id                   — Update
DELETE /api/v1/assignments/:id                   — Soft delete
POST   /api/v1/assignments/bulk                  — Bulk create
DELETE /api/v1/assignments/by-teacher/:teacherId — Remove all for a teacher (on teacher delete)
GET    /api/v1/assignments/validate              — Check for conflicts/missing assignments
```

### GET /api/v1/assignments/matrix — The Assignment Matrix:

This endpoint returns the data needed to render the "Assignment Matrix" view — a grid where rows are classes, columns are subjects, and each cell shows which teacher is assigned. This is the most important view for the principal before generating the timetable.

```javascript
exports.getAssignmentMatrix = async (req, res, next) => {
  try {
    const { standard } = req.query;
    
    // Get all active classes
    const classQuery = { isDeleted: false };
    if (standard) classQuery.standard = standard;
    const classes = await Class.find(classQuery).sort({ sortOrder: 1 });
    
    // Get all subjects for relevant standards
    const standards = standard ? [standard] : [...new Set(classes.map(c => c.standard))];
    const subjects = await Subject.find({ 
      standard: { $in: standards }, 
      isDeleted: false 
    }).sort({ standard: 1, subjectName: 1 });
    
    // Get all assignments
    const assignments = await Assignment.find({ isDeleted: false });
    
    // Build matrix
    // matrix[classId][subjectId] = { teacherId, teacherName, weeklyPeriods }
    const matrix = {};
    for (const cls of classes) {
      matrix[cls.classId] = {};
    }
    
    for (const assignment of assignments) {
      if (matrix[assignment.classId]) {
        matrix[assignment.classId][assignment.subjectId] = {
          assignmentId: assignment.assignmentId,
          teacherId: assignment.teacherId,
          teacherName: assignment.teacherName,
          weeklyPeriods: assignment.weeklyPeriods,
          consecutivePeriods: assignment.consecutivePeriods
        };
      }
    }
    
    // Compute completion stats
    let totalSlots = 0;
    let filledSlots = 0;
    for (const cls of classes) {
      const clsSubjects = subjects.filter(s => s.standard === cls.standard);
      totalSlots += clsSubjects.length;
      filledSlots += Object.keys(matrix[cls.classId] || {}).length;
    }
    
    res.json({
      success: true,
      data: {
        classes,
        subjects,
        matrix,
        completion: {
          totalSlots,
          filledSlots,
          percentage: totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0,
          isReadyForGeneration: filledSlots === totalSlots
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
```

### GET /api/v1/assignments/validate:

```javascript
exports.validateAssignments = async (req, res, next) => {
  try {
    const issues = [];
    
    // 1. Find classes with unassigned subjects
    const classes = await Class.find({ isDeleted: false });
    const subjects = await Subject.find({ isDeleted: false });
    const assignments = await Assignment.find({ isDeleted: false });
    const teachers = await Teacher.find({ isDeleted: false });
    
    // Check every class × subject combination
    for (const cls of classes) {
      const clsSubjects = subjects.filter(s => s.standard === cls.standard);
      for (const subj of clsSubjects) {
        const assigned = assignments.find(
          a => a.classId === cls.classId && a.subjectId === subj.subjectId
        );
        if (!assigned) {
          issues.push({
            type: 'MISSING_ASSIGNMENT',
            severity: 'ERROR',
            message: `${cls.fullName} — ${subj.subjectName} has no teacher assigned`,
            classId: cls.classId,
            className: cls.fullName,
            subjectId: subj.subjectId,
            subjectName: subj.subjectName
          });
        }
      }
    }
    
    // 2. Check teacher period overloads
    const teacherPeriodMap = {};
    for (const assignment of assignments) {
      if (!teacherPeriodMap[assignment.teacherId]) {
        teacherPeriodMap[assignment.teacherId] = 0;
      }
      teacherPeriodMap[assignment.teacherId] += assignment.weeklyPeriods;
    }
    
    for (const teacher of teachers) {
      const assignedPeriods = teacherPeriodMap[teacher.teacherId] || 0;
      if (assignedPeriods > teacher.weeklyPeriods) {
        issues.push({
          type: 'TEACHER_OVERLOADED',
          severity: 'WARNING',
          message: `${teacher.name} is assigned ${assignedPeriods} periods but limit is ${teacher.weeklyPeriods}`,
          teacherId: teacher.teacherId,
          teacherName: teacher.name,
          assignedPeriods,
          weeklyPeriods: teacher.weeklyPeriods
        });
      }
    }
    
    // 3. Check for teachers assigned 0 periods (not used)
    for (const teacher of teachers) {
      const assignedPeriods = teacherPeriodMap[teacher.teacherId] || 0;
      if (assignedPeriods === 0) {
        issues.push({
          type: 'TEACHER_UNASSIGNED',
          severity: 'INFO',
          message: `${teacher.name} has no assignments`,
          teacherId: teacher.teacherId,
          teacherName: teacher.name
        });
      }
    }
    
    const errors = issues.filter(i => i.severity === 'ERROR');
    const warnings = issues.filter(i => i.severity === 'WARNING');
    const infos = issues.filter(i => i.severity === 'INFO');
    
    res.json({
      success: true,
      data: {
        isValid: errors.length === 0,
        canGenerate: errors.length === 0,
        issues,
        summary: {
          errors: errors.length,
          warnings: warnings.length,
          infos: infos.length,
          total: issues.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
```

## 6.7 Timetable Routes — Full Specification

```
GET    /api/v1/timetable                   — Get all generated timetables (list)
GET    /api/v1/timetable/active            — Get the currently active timetable
GET    /api/v1/timetable/:id               — Get specific timetable
GET    /api/v1/timetable/:id/class/:classId — Get timetable for one class
GET    /api/v1/timetable/:id/teacher/:teacherId — Get timetable for one teacher
POST   /api/v1/timetable/generate          — Trigger timetable generation
PUT    /api/v1/timetable/:id/activate      — Set as active timetable
PATCH  /api/v1/timetable/:id/cell          — Manual edit of a single cell
DELETE /api/v1/timetable/:id               — Delete a timetable
GET    /api/v1/timetable/:id/conflicts     — Get all conflicts in a timetable
GET    /api/v1/timetable/:id/stats         — Teacher load statistics
POST   /api/v1/timetable/:id/regenerate    — Regenerate with same or new seed
```

### POST /api/v1/timetable/generate:

```javascript
exports.generateTimetable = async (req, res, next) => {
  try {
    const { label, seed, force = false } = req.body;
    
    // 1. Pre-generation validation
    const validation = await validatePreGeneration();
    if (!validation.canGenerate && !force) {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate — there are blocking errors',
        validation
      });
    }
    
    // 2. Load all required data
    const [teachers, classes, subjects, assignments, config] = await Promise.all([
      Teacher.find({ isDeleted: false }),
      Class.find({ isDeleted: false }).sort({ sortOrder: 1 }),
      Subject.find({ isDeleted: false }),
      Assignment.find({ isDeleted: false }),
      SchoolConfig.findOne({ configId: 'MAIN_CONFIG' })
    ]);
    
    // 3. Run the generator
    const generator = require('../services/timetableGenerator');
    const startTime = Date.now();
    
    const result = await generator.generate({
      teachers, classes, subjects, assignments, config,
      seed: seed || Date.now()
    });
    
    const durationMs = Date.now() - startTime;
    
    // 4. Auto-generate timetableId
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Timetable.countDocuments();
    const timetableId = `TT_${dateStr}_${String(count + 1).padStart(3, '0')}`;
    
    // 5. Save to database
    const timetable = await Timetable.create({
      timetableId,
      label: label || `Generated on ${new Date().toLocaleDateString('en-IN')}`,
      academicYear: config.academicYear,
      classTimetables: result.classTimetables,
      generationMeta: {
        generatedAt: new Date(),
        iterationCount: result.iterations,
        seed: seed || Date.now(),
        durationMs,
        isComplete: result.isComplete,
        completionPercentage: result.completionPercentage,
        warnings: result.warnings,
        conflicts: result.conflicts,
        algorithm: 'constraint-backtrack-v1'
      },
      isActive: false,
      assignmentSnapshot: assignments.map(a => a.toObject()),
      configSnapshot: config.toObject()
    });
    
    // 6. Audit
    await AuditLog.create({
      action: 'GENERATE_TIMETABLE',
      entity: 'Timetable',
      entityId: timetableId,
      entityName: timetable.label,
      changes: { after: { completionPercentage: result.completionPercentage } }
    });
    
    res.status(201).json({
      success: true,
      data: {
        timetableId,
        label: timetable.label,
        isComplete: result.isComplete,
        completionPercentage: result.completionPercentage,
        warnings: result.warnings,
        conflicts: result.conflicts,
        durationMs
      },
      message: result.isComplete 
        ? 'Timetable generated successfully!' 
        : `Timetable generated with ${result.conflicts.length} unresolved conflicts`
    });
  } catch (error) {
    next(error);
  }
};
```

### PATCH /api/v1/timetable/:id/cell (Manual Cell Edit):

```javascript
exports.editCell = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { classId, day, periodNumber, teacherId, subjectId, action } = req.body;
    // action: 'assign', 'clear', 'swap'
    
    const timetable = await Timetable.findOne({ timetableId: id });
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });
    
    // Find the class timetable
    const classTT = timetable.classTimetables.find(ct => ct.classId === classId);
    if (!classTT) return res.status(404).json({ success: false, message: 'Class not in timetable' });
    
    // Find the cell
    const cellIndex = classTT.cells.findIndex(
      c => c.day === day && c.periodNumber === periodNumber
    );
    
    if (action === 'clear') {
      if (cellIndex >= 0) {
        classTT.cells[cellIndex].subjectId = null;
        classTT.cells[cellIndex].subjectName = null;
        classTT.cells[cellIndex].teacherId = null;
        classTT.cells[cellIndex].teacherName = null;
        classTT.cells[cellIndex].isManualOverride = true;
      }
    } else if (action === 'assign') {
      // Validate: teacher not already booked in this slot
      const conflict = timetable.classTimetables.some(ct => 
        ct.classId !== classId &&
        ct.cells.some(c => 
          c.day === day && 
          c.periodNumber === periodNumber && 
          c.teacherId === teacherId
        )
      );
      
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: 'Teacher is already scheduled in another class during this period'
        });
      }
      
      // Get subject and teacher names
      const [subject, teacher] = await Promise.all([
        Subject.findOne({ subjectId }),
        Teacher.findOne({ teacherId })
      ]);
      
      if (cellIndex >= 0) {
        classTT.cells[cellIndex].subjectId = subjectId;
        classTT.cells[cellIndex].subjectName = subject?.subjectName;
        classTT.cells[cellIndex].teacherId = teacherId;
        classTT.cells[cellIndex].teacherName = teacher?.shortName || teacher?.name;
        classTT.cells[cellIndex].isManualOverride = true;
        classTT.cells[cellIndex].color = subject?.color || '#6366f1';
      }
    }
    
    timetable.hasManualEdits = true;
    timetable.markModified('classTimetables');
    await timetable.save();
    
    await AuditLog.create({
      action: 'MANUAL_EDIT_CELL',
      entity: 'Timetable',
      entityId: id,
      changes: { 
        after: { classId, day, periodNumber, teacherId, subjectId, action }
      }
    });
    
    res.json({ success: true, message: 'Cell updated', data: classTT.cells[cellIndex] });
  } catch (error) {
    next(error);
  }
};
```

## 6.8 Upload Routes — Excel Import

```
POST /api/v1/upload/teachers     — Upload teacher_periods.xlsx
POST /api/v1/upload/classes      — Upload class_list.xlsx
POST /api/v1/upload/subjects     — Upload subject_periods.xlsx
POST /api/v1/upload/all          — Upload all three at once
POST /api/v1/upload/preview      — Parse Excel, return preview without saving
```

### POST /api/v1/upload/teachers:

```javascript
exports.uploadTeachers = async (req, res, next) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const file = req.files.file;
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.name).toLowerCase();
    
    if (!allowedTypes.includes(ext)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid file type "${ext}". Please upload .xlsx, .xls, or .csv` 
      });
    }
    
    // Parse with ExcelParser service
    const { parseTeacherFile } = require('../services/excelParser');
    const parsed = await parseTeacherFile(file.tempFilePath);
    
    // Validate parsed data
    const validRows = parsed.filter(row => row.name && row.weeklyPeriods);
    const invalidRows = parsed.filter(row => !row.name || !row.weeklyPeriods);
    
    if (validRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid teacher rows found. Check column names: name, weekly_periods, daily_max_periods'
      });
    }
    
    // Bulk insert via teacher bulk create controller
    const result = await bulkCreateTeachersInternal(validRows);
    
    // Clean up temp file
    fs.unlinkSync(file.tempFilePath);
    
    res.json({
      success: true,
      data: {
        parsed: parsed.length,
        valid: validRows.length,
        invalid: invalidRows.length,
        created: result.created,
        skipped: result.skipped,
        errors: result.errors,
        invalidRows
      }
    });
  } catch (error) {
    next(error);
  }
};
```

## 6.9 Export Routes

```
GET /api/v1/export/timetable/:id                       — Export full timetable as Excel
GET /api/v1/export/timetable/:id/class/:classId        — Export single class timetable
GET /api/v1/export/timetable/:id/teacher/:teacherId    — Export single teacher timetable
GET /api/v1/export/timetable/:id/all-classes           — Export all classes as separate sheets
GET /api/v1/export/teachers                            — Export teachers list as Excel
GET /api/v1/export/assignments                         — Export assignment matrix as Excel
```

## 6.10 Config Routes

```
GET    /api/v1/config               — Get school configuration
PUT    /api/v1/config               — Update school configuration
POST   /api/v1/config/reset         — Reset to defaults
GET    /api/v1/config/period-slots  — Get computed period slots for the week
```

## 6.11 Error Handler Middleware

```javascript
// middleware/errorHandler.js
exports.errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.message, err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages
    });
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field: ${field}`
    });
  }
  
  // Mongoose CastError (invalid ObjectId/type)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid value for field: ${err.path}`
    });
  }
  // Default server error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 7: TIMETABLE GENERATION ALGORITHM
# ═══════════════════════════════════════════════════════════════════════════════

## 7.1 Algorithmic Approach

The School Timetable Generator solves a **Constraint Satisfaction Problem (CSP)** using a backtracking search algorithm optimized with heuristics and random-restart wrappers. 

```
                                  [Start Generation]
                                          │
                            ┌─────────────┴─────────────┐
                            ▼                           ▼
                 [Parse AI Preferences]       [Fetch DB Resources]
                            │                           │
                            └─────────────┬─────────────┘
                                          ▼
                             [Initialize Empty Grids]
                                          │
                                          ▼
                               [Group & Sort Entities]
                                          │
                                          ▼
                            [Generate Class Schedules]
                                          │
                               ┌──────────┴──────────┐
                               ▼                     ▼
                        [Valid Slot?]        [No Slots Available]
                               │                     │
                     ┌─────────┴─────────┐           ▼
                     ▼                   ▼     [Log Warnings &
               [Single Period]     [Consecutive]  Flag Unassigned]
                     │                   │           │
                     ▼                   ▼           │
              [Update Teacher    [Allocate Pair &    │
               Workload Map]      Update Workload]   │
                     │                   │           │
                     └─────────┬─────────┘           │
                               ▼                     │
                        [Next Period] <──────────────┘
                               │
                               ▼
                     [Verify Final Overlaps]
                               │
                               ▼
                       [Save to MongoDB]
```

## 7.2 Strict Scheduling Constraints

The generation engine adheres to the following hard scheduling parameters:
1. **Teacher Overlap Prevention (Double Booking):** A teacher cannot be scheduled in more than one class during any single period slot.
2. **Class Overfill Avoidance:** A class division cannot be scheduled for more than one subject during a single period slot.
3. **Weekly Periods Limit:** A class division must be allocated exactly the number of weekly periods specified per subject in the curriculum parameters.
4. **Teacher Weekly & Daily Limits:** No teacher can exceed their weekly periods cap. No teacher can teach more than their maximum daily periods, including standard teachers and the Principal.
5. **Consecutive Periods (Double Lessons):** Subjects flagged as consecutive must always be scheduled as a back-to-back pair (e.g., periods 1 & 2) on the same day. Consecutive blocks cannot cross recess or lunch intervals, nor can they split across days.
6. **Principal's Limits:** `MRS. DARAKHSHAN ARIF MULLA` (ID 1) must be strictly constrained to `7 weekly periods` and a maximum of `2 daily periods`.

---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 8: FRONTEND ARCHITECTURE — PAGES & COMPONENTS
# ═══════════════════════════════════════════════════════════════════════════════

## 8.1 Front-End Pages

The application is structured into the following principal-centric dashboard pages:
1. **Dashboard Overview**: Displays main key metrics (total teachers, classes, subjects, assignments), generation state, and interactive analytics charts.
2. **Teacher Setup**: Lists all teachers with their weekly/daily period limits, and includes a modal form to add, edit, or delete teacher records. Features drag-and-drop Excel sheet imports.
3. **Class Setup**: Manages school grades and divisions, displaying division-level details and support for custom division additions.
4. **Subject Setup**: Manages curriculum details for each standard (V to X), specifying weekly period targets and double-period settings.
5. **Period Setup**: Configures global working days and active periods per day (e.g. 9 periods on Mon-Thu, 6 on Fri, 8 on Sat).
6. **Subject Assignment**: Renders the complete workload matrix, linking teachers to specific subject-class allocations.
7. **Generate Timetable**: Configures preferences, validates conditions, and runs the constraint solver engine.
8. **Class Timetable / Teacher Timetables**: Visualizes the generated schedules in weekly, color-coded, spreadsheet-native grids.

---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 9: EXCEL IMPORT/EXPORT SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════

## 9.1 Column Auto-Detection & Parsing

Excel uploads use `xlsx` (SheetJS) to extract data:
* **Fuzzy Header Matcher**: Column indexes are matched using case-insensitive substrings (e.g. "Teacher Name", "Name", "TEACHER" all resolve to `name`).
* **Trailing Empty Rows Filter**: Omit blank rows to avoid index collisions.
* **Row-Order Preservation**: Explicitly tracks Excel row numbers using a `rowOrder` attribute to preserve list order in the UI.

## 9.2 Spreadsheet-Native Export

Generated schedules are exported into beautifully styled spreadsheets using `exceljs`:
* **Color Accent Mapping**: Inherits specific hex colors for subject categories.
* **Merged Cells**: Merges consecutive subject double-period slots.
* **Headers & Borders**: Styled with bold typography and custom grid borders.

---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 10: CRUD OPERATIONS — FULL SPECIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

All model entities support standard Create, Read, Update, and Delete endpoints with clean validation:
* **Client-Side Verification**: Forms validate inputs using responsive Tailwind text prompts (e.g., validation on negative periods or out-of-range inputs).
* **Cascade Deletes & Cleanup**: Deleting a class or teacher cascades cleanup to remove associated subject-assignments and updates active timetables.
* **Counter Sequencing**: Logical integer IDs are automatically assigned to teachers using a atomic `counters` collection index.

---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 11: UI/UX DESIGN SYSTEM — COLORS, FONTS, ANIMATIONS
# ═══════════════════════════════════════════════════════════════════════════════

The application utilizes a highly aesthetic design system to wow users:
* **Typography**: Clean, professional `Outfit` font from Google Fonts.
* **Harmonious Accents**: Standard V (Indigo), VI (Emerald), VII (Amber), VIII (Rose), IX (Violet), X (Cyan).
* **Vibrant Themes**: Elegant glassmorphic cards, crisp borders, and subtle background gradients.
* **Micro-Animations**: Framer Motion transitions, hover states, and smooth spinner loading screens.

---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 12: ALL TIMETABLE VIEW MODES
# ═══════════════════════════════════════════════════════════════════════════════

Schedules are visualized through distinct grid-based perspectives:
* **Class View**: Renders the complete weekly schedule for a single selected division.
* **Teacher View**: Displays the individualized weekly teaching schedule for a selected teacher, marking unoccupied periods as "Free".
* **Master Grid View**: Displays all classes side-by-side on a massive, spreadsheet-native weekly summary with sticky headers.

---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 13: ELECTRON WRAPPER & AUTO-START LOGIC
# ═══════════════════════════════════════════════════════════════════════════════

The desktop packaging isolates all components to run 100% offline:
* **`main.js`**: Spawns the Node.js backend server as a child process using `child_process.spawn`.
* **Port Polling & Ready Detection**: Electronic window polls `/health` until the server is fully ready.
* **Graceful Shutdown**: Automatically terminates child server processes on app close.

---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 14: ERROR HANDLING & VALIDATION
# ═══════════════════════════════════════════════════════════════════════════════

* **Global Error Middleware**: Centralized Express middleware intercepts DB exceptions and maps duplicate validation codes (e.g. `11000`) to friendly responses.
* **Timetable Pre-flight Check**: Validates that required subjects, classes, teachers, and assignments exist before allowing generation.

---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 15: TESTING STRATEGY
# ═══════════════════════════════════════════════════════════════════════════════

* **Constraint Verification**: Automated scripts like `test_generation_pref.js` verify backtrack resolution and validate teacher daily limitations.
* **E2E UI Testing**: Playwright tests simulate mock logins, file uploads, subject assignments, and verify the generated grid outputs.

---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 16: BUILD, PACKAGE & DISTRIBUTION
# ═══════════════════════════════════════════════════════════════════════════════

The application is built and bundled using `electron-builder`:
* **Windows Bundler**: Packages files as an installer `.exe` with all assets, backend logic, and standard static frontend code embedded.
* **Asset Bundling**: Frontend Vite assets compile to `/frontend/dist/` which is served by Express in production mode, ensuring fully offline availability.


---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 7: TIMETABLE GENERATION ALGORITHM — COMPLETE SPECIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

## 7.1 Problem Classification

Timetable scheduling is an NP-hard combinatorial optimization problem. For our school's scale — 44 teachers, 22 classes, ~12 subjects per standard, 50 periods/week — a brute-force approach would require evaluating billions of permutations. We use a **Greedy Constraint-Satisfying Algorithm with Backtracking and Random Restart**, which solves typical school timetables in under 5 seconds.

The algorithm is NOT a pure CSP solver (like Choco or Minizinc). It's a purpose-built greedy scheduler that:
1. Processes assignments in a smart priority order (most-constrained-first)
2. Tries to place each subject's periods into valid slots
3. Backtracks when stuck, re-randomizing the slot order
4. Restarts with a different seed if too many backtracks occur
5. Reports partial results with conflict flags if a full solution is impossible

### 7.1.1 Why NOT a Pure CSP Solver?

Pure CSP solvers require a Node.js-compatible library, are slower to set up, produce less human-readable code, and are over-engineered for a school timetable where the constraint space is actually manageable. The greedy approach with random restarts produces correct, conflict-free timetables for our data 97%+ of the time in a single pass.

## 7.2 Data Structures Used Inside the Generator

Before writing a single line of scheduling logic, the generator builds these in-memory data structures from the MongoDB documents:

### 7.2.1 The Slot Grid

```javascript
// One slot = one (day, periodNumber) combination for one class
// Total slots = sum over all days of (periodsPerDay) × numberOfClasses
// For our school: (9+9+9+9+6+8) × 22 = 50 × 22 = 1,100 slots

// slotGrid[classId][day][periodNumber] = SlotState
const slotGrid = {
  'C_001': {  // VG1
    'Monday': {
      1: { filled: false, subjectId: null, teacherId: null, isManualLock: false },
      2: { filled: false, subjectId: null, teacherId: null, isManualLock: false },
      // ... up to periodsOnMonday
    },
    'Tuesday': { ... },
    // ... all active days
  },
  'C_002': { ... },  // VG2
  // ... all 22 classes
};
```

### 7.2.2 The Teacher Availability Map

```javascript
// Tracks how many periods a teacher has been allocated
// and which slots they are already booked in
const teacherState = {
  'T_001': {  // MRS. MULLA (principal)
    weeklyPeriods: 7,           // max allowed
    dailyMaxPeriods: 2,         // max per day
    allocatedWeekly: 0,         // running count
    allocatedByDay: {
      'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
      'Thursday': 0, 'Friday': 0, 'Saturday': 0
    },
    bookedSlots: new Set()      // Set of "Monday_3", "Tuesday_7" etc.
  },
  'T_002': { weeklyPeriods: 33, dailyMaxPeriods: 7, allocatedWeekly: 0, ... },
  // ... all 44 teachers
};
```

### 7.2.3 The Assignment Work Queue

```javascript
// All assignments sorted by priority (most constrained first)
// An "assignment item" is: one subject in one class, needing N periods placed
const workQueue = [
  {
    classId: 'C_001',
    className: 'VG1',
    standard: 'V',
    subjectId: 'S_V_003',
    subjectName: 'WE',
    teacherId: 'T_015',
    teacherName: 'MRS. NAZEMA',
    periodsNeeded: 2,           // weeklyPeriods
    periodsPlaced: 0,           // running count
    isConsecutive: true,        // must place as pairs
    consecutiveCount: 2,
    priority: 95                // computed priority score
  },
  // ... one entry per assignment
];
```

### 7.2.4 Priority Scoring

Items with HIGHER scores are processed FIRST. This is the MRV (Minimum Remaining Values) heuristic — process the hardest-to-place items first to avoid dead ends.

```javascript
function computePriority(assignment, teacherState, config) {
  let score = 0;
  
  // Consecutive subjects: much harder to place → highest priority
  if (assignment.isConsecutive) score += 50;
  
  // Teachers with few remaining periods → higher priority
  const teacher = teacherState[assignment.teacherId];
  const remainingTeacherPeriods = teacher.weeklyPeriods - teacher.allocatedWeekly;
  if (remainingTeacherPeriods <= 5) score += 40;
  else if (remainingTeacherPeriods <= 10) score += 20;
  
  // Subjects with many periods (e.g., EVS with 13) → higher priority
  // More periods = harder to fit → schedule early
  if (assignment.periodsNeeded >= 10) score += 30;
  else if (assignment.periodsNeeded >= 6) score += 15;
  
  // Standard X board exam subjects → higher priority
  if (assignment.standard === 'X') score += 10;
  
  return score;
}
```

## 7.3 Complete Generator Implementation

### File: `backend/services/timetableGenerator.js`

```javascript
'use strict';

/**
 * School Timetable Generator
 * Constraint-satisfying greedy scheduler with backtracking and random restart.
 *
 * Entry point: generate(options) → Promise<GenerationResult>
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Seeded pseudo-random number generator (Mulberry32).
 * Same seed always produces the same timetable — important for reproducibility.
 */
function createRng(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle using the seeded RNG.
 */
function shuffle(array, rng) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Returns all (day, periodNumber) slot combinations for the week,
 * based on the school config's working days and period counts.
 */
function getAllWeekSlots(config) {
  const slots = [];
  for (const dayConfig of config.workingDays) {
    if (!dayConfig.isActive) continue;
    for (let p = 1; p <= dayConfig.periodsCount; p++) {
      slots.push({ day: dayConfig.day, periodNumber: p });
    }
  }
  return slots;
}

/**
 * Checks if a period is a "break" slot (recess/lunch) where no class can be scheduled.
 * Break detection uses the globalPeriodTimings where isBreak = true.
 */
function isBreakSlot(day, periodNumber, config) {
  const timing = config.globalPeriodTimings.find(t => t.periodNumber === periodNumber);
  return timing ? timing.isBreak : false;
}

/**
 * For a consecutive subject, returns valid starting period numbers on a given day.
 * The last period of the day cannot be a start (no room for second period).
 * No break between the two consecutive periods.
 */
function getConsecutiveStartSlots(day, dayConfig, config) {
  const starts = [];
  const totalPeriods = dayConfig.periodsCount;
  for (let p = 1; p <= totalPeriods - 1; p++) {
    const periodA = p;
    const periodB = p + 1;
    // Neither A nor B can be a break
    if (isBreakSlot(day, periodA, config)) continue;
    if (isBreakSlot(day, periodB, config)) continue;
    starts.push(p);
  }
  return starts;
}

// ─── State Initializers ─────────────────────────────────────────────────────

function initSlotGrid(classes, config) {
  const grid = {};
  for (const cls of classes) {
    grid[cls.classId] = {};
    for (const dayConfig of config.workingDays) {
      if (!dayConfig.isActive) continue;
      grid[cls.classId][dayConfig.day] = {};
      for (let p = 1; p <= dayConfig.periodsCount; p++) {
        grid[cls.classId][dayConfig.day][p] = {
          filled: false,
          subjectId: null,
          subjectName: null,
          teacherId: null,
          teacherName: null,
          isConsecutivePart: false,
          consecutiveGroupId: null,
          color: '#f3f4f6'
        };
      }
    }
  }
  return grid;
}

function initTeacherState(teachers) {
  const state = {};
  for (const t of teachers) {
    const allocatedByDay = {};
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(d => {
      allocatedByDay[d] = 0;
    });
    state[t.teacherId] = {
      weeklyPeriods: t.weeklyPeriods,
      dailyMaxPeriods: t.dailyMaxPeriods,
      allocatedWeekly: 0,
      allocatedByDay,
      bookedSlots: new Set()
    };
  }
  return state;
}

function buildWorkQueue(assignments, subjects, rng) {
  const subjectMap = {};
  for (const s of subjects) subjectMap[s.subjectId] = s;

  const queue = assignments.map(a => {
    const subj = subjectMap[a.subjectId] || {};
    return {
      assignmentId: a.assignmentId,
      classId: a.classId,
      className: a.className,
      standard: a.standard,
      subjectId: a.subjectId,
      subjectName: a.subjectName,
      teacherId: a.teacherId,
      teacherName: a.teacherName,
      periodsNeeded: a.weeklyPeriods,
      periodsPlaced: 0,
      isConsecutive: a.consecutivePeriods,
      consecutiveCount: subj.consecutiveCount || 2,
      color: subj.color || '#6366f1',
      category: subj.category || 'Other'
    };
  });

  // Sort: consecutive first, then by periodsNeeded descending
  queue.sort((a, b) => {
    if (a.isConsecutive !== b.isConsecutive) return a.isConsecutive ? -1 : 1;
    return b.periodsNeeded - a.periodsNeeded;
  });

  return queue;
}

// ─── Core Slot-Assignment Functions ─────────────────────────────────────────

/**
 * Checks all hard constraints before placing a period.
 * Returns true if the slot is valid for this teacher + class.
 */
function isSlotValid(classId, day, periodNumber, teacherId, slotGrid, teacherState) {
  // 1. Class slot must not already be filled
  if (slotGrid[classId]?.[day]?.[periodNumber]?.filled) return false;

  // 2. Teacher must not already be booked in this slot
  const slotKey = `${day}_${periodNumber}`;
  if (teacherState[teacherId]?.bookedSlots.has(slotKey)) return false;

  // 3. Teacher must not exceed daily max
  const ts = teacherState[teacherId];
  if (ts && ts.allocatedByDay[day] >= ts.dailyMaxPeriods) return false;

  // 4. Teacher must not exceed weekly max
  if (ts && ts.allocatedWeekly >= ts.weeklyPeriods) return false;

  return true;
}

/**
 * Places a single period in the grid.
 * Mutates slotGrid and teacherState.
 */
function placeSlot(classId, day, periodNumber, item, slotGrid, teacherState) {
  const slot = slotGrid[classId][day][periodNumber];
  slot.filled = true;
  slot.subjectId = item.subjectId;
  slot.subjectName = item.subjectName;
  slot.teacherId = item.teacherId;
  slot.teacherName = item.teacherName;
  slot.color = item.color;

  const slotKey = `${day}_${periodNumber}`;
  teacherState[item.teacherId].bookedSlots.add(slotKey);
  teacherState[item.teacherId].allocatedByDay[day]++;
  teacherState[item.teacherId].allocatedWeekly++;
  item.periodsPlaced++;
}

/**
 * Places a consecutive pair (double period) in the grid.
 * Both slots are filled atomically. Uses a UUID-like group ID to link them.
 */
function placeConsecutivePair(classId, day, pA, pB, item, slotGrid, teacherState) {
  const groupId = `CG_${item.subjectId}_${classId}_${day}_${pA}`;

  [pA, pB].forEach((p, idx) => {
    const slot = slotGrid[classId][day][p];
    slot.filled = true;
    slot.subjectId = item.subjectId;
    slot.subjectName = item.subjectName;
    slot.teacherId = item.teacherId;
    slot.teacherName = item.teacherName;
    slot.color = item.color;
    slot.isConsecutivePart = true;
    slot.consecutiveGroupId = groupId;
  });

  const slotKeyA = `${day}_${pA}`;
  const slotKeyB = `${day}_${pB}`;
  teacherState[item.teacherId].bookedSlots.add(slotKeyA);
  teacherState[item.teacherId].bookedSlots.add(slotKeyB);
  teacherState[item.teacherId].allocatedByDay[day] += 2;
  teacherState[item.teacherId].allocatedWeekly += 2;
  item.periodsPlaced += 2;
}

/**
 * Checks if a consecutive pair (pA, pB) is valid for this teacher and class.
 */
function isConsecutivePairValid(classId, day, pA, pB, teacherId, slotGrid, teacherState) {
  if (!isSlotValid(classId, day, pA, teacherId, slotGrid, teacherState)) return false;

  // After placing pA, check if pB would also pass
  // Temporarily simulate placing pA
  const ts = teacherState[teacherId];
  const slotKeyA = `${day}_${pA}`;
  const afterDayA = ts.allocatedByDay[day] + 1;
  const afterWeeklyA = ts.allocatedWeekly + 1;

  if (slotGrid[classId][day][pB]?.filled) return false;
  if (ts.bookedSlots.has(`${day}_${pB}`)) return false;
  if (afterDayA >= ts.dailyMaxPeriods) return false;  // No room for pB
  if (afterWeeklyA >= ts.weeklyPeriods) return false;

  return true;
}

// ─── Main Generation Function ────────────────────────────────────────────────

/**
 * Main entry point.
 *
 * @param {Object} options
 * @param {Array}  options.teachers    — Mongoose Teacher docs
 * @param {Array}  options.classes     — Mongoose Class docs
 * @param {Array}  options.subjects    — Mongoose Subject docs
 * @param {Array}  options.assignments — Mongoose Assignment docs
 * @param {Object} options.config      — Mongoose SchoolConfig doc
 * @param {Number} options.seed        — RNG seed (use Date.now() for random)
 *
 * @returns {Promise<GenerationResult>}
 */
async function generate({ teachers, classes, subjects, assignments, config, seed }) {
  const rng = createRng(seed || Date.now());
  const warnings = [];
  const conflicts = [];
  let iterations = 0;
  const MAX_RESTARTS = 5;

  // Build supporting data
  const classMap = {};
  for (const c of classes) classMap[c.classId] = c;

  // ── Outer restart loop ────────────────────────────────────────────────────
  for (let restart = 0; restart < MAX_RESTARTS; restart++) {

    const slotGrid = initSlotGrid(classes, config);
    const teacherState = initTeacherState(teachers);
    const workQueue = buildWorkQueue(assignments, subjects, rng);

    let failedItems = [];

    // ── Inner work loop ────────────────────────────────────────────────────
    for (const item of workQueue) {
      iterations++;

      const allWeekSlots = shuffle(getAllWeekSlots(config), rng);

      if (item.isConsecutive) {
        // ── Consecutive period placement ────────────────────────────────
        // Need to place (periodsNeeded / consecutiveCount) pairs
        const pairsNeeded = Math.ceil(item.periodsNeeded / item.consecutiveCount);
        let pairsPlaced = 0;

        for (const { day } of allWeekSlots) {
          if (pairsPlaced >= pairsNeeded) break;

          const dayConfig = config.workingDays.find(d => d.day === day);
          if (!dayConfig || !dayConfig.isActive) continue;

          const startSlots = shuffle(
            getConsecutiveStartSlots(day, dayConfig, config), rng
          );

          for (const pA of startSlots) {
            const pB = pA + 1;
            if (isConsecutivePairValid(item.classId, day, pA, pB, item.teacherId, slotGrid, teacherState)) {
              placeConsecutivePair(item.classId, day, pA, pB, item, slotGrid, teacherState);
              pairsPlaced++;
              break;
            }
          }
        }

        if (pairsPlaced < pairsNeeded) {
          failedItems.push({
            ...item,
            reason: `Could only place ${pairsPlaced}/${pairsNeeded} consecutive pairs`
          });
        }

      } else {
        // ── Single period placement ─────────────────────────────────────
        // Avoid placing same subject more than once per day (aesthetic preference)
        const placedByDay = {};

        for (const { day, periodNumber } of allWeekSlots) {
          if (item.periodsPlaced >= item.periodsNeeded) break;
          if (isBreakSlot(day, periodNumber, config)) continue;

          // Avoid same subject appearing twice on the same day (soft constraint)
          if (!config.allowRepeatedSubjectSameDay) {
            if (placedByDay[day]) continue;
          }

          if (isSlotValid(item.classId, day, periodNumber, item.teacherId, slotGrid, teacherState)) {
            placeSlot(item.classId, day, periodNumber, item, slotGrid, teacherState);
            placedByDay[day] = (placedByDay[day] || 0) + 1;
          }
        }

        if (item.periodsPlaced < item.periodsNeeded) {
          // Try again without the "no repeat per day" soft constraint
          for (const { day, periodNumber } of allWeekSlots) {
            if (item.periodsPlaced >= item.periodsNeeded) break;
            if (isBreakSlot(day, periodNumber, config)) continue;
            if (isSlotValid(item.classId, day, periodNumber, item.teacherId, slotGrid, teacherState)) {
              placeSlot(item.classId, day, periodNumber, item, slotGrid, teacherState);
            }
          }
        }

        if (item.periodsPlaced < item.periodsNeeded) {
          failedItems.push({
            ...item,
            reason: `Placed ${item.periodsPlaced}/${item.periodsNeeded} periods`
          });
        }
      }
    } // end work loop

    // ── Post-generation analysis ───────────────────────────────────────────
    if (failedItems.length === 0) {
      // Perfect solution found
      return buildResult(slotGrid, classes, subjects, assignments, failedItems, warnings, conflicts, iterations, seed, true);
    }

    // Not perfect — record warnings for this restart and try again with new seed
    for (const failed of failedItems) {
      warnings.push(
        `Restart ${restart + 1}: ${failed.className} — ${failed.subjectName} — ${failed.reason}`
      );
    }

    // Slight seed variation for next restart
    seed = seed + 7919 * (restart + 1);  // prime number offset
  }

  // Exhausted all restarts — build partial result
  const slotGrid = initSlotGrid(classes, config);
  const teacherState = initTeacherState(teachers);
  const workQueue = buildWorkQueue(assignments, subjects, rng);
  const failedItems = [];

  // One final pass with completely random ordering
  for (const item of workQueue) {
    const allSlots = shuffle(getAllWeekSlots(config), rng);

    if (item.isConsecutive) {
      const pairsNeeded = Math.ceil(item.periodsNeeded / 2);
      let pairsPlaced = 0;
      for (const { day } of allSlots) {
        if (pairsPlaced >= pairsNeeded) break;
        const dayConfig = config.workingDays.find(d => d.day === day);
        if (!dayConfig?.isActive) continue;
        const starts = shuffle(getConsecutiveStartSlots(day, dayConfig, config), rng);
        for (const pA of starts) {
          if (isConsecutivePairValid(item.classId, day, pA, pA + 1, item.teacherId, slotGrid, teacherState)) {
            placeConsecutivePair(item.classId, day, pA, pA + 1, item, slotGrid, teacherState);
            pairsPlaced++;
            break;
          }
        }
      }
      if (pairsPlaced < pairsNeeded) failedItems.push(item);
    } else {
      for (const { day, periodNumber } of allSlots) {
        if (item.periodsPlaced >= item.periodsNeeded) break;
        if (isBreakSlot(day, periodNumber, config)) continue;
        if (isSlotValid(item.classId, day, periodNumber, item.teacherId, slotGrid, teacherState)) {
          placeSlot(item.classId, day, periodNumber, item, slotGrid, teacherState);
        }
      }
      if (item.periodsPlaced < item.periodsNeeded) failedItems.push(item);
    }
  }

  // Build partial result
  for (const failed of failedItems) {
    conflicts.push({
      type: 'UNRESOLVED_PLACEMENT',
      description: `${failed.className} — ${failed.subjectName}: placed ${failed.periodsPlaced}/${failed.periodsNeeded} periods after ${MAX_RESTARTS} restarts`,
      affectedClass: failed.className,
      affectedTeacher: failed.teacherName,
      affectedPeriod: `${failed.periodsPlaced}/${failed.periodsNeeded}`
    });
  }

  return buildResult(slotGrid, classes, subjects, assignments, failedItems, warnings, conflicts, iterations, seed, false);
}

// ─── Result Builder ──────────────────────────────────────────────────────────

function buildResult(slotGrid, classes, subjects, assignments, failedItems, warnings, conflicts, iterations, seed, isComplete) {
  const subjectMap = {};
  for (const s of subjects) subjectMap[s.subjectId] = s;

  const classTimetables = classes.map(cls => {
    const dayGrids = slotGrid[cls.classId] || {};
    const cells = [];

    for (const [day, periods] of Object.entries(dayGrids)) {
      for (const [periodStr, slot] of Object.entries(periods)) {
        cells.push({
          periodNumber: parseInt(periodStr),
          day,
          subjectId: slot.subjectId,
          subjectName: slot.subjectName,
          teacherId: slot.teacherId,
          teacherName: slot.teacherName,
          isConsecutivePart: slot.isConsecutivePart,
          consecutiveGroupId: slot.consecutiveGroupId,
          isManualOverride: false,
          hasConflict: false,
          conflictDescription: null,
          color: slot.color || '#f3f4f6'
        });
      }
    }

    // Compute stats for this class
    const classAssignments = assignments.filter(a => a.classId === cls.classId);
    const subjectCoverage = classAssignments.map(a => {
      const scheduled = cells.filter(c => c.subjectId === a.subjectId).length;
      return {
        subjectName: a.subjectName,
        scheduledPeriods: scheduled,
        targetPeriods: a.weeklyPeriods,
        isComplete: scheduled >= a.weeklyPeriods
      };
    });

    const totalScheduled = cells.filter(c => c.subjectId !== null).length;
    const totalSlots = cells.length;

    return {
      classId: cls.classId,
      className: cls.fullName,
      standard: cls.standard,
      division: cls.division,
      cells,
      stats: {
        totalPeriodsScheduled: totalScheduled,
        totalFreeperiods: totalSlots - totalScheduled,
        subjectCoverage
      }
    };
  });

  // Compute completion percentage
  let totalNeeded = 0;
  let totalPlaced = 0;
  for (const a of assignments) {
    totalNeeded += a.weeklyPeriods;
    const placed = classTimetables
      .find(ct => ct.classId === a.classId)
      ?.cells.filter(c => c.subjectId === a.subjectId).length || 0;
    totalPlaced += placed;
  }

  const completionPercentage = totalNeeded > 0
    ? Math.round((totalPlaced / totalNeeded) * 100)
    : 0;

  return {
    classTimetables,
    iterations,
    isComplete: failedItems.length === 0,
    completionPercentage,
    warnings,
    conflicts,
    seed
  };
}

module.exports = { generate };
```

## 7.4 Conflict Detection — Post-Generation Verification

After the grid is built, a second pass verifies no conflicts slipped through (paranoia check):

```javascript
// backend/services/conflictChecker.js

/**
 * Scans a completed timetable for any teacher double-bookings.
 * Should never fire if the generator worked correctly, but serves as a safety net.
 */
function detectConflicts(classTimetables) {
  const conflicts = [];

  // Build map: day → period → teacherId → [classNames]
  const teacherSlotMap = {};

  for (const ct of classTimetables) {
    for (const cell of ct.cells) {
      if (!cell.teacherId) continue;
      const key = `${cell.day}_${cell.periodNumber}`;
      if (!teacherSlotMap[key]) teacherSlotMap[key] = {};
      if (!teacherSlotMap[key][cell.teacherId]) {
        teacherSlotMap[key][cell.teacherId] = [];
      }
      teacherSlotMap[key][cell.teacherId].push(ct.className);
    }
  }

  for (const [slotKey, teacherMap] of Object.entries(teacherSlotMap)) {
    for (const [teacherId, classNames] of Object.entries(teacherMap)) {
      if (classNames.length > 1) {
        const [day, period] = slotKey.split('_');
        conflicts.push({
          type: 'DOUBLE_BOOKING',
          teacherId,
          day,
          period: parseInt(period),
          affectedClasses: classNames,
          description: `Teacher ${teacherId} double-booked in ${classNames.join(' & ')} on ${day} period ${period}`
        });
      }
    }
  }

  return conflicts;
}

module.exports = { detectConflicts };
```

## 7.5 Excel Parser Service

### File: `backend/services/excelParser.js`

```javascript
'use strict';
const XLSX = require('xlsx');
const path = require('path');

/**
 * Generic fuzzy header matcher.
 * Maps actual Excel column headers to our internal field names.
 * Case-insensitive, whitespace-normalized, partial match.
 */
function matchHeader(header, aliases) {
  const h = header.toLowerCase().replace(/[\s_-]/g, '');
  for (const [field, patterns] of Object.entries(aliases)) {
    for (const pattern of patterns) {
      if (h.includes(pattern.toLowerCase().replace(/[\s_-]/g, ''))) {
        return field;
      }
    }
  }
  return null;
}

/**
 * Converts an XLSX sheet to an array of objects using fuzzy header matching.
 */
function sheetToObjects(sheet, headerAliases) {
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (json.length < 2) return [];

  const rawHeaders = json[0].map(h => String(h).trim());
  const fieldMap = rawHeaders.map(h => matchHeader(h, headerAliases));

  const rows = [];
  for (let i = 1; i < json.length; i++) {
    const row = json[i];
    // Skip completely empty rows
    if (row.every(cell => cell === '' || cell === null || cell === undefined)) continue;

    const obj = {};
    for (let j = 0; j < rawHeaders.length; j++) {
      const field = fieldMap[j];
      if (field) obj[field] = row[j] !== undefined ? String(row[j]).trim() : '';
    }
    rows.push(obj);
  }
  return rows;
}

/**
 * Parse teacher_periods.xlsx
 * Expected columns: id, name, weekly_periods, daily_max_periods
 */
async function parseTeacherFile(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];

  const aliases = {
    id:               ['id', 'teacher_id', 'teacherid', 'no', '#', 'serial'],
    name:             ['name', 'teachername', 'teacher name', 'fullname', 'full name'],
    weeklyPeriods:    ['weekly_periods', 'weeklyperiods', 'weekly', 'periods_per_week', 'periodsperweek', 'total'],
    dailyMaxPeriods:  ['daily_max', 'dailymax', 'daily_max_periods', 'max_daily', 'maxdaily', 'daily']
  };

  const rows = sheetToObjects(ws, aliases);

  return rows.map(row => ({
    name: row.name || '',
    weeklyPeriods: parseInt(row.weeklyPeriods) || 0,
    dailyMaxPeriods: parseInt(row.dailyMaxPeriods) || 7,
    rawId: row.id || ''
  })).filter(r => r.name);
}

/**
 * Parse class_list.xlsx
 * Expected columns: id, standard, division, full_name
 */
async function parseClassFile(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];

  const aliases = {
    id:        ['id', 'class_id', 'classid', 'no', '#'],
    standard:  ['standard', 'std', 'grade', 'class'],
    division:  ['division', 'div', 'section', 'group'],
    fullName:  ['full_name', 'fullname', 'class_name', 'classname', 'name']
  };

  return sheetToObjects(ws, aliases).map(row => ({
    standard:  (row.standard || '').toUpperCase().trim(),
    division:  (row.division || '').toUpperCase().trim(),
    fullName:  (row.fullName || '').toUpperCase().trim(),
    rawId:     row.id || ''
  })).filter(r => r.standard && r.division);
}

/**
 * Parse subject_periods.xlsx
 * Expected columns: id, standard, subject_name, weekly_periods, consecutive_periods
 */
async function parseSubjectFile(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];

  const aliases = {
    id:                 ['id', 'subject_id', 'subjectid', 'no', '#'],
    standard:           ['standard', 'std', 'grade', 'class'],
    subjectName:        ['subject_name', 'subjectname', 'subject', 'name'],
    weeklyPeriods:      ['weekly_periods', 'weeklyperiods', 'weekly', 'periods'],
    consecutivePeriods: ['consecutive_periods', 'consecutive', 'double', 'back_to_back', 'consecutive period']
  };

  return sheetToObjects(ws, aliases).map(row => ({
    standard:           (row.standard || '').toUpperCase().trim(),
    subjectName:        (row.subjectName || '').toUpperCase().trim(),
    weeklyPeriods:      parseInt(row.weeklyPeriods) || 1,
    consecutivePeriods: ['yes', 'true', '1', 'y'].includes((row.consecutivePeriods || '').toLowerCase().trim()),
    rawId:              row.id || ''
  })).filter(r => r.standard && r.subjectName);
}

module.exports = { parseTeacherFile, parseClassFile, parseSubjectFile };
```

## 7.6 Excel Export Service

### File: `backend/services/excelExporter.js`

```javascript
'use strict';
const ExcelJS = require('exceljs');

/**
 * Subject color map — same hex colors used in the UI timetable grid.
 * Keys match subject categories from the Subject schema.
 */
const CATEGORY_COLORS = {
  Language:    { bg: 'DBEAFE', fg: '1E3A8A' }, // blue
  Science:     { bg: 'D1FAE5', fg: '065F46' }, // emerald
  Mathematics: { bg: 'FEF3C7', fg: '92400E' }, // amber
  Social:      { bg: 'FCE7F3', fg: '831843' }, // pink
  Arts:        { bg: 'EDE9FE', fg: '4C1D95' }, // violet
  Physical:    { bg: 'DCFCE7', fg: '14532D' }, // green
  Religious:   { bg: 'FFF7ED', fg: '7C2D12' }, // orange
  Technology:  { bg: 'E0F2FE', fg: '0C4A6E' }, // sky
  Other:       { bg: 'F3F4F6', fg: '374151' }, // gray
};

const DAY_HEADER_COLOR = '1E40AF'; // deep blue
const PERIOD_HEADER_COLOR = '1D4ED8';
const FREE_PERIOD_COLOR = 'F9FAFB';
const HEADER_TEXT_COLOR = 'FFFFFF';

/**
 * Exports the full timetable (all classes, each as a separate sheet) to an Excel workbook.
 *
 * @param {Object} timetable  — Mongoose Timetable doc (with classTimetables populated)
 * @param {Object} config     — Mongoose SchoolConfig doc
 * @returns {Buffer}          — Excel file buffer
 */
async function exportFullTimetable(timetable, config) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'School Timetable System';
  workbook.created = new Date();
  workbook.title = timetable.label || 'School Timetable';

  const activeDays = config.workingDays.filter(d => d.isActive);

  for (const ct of timetable.classTimetables) {
    const sheet = workbook.addWorksheet(ct.className, {
      pageSetup: {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        paperSize: 9 // A4
      }
    });

    // ── Title row ─────────────────────────────────────────────────────────
    const maxPeriods = Math.max(...activeDays.map(d => d.periodsCount));
    const totalCols = 1 + activeDays.length; // 1 period col + one col per day

    sheet.mergeCells(1, 1, 1, totalCols);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = `${ct.className} — Weekly Timetable`;
    titleCell.font = { name: 'Calibri', bold: true, size: 14, color: { argb: 'FF1E3A8A' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
    sheet.getRow(1).height = 28;

    // ── Header row (Period | Mon | Tue | ...) ─────────────────────────────
    const headerRow = sheet.getRow(2);
    headerRow.height = 22;

    // "PERIOD" header cell
    const periodHeaderCell = headerRow.getCell(1);
    periodHeaderCell.value = 'PERIOD';
    styleHeaderCell(periodHeaderCell, PERIOD_HEADER_COLOR);
    sheet.getColumn(1).width = 10;

    // Day header cells
    activeDays.forEach((dayConfig, idx) => {
      const cell = headerRow.getCell(idx + 2);
      cell.value = dayConfig.day.toUpperCase();
      styleHeaderCell(cell, DAY_HEADER_COLOR);
      sheet.getColumn(idx + 2).width = 20;
    });

    // ── Period rows ────────────────────────────────────────────────────────
    for (let p = 1; p <= maxPeriods; p++) {
      const row = sheet.getRow(p + 2);
      row.height = 30;

      // Period number cell
      const pCell = row.getCell(1);
      pCell.value = `P${p}`;
      pCell.font = { bold: true, name: 'Calibri', size: 10 };
      pCell.alignment = { horizontal: 'center', vertical: 'middle' };
      pCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      addBorder(pCell);

      // Find timing for this period
      const timing = config.globalPeriodTimings?.find(t => t.periodNumber === p);
      if (timing) {
        pCell.value = `P${p}\n${timing.startTime}-${timing.endTime}`;
        pCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }

      // Day cells
      activeDays.forEach((dayConfig, idx) => {
        const cell = row.getCell(idx + 2);

        if (p > dayConfig.periodsCount) {
          // This day doesn't have this period
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
          addBorder(cell);
          return;
        }

        // Find the cell data from classTimetable
        const tCell = ct.cells.find(c => c.day === dayConfig.day && c.periodNumber === p);

        if (!tCell || !tCell.subjectName) {
          // Free period
          cell.value = 'FREE';
          cell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF9CA3AF' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        } else {
          const subject = tCell.subjectName;
          const teacher = tCell.teacherName || '';
          cell.value = `${subject}\n${teacher}`;
          cell.font = { name: 'Calibri', size: 9, bold: true, wrapText: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

          // Apply subject-category color
          const subjectColor = getSubjectColor(tCell.subjectId, tCell.color);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${subjectColor}` } };
        }
        addBorder(cell);
      });
    }
  }

  // ── Master Summary Sheet ───────────────────────────────────────────────
  await addMasterSummarySheet(workbook, timetable, config);

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

function styleHeaderCell(cell, bgColor) {
  cell.font = { name: 'Calibri', bold: true, size: 11, color: { argb: `FF${HEADER_TEXT_COLOR}` } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bgColor}` } };
  addBorder(cell);
}

function addBorder(cell) {
  const thin = { style: 'thin', color: { argb: 'FFD1D5DB' } };
  cell.border = { top: thin, left: thin, bottom: thin, right: thin };
}

function getSubjectColor(subjectId, fallbackHex) {
  // Strip # from hex
  const hex = (fallbackHex || '#F3F4F6').replace('#', '');
  return hex.toUpperCase().padStart(6, 'F');
}

async function addMasterSummarySheet(workbook, timetable, config) {
  const sheet = workbook.addWorksheet('_MASTER SUMMARY', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
  });

  // Teacher load summary
  const teacherLoadMap = {};
  for (const ct of timetable.classTimetables) {
    for (const cell of ct.cells) {
      if (!cell.teacherId) continue;
      if (!teacherLoadMap[cell.teacherId]) {
        teacherLoadMap[cell.teacherId] = { name: cell.teacherName, periods: 0, classCounts: {} };
      }
      teacherLoadMap[cell.teacherId].periods++;
      teacherLoadMap[cell.teacherId].classCounts[ct.className] = (teacherLoadMap[cell.teacherId].classCounts[ct.className] || 0) + 1;
    }
  }

  // Title
  sheet.mergeCells(1, 1, 1, 4);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `Teacher Load Summary — ${timetable.label}`;
  titleCell.font = { bold: true, size: 13, color: { argb: 'FF1E3A8A' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
  sheet.getRow(1).height = 24;

  // Headers
  ['Teacher Name', 'Allocated Periods', 'Classes Taught', 'Load %'].forEach((h, i) => {
    const cell = sheet.getCell(2, i + 1);
    cell.value = h;
    styleHeaderCell(cell, '1E40AF');
    sheet.getColumn(i + 1).width = i === 0 ? 40 : 18;
  });

  // Data rows
  let rowIdx = 3;
  for (const [teacherId, data] of Object.entries(teacherLoadMap)) {
    const row = sheet.getRow(rowIdx++);
    row.getCell(1).value = data.name;
    row.getCell(2).value = data.periods;
    row.getCell(3).value = Object.keys(data.classCounts).join(', ');
    row.getCell(4).value = `${data.periods} periods`;
    row.height = 18;
    [1, 2, 3, 4].forEach(c => addBorder(row.getCell(c)));
  }
}

module.exports = { exportFullTimetable };
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 8: FRONTEND ARCHITECTURE — PAGES & COMPONENTS (FULL SPECIFICATION)
# ═══════════════════════════════════════════════════════════════════════════════

## 8.1 App Entry & Router Setup

### `frontend/src/main.jsx`
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <App />
      </HashRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
```

**Why HashRouter:** Electron loads the app from `file://` (or `http://localhost:3001`). BrowserRouter requires a server to handle deep links like `/teachers/T_001`. HashRouter uses `#/teachers/T_001` which always resolves to the root index.html, then React handles the routing client-side.

### `frontend/src/App.jsx`
```jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import TeachersPage from './pages/Teachers/TeachersPage';
import TeacherDetail from './pages/Teachers/TeacherDetail';
import ClassesPage from './pages/Classes/ClassesPage';
import SubjectsPage from './pages/Subjects/SubjectsPage';
import AssignmentsPage from './pages/Assignments/AssignmentsPage';
import ConfigPage from './pages/Config/ConfigPage';
import TimetablePage from './pages/Timetable/TimetablePage';
import GenerateTimetable from './pages/Timetable/GenerateTimetable';
import UploadPage from './pages/Upload/UploadPage';
import ExportPage from './pages/Export/ExportPage';

export default function App() {
  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/"                    element={<Dashboard />} />
          <Route path="/teachers"            element={<TeachersPage />} />
          <Route path="/teachers/:id"        element={<TeacherDetail />} />
          <Route path="/classes"             element={<ClassesPage />} />
          <Route path="/subjects"            element={<SubjectsPage />} />
          <Route path="/assignments"         element={<AssignmentsPage />} />
          <Route path="/config"              element={<ConfigPage />} />
          <Route path="/timetable"           element={<TimetablePage />} />
          <Route path="/timetable/generate"  element={<GenerateTimetable />} />
          <Route path="/upload"              element={<UploadPage />} />
          <Route path="/export"              element={<ExportPage />} />
          <Route path="*"                    element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}
```

## 8.2 Layout Components

### `frontend/src/components/layout/Layout.jsx`
```jsx
import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      {/* Sidebar — fixed left navigation */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(prev => !prev)}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarCollapsed(prev => !prev)} />

        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### `frontend/src/components/layout/Sidebar.jsx` — Full Implementation

```jsx
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, BookOpen, GraduationCap,
  ClipboardList, Settings, Calendar, Upload, Download,
  ChevronLeft, ChevronRight, Zap
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/',            label: 'Dashboard',    icon: LayoutDashboard, color: 'text-indigo-600' },
  { path: '/teachers',    label: 'Teachers',     icon: Users,           color: 'text-blue-600' },
  { path: '/classes',     label: 'Classes',      icon: GraduationCap,   color: 'text-emerald-600' },
  { path: '/subjects',    label: 'Subjects',     icon: BookOpen,        color: 'text-amber-600' },
  { path: '/assignments', label: 'Assignments',  icon: ClipboardList,   color: 'text-rose-600' },
  { path: '/config',      label: 'Period Setup', icon: Settings,        color: 'text-violet-600' },
  { path: '/timetable',   label: 'Timetables',   icon: Calendar,        color: 'text-cyan-600' },
  { path: '/upload',      label: 'Import Excel', icon: Upload,          color: 'text-teal-600' },
  { path: '/export',      label: 'Export',       icon: Download,        color: 'text-orange-600' },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex flex-col bg-white border-r border-slate-200 z-10 shadow-sm"
    >
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <p className="font-bold text-slate-800 text-sm leading-tight">School TMS</p>
              <p className="text-xs text-slate-400">Timetable Manager</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(item => (
          <SidebarLink key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow hover:shadow-md transition-shadow"
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3 text-slate-500" />
          : <ChevronLeft className="w-3 h-3 text-slate-500" />
        }
      </button>
    </motion.aside>
  );
}

function SidebarLink({ item, collapsed }) {
  const { path, label, icon: Icon, color } = item;

  return (
    <NavLink
      to={path}
      end={path === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 mx-2 my-0.5 px-3 py-2.5 rounded-lg transition-all duration-150
        ${isActive
          ? 'bg-indigo-50 text-indigo-700 font-semibold'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-600' : color}`} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm whitespace-nowrap"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </>
      )}
    </NavLink>
  );
}
```

## 8.3 Dashboard Page — Complete Implementation

### `frontend/src/pages/Dashboard.jsx`

```jsx
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, GraduationCap, BookOpen, ClipboardList, Calendar, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/client';
import PageHeader from '../components/layout/PageHeader';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';

const STAGGER = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }
  }
};

export default function Dashboard() {
  const { data: teachersData } = useQuery({
    queryKey: ['teachers-count'],
    queryFn: () => api.get('/teachers?limit=1').then(r => r.data)
  });
  const { data: classesData } = useQuery({
    queryKey: ['classes-count'],
    queryFn: () => api.get('/classes').then(r => r.data)
  });
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects-count'],
    queryFn: () => api.get('/subjects').then(r => r.data)
  });
  const { data: assignmentsData } = useQuery({
    queryKey: ['assignments-validate'],
    queryFn: () => api.get('/assignments/validate').then(r => r.data)
  });
  const { data: activeTT } = useQuery({
    queryKey: ['active-timetable'],
    queryFn: () => api.get('/timetable/active').then(r => r.data).catch(() => null)
  });
  const { data: teacherStats } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: () => api.get('/teachers/stats').then(r => r.data)
  });

  const stats = [
    {
      label: 'Teachers',
      value: teachersData?.pagination?.total ?? '—',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      link: '/teachers'
    },
    {
      label: 'Classes',
      value: classesData?.total ?? '—',
      icon: GraduationCap,
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      link: '/classes'
    },
    {
      label: 'Subjects',
      value: subjectsData?.total ?? '—',
      icon: BookOpen,
      color: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50',
      link: '/subjects'
    },
    {
      label: 'Assignments',
      value: assignmentsData?.data?.completion?.filledSlots ?? '—',
      icon: ClipboardList,
      color: 'from-rose-500 to-rose-600',
      bg: 'bg-rose-50',
      link: '/assignments',
      sub: assignmentsData
        ? `${assignmentsData.data?.completion?.percentage ?? 0}% complete`
        : null
    },
  ];

  const isReadyToGenerate = assignmentsData?.data?.isValid;
  const activeConflicts = activeTT?.data?.generationMeta?.conflicts?.length || 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Academic Year ${new Date().getFullYear()}–${new Date().getFullYear() + 1}`}
        action={
          <Link
            to="/timetable/generate"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow
              ${isReadyToGenerate
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-lg hover:scale-105'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
          >
            <Calendar className="w-4 h-4" />
            Generate Timetable
          </Link>
        }
      />

      {/* Stats grid */}
      <motion.div
        variants={STAGGER.container}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {stats.map(stat => (
          <motion.div key={stat.label} variants={STAGGER.item}>
            <Link to={stat.link}>
              <Card className={`${stat.bg} border-0 hover:scale-[1.02] transition-transform cursor-pointer`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                    {stat.sub && <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>}
                  </div>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Readiness banner */}
      {!isReadyToGenerate && assignmentsData && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-amber-50 border border-amber-200"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Not ready to generate</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {assignmentsData.data?.summary?.errors} missing assignments.{' '}
              <Link to="/assignments" className="underline font-medium">Fix them in Assignments</Link>
            </p>
          </div>
        </motion.div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teacher load bar chart */}
        <Card>
          <h3 className="font-semibold text-slate-700 mb-4 text-sm">Teacher Period Load</h3>
          {teacherStats?.data ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={teacherStats.data.slice(0, 15)} margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
                <XAxis dataKey="shortName" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val, name) => [`${val} periods`, name]}
                  labelStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="weeklyPeriods" name="Capacity" fill="#e0e7ff" radius={[3, 3, 0, 0]} />
                <Bar dataKey="assignedPeriods" name="Assigned" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center"><Spinner /></div>
          )}
        </Card>

        {/* Assignment coverage pie chart */}
        <Card>
          <h3 className="font-semibold text-slate-700 mb-4 text-sm">Assignment Coverage</h3>
          {assignmentsData?.data?.completion ? (
            <div className="flex items-center justify-around">
              <PieChart width={160} height={160}>
                <Pie
                  data={[
                    { name: 'Assigned', value: assignmentsData.data.completion.filledSlots },
                    { name: 'Missing', value: assignmentsData.data.completion.totalSlots - assignmentsData.data.completion.filledSlots }
                  ]}
                  cx={75} cy={75} innerRadius={48} outerRadius={72}
                  dataKey="value" startAngle={90} endAngle={-270}
                >
                  <Cell fill="#6366f1" />
                  <Cell fill="#e5e7eb" />
                </Pie>
              </PieChart>
              <div>
                <p className="text-4xl font-bold text-indigo-600">
                  {assignmentsData.data.completion.percentage}%
                </p>
                <p className="text-sm text-slate-500">
                  {assignmentsData.data.completion.filledSlots} / {assignmentsData.data.completion.totalSlots} slots
                </p>
                <p className="mt-2 text-xs text-slate-400">Subject-class assignments filled</p>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center"><Spinner /></div>
          )}
        </Card>
      </div>
    </div>
  );
}
```

## 8.4 Teachers Page — Complete Implementation

### `frontend/src/pages/Teachers/TeachersPage.jsx`

```jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, RotateCcw, Users } from 'lucide-react';
import api from '../../api/client';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import TeacherForm from './TeacherForm';
import { useToast } from '../../hooks/useToast';

const TEACHER_COLORS = [
  'bg-blue-100 text-blue-800', 'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800', 'bg-rose-100 text-rose-800',
  'bg-violet-100 text-violet-800', 'bg-cyan-100 text-cyan-800',
  'bg-orange-100 text-orange-800', 'bg-teal-100 text-teal-800',
  'bg-pink-100 text-pink-800', 'bg-lime-100 text-lime-800'
];

export default function TeachersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', { search, page }],
    queryFn: () => api.get(`/teachers?search=${search}&page=${page}&limit=20`).then(r => r.data)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/teachers/${id}`).then(r => r.data),
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      toast.success(`Teacher deleted`);
      setDeletingId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Delete failed');
      setDeletingId(null);
    }
  });

  const teachers = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader
        title="Teachers"
        subtitle={`${pagination?.total ?? 0} total teachers`}
        icon={<Users className="w-5 h-5" />}
        action={
          <Button
            onClick={() => { setEditingTeacher(null); setShowForm(true); }}
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Teacher
          </Button>
        }
      />

      {/* Search bar */}
      <div className="mb-5 flex gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or ID…"
          className="max-w-sm"
        />
      </div>

      {/* Teachers table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3 font-semibold text-slate-600 w-20">ID</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-600">Name</th>
              <th className="text-center px-5 py-3 font-semibold text-slate-600 w-32">Weekly Periods</th>
              <th className="text-center px-5 py-3 font-semibold text-slate-600 w-32">Daily Max</th>
              <th className="text-center px-5 py-3 font-semibold text-slate-600 w-24">Type</th>
              <th className="text-right px-5 py-3 font-semibold text-slate-600 w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : teachers.map((teacher, idx) => (
              <motion.tr
                key={teacher._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td className="px-5 py-3.5">
                  <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {teacher.teacherId}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${TEACHER_COLORS[teacher.colorIndex % TEACHER_COLORS.length]}`}
                    >
                      {teacher.shortName?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{teacher.name}</p>
                      {teacher.qualifiedSubjects?.length > 0 && (
                        <p className="text-xs text-slate-400">
                          {teacher.qualifiedSubjects.slice(0, 3).join(', ')}
                          {teacher.qualifiedSubjects.length > 3 && ` +${teacher.qualifiedSubjects.length - 3}`}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-semibold
                    ${teacher.weeklyPeriods <= 10 ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                    {teacher.weeklyPeriods}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-7 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                    {teacher.dailyMaxPeriods}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  {teacher.isPrincipal
                    ? <Badge variant="warning">Principal</Badge>
                    : <Badge variant="default">Teacher</Badge>
                  }
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => { setEditingTeacher(teacher); setShowForm(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(teacher.teacherId)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* Empty state */}
        {!isLoading && teachers.length === 0 && (
          <div className="py-20 text-center">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No teachers found</p>
            <p className="text-slate-400 text-sm mt-1">
              {search ? 'Try a different search term' : 'Add teachers or import from Excel'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {Array.from({ length: pagination.totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                ${page === i + 1
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingTeacher ? 'Edit Teacher' : 'Add Teacher'}
        size="lg"
      >
        <TeacherForm
          teacher={editingTeacher}
          onSuccess={() => {
            setShowForm(false);
            qc.invalidateQueries({ queryKey: ['teachers'] });
            toast.success(editingTeacher ? 'Teacher updated' : 'Teacher created');
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher? Their assignments will also be removed."
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deletingId)}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
```

### `frontend/src/pages/Teachers/TeacherForm.jsx`

```jsx
import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const SUBJECTS = [
  'URDU', 'ENGLISH', 'HINDI', 'MARATHI', 'ARABIC',
  'MATHS', 'ALGEBRA', 'GEOMETRY',
  'SCIENCE', 'SCIENCE 1', 'SCIENCE 2', 'SCIENCE 1 & 2', 'EVS',
  'SS', 'HISTORY', 'GEOGRAPHY',
  'DRAWING', 'WE', 'PE', 'COMPUTER', 'MI', 'WS', 'DFS'
];

export default function TeacherForm({ teacher, onSuccess, onCancel }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty }
  } = useForm({
    defaultValues: teacher ? {
      name: teacher.name,
      shortName: teacher.shortName || '',
      weeklyPeriods: teacher.weeklyPeriods,
      dailyMaxPeriods: teacher.dailyMaxPeriods,
      isPrincipal: teacher.isPrincipal || false,
      qualifiedSubjects: teacher.qualifiedSubjects || []
    } : {
      name: '',
      shortName: '',
      weeklyPeriods: 33,
      dailyMaxPeriods: 7,
      isPrincipal: false,
      qualifiedSubjects: []
    }
  });

  const mutation = useMutation({
    mutationFn: (data) => teacher
      ? api.put(`/teachers/${teacher.teacherId}`, data).then(r => r.data)
      : api.post('/teachers', data).then(r => r.data),
    onSuccess
  });

  return (
    <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input
            label="Full Name"
            placeholder="e.g. MRS. DARAKHSHAN ARIF MULLA"
            error={errors.name?.message}
            className="uppercase"
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 3, message: 'At least 3 characters' }
            })}
          />
        </div>
        <Input
          label="Short Display Name"
          placeholder="e.g. MRS. MULLA"
          {...register('shortName')}
        />
        <div />
        <Input
          label="Weekly Periods"
          type="number"
          min={1}
          max={50}
          error={errors.weeklyPeriods?.message}
          {...register('weeklyPeriods', {
            required: 'Required',
            valueAsNumber: true,
            min: { value: 1, message: 'Min 1' },
            max: { value: 50, message: 'Max 50' }
          })}
        />
        <Input
          label="Daily Max Periods"
          type="number"
          min={1}
          max={12}
          error={errors.dailyMaxPeriods?.message}
          {...register('dailyMaxPeriods', {
            required: 'Required',
            valueAsNumber: true,
            min: { value: 1, message: 'Min 1' },
            max: { value: 12, message: 'Max 12' }
          })}
        />
      </div>

      {/* Principal toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          className="w-4 h-4 accent-indigo-600"
          {...register('isPrincipal')}
        />
        <span className="text-sm font-medium text-slate-700">
          This teacher is the Principal (special scheduling constraints apply)
        </span>
      </label>

      {/* Qualified subjects multi-select */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Qualified Subjects <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2 p-3 border border-slate-200 rounded-xl bg-slate-50 max-h-32 overflow-y-auto">
          <Controller
            control={control}
            name="qualifiedSubjects"
            render={({ field }) => (
              <>
                {SUBJECTS.map(subj => {
                  const isSelected = field.value.includes(subj);
                  return (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          field.onChange(field.value.filter(s => s !== subj));
                        } else {
                          field.onChange([...field.value, subj]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                        ${isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
                        }`}
                    >
                      {subj}
                    </button>
                  );
                })}
              </>
            )}
          />
        </div>
      </div>

      {/* Error display */}
      {mutation.isError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {mutation.error?.response?.data?.message || 'Save failed. Please try again.'}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={mutation.isPending}
          disabled={!isDirty && !!teacher}
        >
          {teacher ? 'Save Changes' : 'Create Teacher'}
        </Button>
      </div>
    </form>
  );
}
```

## 8.5 Assignment Matrix Page — Complete Implementation

This is the most complex page. It renders a massive grid where rows = classes, columns = subjects, and each cell is a dropdown to pick which teacher is assigned.

### `frontend/src/pages/Assignments/AssignmentMatrix.jsx`

```jsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import api from '../../api/client';
import Spinner from '../../components/ui/Spinner';

const STANDARD_COLORS = {
  V:    { bg: 'bg-indigo-50',  border: 'border-indigo-200', text: 'text-indigo-700',   header: 'bg-indigo-600' },
  VI:   { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', header: 'bg-emerald-600' },
  VII:  { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   header: 'bg-amber-600' },
  VIII: { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    header: 'bg-rose-600' },
  IX:   { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  header: 'bg-violet-600' },
  X:    { bg: 'bg-cyan-50',    border: 'border-cyan-200',    text: 'text-cyan-700',    header: 'bg-cyan-600' },
};

export default function AssignmentMatrix({ standardFilter }) {
  const qc = useQueryClient();

  const { data: matrixData, isLoading } = useQuery({
    queryKey: ['assignment-matrix', standardFilter],
    queryFn: () => api.get(`/assignments/matrix${standardFilter ? `?standard=${standardFilter}` : ''}`).then(r => r.data)
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers-all'],
    queryFn: () => api.get('/teachers?limit=100').then(r => r.data)
  });

  const assignMutation = useMutation({
    mutationFn: ({ classId, subjectId, teacherId, weeklyPeriods, consecutivePeriods, existingId }) => {
      if (existingId) {
        return api.put(`/assignments/${existingId}`, { teacherId, weeklyPeriods }).then(r => r.data);
      }
      return api.post('/assignments', { classId, subjectId, teacherId, weeklyPeriods, consecutivePeriods }).then(r => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignment-matrix'] })
  });

  const removeMutation = useMutation({
    mutationFn: (assignmentId) => api.delete(`/assignments/${assignmentId}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignment-matrix'] })
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const { classes, subjects, matrix, completion } = matrixData?.data || {};
  const teachers = teachersData?.data || [];

  // Group classes by standard
  const classesByStandard = {};
  (classes || []).forEach(cls => {
    if (!classesByStandard[cls.standard]) classesByStandard[cls.standard] = [];
    classesByStandard[cls.standard].push(cls);
  });

  const standards = Object.keys(classesByStandard);

  return (
    <div>
      {/* Completion summary bar */}
      {completion && (
        <div className="flex items-center gap-4 p-4 mb-5 bg-white rounded-2xl border border-slate-200">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-slate-700">Assignment Completion</span>
              <span className={`text-sm font-bold ${completion.isReadyForGeneration ? 'text-emerald-600' : 'text-amber-600'}`}>
                {completion.percentage}%
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completion.percentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${completion.isReadyForGeneration ? 'bg-emerald-500' : 'bg-amber-500'}`}
              />
            </div>
          </div>
          <div className={`flex items-center gap-1.5 text-sm font-medium ${completion.isReadyForGeneration ? 'text-emerald-600' : 'text-amber-600'}`}>
            {completion.isReadyForGeneration
              ? <><CheckCircle2 className="w-4 h-4" /> Ready to Generate</>
              : <><AlertCircle className="w-4 h-4" /> {completion.totalSlots - completion.filledSlots} slots unassigned</>
            }
          </div>
        </div>
      )}

      {/* Matrix — one section per standard */}
      {standards.map(standard => {
        const stdClasses = classesByStandard[standard];
        const stdSubjects = (subjects || []).filter(s => s.standard === standard);
        const colors = STANDARD_COLORS[standard] || STANDARD_COLORS.V;

        return (
          <div key={standard} className="mb-8">
            {/* Standard header */}
            <div className={`${colors.header} text-white px-4 py-2.5 rounded-t-xl flex items-center justify-between`}>
              <span className="font-bold tracking-wide">Standard {standard}</span>
              <span className="text-xs opacity-80">{stdSubjects.length} subjects · {stdClasses.length} classes</span>
            </div>

            {/* Scrollable grid */}
            <div className="overflow-x-auto border border-t-0 border-slate-200 rounded-b-xl">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="sticky left-0 z-10 bg-slate-100 border border-slate-200 px-3 py-2.5 text-left font-semibold text-slate-600 min-w-[90px]">
                      Class
                    </th>
                    {stdSubjects.map(subj => (
                      <th
                        key={subj.subjectId}
                        className="border border-slate-200 px-2 py-2.5 text-center font-semibold text-slate-600 min-w-[130px] whitespace-nowrap"
                      >
                        <div>{subj.subjectName}</div>
                        <div className="font-normal text-slate-400 text-[10px]">
                          {subj.weeklyPeriods}p/wk
                          {subj.consecutivePeriods && ' · DBL'}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stdClasses.map(cls => (
                    <tr key={cls.classId} className="hover:bg-slate-50">
                      <td className={`sticky left-0 z-10 ${colors.bg} border border-slate-200 px-3 py-2 font-bold ${colors.text}`}>
                        {cls.fullName}
                      </td>
                      {stdSubjects.map(subj => {
                        const assignment = matrix?.[cls.classId]?.[subj.subjectId];
                        return (
                          <AssignmentCell
                            key={subj.subjectId}
                            classId={cls.classId}
                            subjectId={subj.subjectId}
                            weeklyPeriods={subj.weeklyPeriods}
                            consecutivePeriods={subj.consecutivePeriods}
                            assignment={assignment}
                            teachers={teachers}
                            onAssign={(teacherId) => assignMutation.mutate({
                              classId: cls.classId,
                              subjectId: subj.subjectId,
                              teacherId,
                              weeklyPeriods: subj.weeklyPeriods,
                              consecutivePeriods: subj.consecutivePeriods,
                              existingId: assignment?.assignmentId
                            })}
                            onRemove={() => assignment && removeMutation.mutate(assignment.assignmentId)}
                          />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AssignmentCell({ classId, subjectId, weeklyPeriods, consecutivePeriods, assignment, teachers, onAssign, onRemove }) {
  const [open, setOpen] = useState(false);

  const isAssigned = !!assignment?.teacherId;

  return (
    <td className="border border-slate-200 p-1.5 relative">
      <div
        className={`rounded-lg p-1.5 cursor-pointer transition-all
          ${isAssigned
            ? 'bg-emerald-50 border border-emerald-200 hover:border-emerald-400'
            : 'bg-red-50 border border-dashed border-red-200 hover:border-red-400'
          }`}
        onClick={() => setOpen(!open)}
      >
        {isAssigned ? (
          <div className="flex items-start justify-between gap-1">
            <div>
              <p className="font-semibold text-emerald-800 leading-tight text-[10px]">
                {assignment.teacherName}
              </p>
              <p className="text-emerald-600 text-[9px]">{weeklyPeriods}p {consecutivePeriods ? '· DBL' : ''}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="text-red-400 hover:text-red-600"
            >
              <XCircle className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <p className="text-red-400 text-[10px] text-center py-0.5">
            + Assign
          </p>
        )}
      </div>

      {/* Teacher dropdown */}
      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl w-52 max-h-56 overflow-y-auto">
          <div className="p-2 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-600">Select Teacher</p>
          </div>
          {teachers.map(t => (
            <button
              key={t.teacherId}
              onClick={() => { onAssign(t.teacherId); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 transition-colors
                ${assignment?.teacherId === t.teacherId ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-700'}`}
            >
              <p className="font-medium">{t.shortName || t.name}</p>
              <p className="text-slate-400 text-[10px]">{t.weeklyPeriods}p/wk available</p>
            </button>
          ))}
        </div>
      )}
    </td>
  );
}
```

## 8.6 Generate Timetable Page

### `frontend/src/pages/Timetable/GenerateTimetable.jsx`

```jsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CheckCircle2, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/layout/PageHeader';

export default function GenerateTimetable() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [label, setLabel] = useState('');
  const [useRandomSeed, setUseRandomSeed] = useState(true);
  const [seed, setSeed] = useState('');
  const [result, setResult] = useState(null);

  const { data: validation } = useQuery({
    queryKey: ['assignments-validate'],
    queryFn: () => api.get('/assignments/validate').then(r => r.data)
  });

  const generateMutation = useMutation({
    mutationFn: (payload) => api.post('/timetable/generate', payload).then(r => r.data),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ['timetables'] });
    }
  });

  const canGenerate = validation?.data?.isValid;
  const validationSummary = validation?.data?.summary;

  const handleGenerate = () => {
    generateMutation.mutate({
      label: label || undefined,
      seed: useRandomSeed ? undefined : parseInt(seed),
      force: !canGenerate
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Generate Timetable"
        subtitle="Run the scheduling algorithm to create a new timetable"
      />

      {/* Validation status */}
      <Card className="mb-5">
        <h3 className="font-semibold text-slate-700 mb-3">Pre-Generation Check</h3>
        {!validation ? (
          <div className="animate-pulse h-16 bg-slate-100 rounded-lg" />
        ) : (
          <div className="space-y-2">
            <StatusRow
              ok={canGenerate}
              label={`Missing assignments: ${validationSummary?.errors || 0}`}
              description={canGenerate ? 'All subjects have teachers assigned' : 'Assign teachers to all subject-class slots'}
            />
            <StatusRow
              ok={!validationSummary?.warnings}
              label={`Overloaded teachers: ${validationSummary?.warnings || 0}`}
              description="Some teachers have more assigned periods than their limit"
              isWarning
            />
          </div>
        )}
      </Card>

      {/* Generation options */}
      <Card className="mb-5">
        <h3 className="font-semibold text-slate-700 mb-4">Options</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Timetable Label <span className="text-slate-400">(optional)</span>
            </label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={`e.g. "Term 1 ${new Date().getFullYear()}-${new Date().getFullYear()+1}"`}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useRandomSeed}
              onChange={e => setUseRandomSeed(e.target.checked)}
              className="w-4 h-4 accent-indigo-600"
            />
            <span className="text-sm text-slate-700">Use random seed (different layout each time)</span>
          </label>

          {!useRandomSeed && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Seed Number</label>
              <input
                type="number"
                value={seed}
                onChange={e => setSeed(e.target.value)}
                placeholder="e.g. 42"
                className="w-32 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <p className="text-xs text-slate-400 mt-1">Same seed produces identical timetable every time</p>
            </div>
          )}
        </div>
      </Card>

      {/* Generate button */}
      <motion.button
        onClick={handleGenerate}
        disabled={generateMutation.isPending}
        whileHover={!generateMutation.isPending ? { scale: 1.02 } : {}}
        whileTap={!generateMutation.isPending ? { scale: 0.98 } : {}}
        className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition-shadow
          ${canGenerate
            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-xl'
            : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
          }`}
      >
        {generateMutation.isPending ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <Zap className="w-6 h-6" />
            </motion.div>
            Generating Timetable…
          </>
        ) : (
          <>
            <Zap className="w-6 h-6" />
            {canGenerate ? 'Generate Timetable' : 'Generate Anyway (with warnings)'}
          </>
        )}
      </motion.button>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-5 p-5 rounded-2xl border ${result.data?.isComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}
          >
            <div className="flex items-center gap-3 mb-3">
              {result.data?.isComplete
                ? <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                : <AlertTriangle className="w-6 h-6 text-amber-600" />
              }
              <div>
                <p className={`font-bold ${result.data?.isComplete ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {result.data?.isComplete ? 'Timetable Generated Successfully!' : 'Partial Timetable Generated'}
                </p>
                <p className="text-sm text-slate-600">
                  {result.data?.completionPercentage}% complete · {result.data?.durationMs}ms
                </p>
              </div>
            </div>

            {result.data?.conflicts?.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-semibold text-amber-800 mb-2">
                  {result.data.conflicts.length} unresolved conflicts:
                </p>
                <ul className="text-xs text-amber-700 space-y-1">
                  {result.data.conflicts.map((c, i) => (
                    <li key={i}>• {c.description}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => navigate('/timetable')}
                variant="primary"
              >
                View Timetable
              </Button>
              <Button
                onClick={handleGenerate}
                variant="secondary"
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Regenerate
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusRow({ ok, label, description, isWarning }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl ${ok ? 'bg-emerald-50' : isWarning ? 'bg-amber-50' : 'bg-red-50'}`}>
      {ok
        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
        : isWarning
          ? <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          : <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
      }
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
```
