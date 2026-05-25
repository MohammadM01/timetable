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

