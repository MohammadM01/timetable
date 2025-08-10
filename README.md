# School Timetable Generator 📚✨

## Project Overview 🌟
The School Timetable Generator is a modern, user-friendly web application designed to assist school principals in creating randomized, flexible, and scalable timetables for all classes in a school. Built using React.js with Vite and styled with Tailwind CSS 4.1, this application offers a vibrant, colorful interface with smooth animations powered by Framer Motion to enhance user experience. The system integrates a SQL database for data persistence and supports Excel file uploads for seamless input of teacher, class, and subject information. The generated timetable ensures balanced teacher workloads, incorporates principal preferences, and provides downloadable outputs in both printable and Excel formats.

This project is developed by a team of two members for a budget of ₹20,000, prioritizing flexibility, scalability, and ease of use, enabling principals to manage teacher allocations, class schedules, and subject distributions efficiently while allowing for dynamic adjustments.

---

## Features 🚀
* **Principal-Centric Dashboard 🖥️:** A centralized interface for principals to input data, manage timetables, and download results.
* **Excel File Upload 📊:** Upload teacher details (names, weekly periods, daily max periods), class details (standards, divisions), and subject details (subjects, weekly periods, consecutive periods) using Excel files.
* **Dynamic Input Forms ✍️:**
    * Input the number of teachers and their names.
    * Specify classes (e.g., VG1, VG2) with standards and divisions.
    * Define subjects per standard (e.g., English, Math for Standard V).
    * Configure periods per day (e.g., Monday: 9 periods, Friday: 5 periods).
    * Set weekly subject periods per class (e.g., 6 English periods for VG1).
    * Option for consecutive periods for specific subjects.
* **Principal’s Teaching Preferences 👩‍🏫:** Allocate teaching periods for the principal (who is also a teacher) with customizable weekly and daily limits.
* **Randomized Timetable Generation 🔄:** Automatically generates balanced timetables for all classes, ensuring teachers have free periods and no conflicts.
* **Flexible Teacher Allocations 🔧:** Adjust teacher schedules dynamically to accommodate changes.
* **Downloadable Outputs 📥:** Export timetables as printable PDFs and Excel files for easy distribution.
* **Colorful Themes & Animations 🎨:** A visually appealing interface with Tailwind CSS 4.1 and Framer Motion animations for an engaging user experience.
* **Scalability 🌍:** Designed to handle varying numbers of teachers, classes, and subjects, making it suitable for schools of different sizes.

---

## Excel File Format Example 📋
The system supports Excel file uploads to streamline data input. Below are the expected formats for the three required Excel files:

### 1. Teacher Periods (`teacher_periods.xlsx`) 🧑‍🏫
This file contains teacher details, including their names, weekly teaching periods, and daily maximum periods.

| id | name | weekly_periods | daily_max_periods |
| :--- | :--- | :--- | :--- |
| T_1 | John Doe | 25 | 6 |
| T_2 | Jane Smith | 22 | 5 |
| T_3 | Ali Khan | 28 | 7 |
| T_4 | Priya Sharma | 20 | 5 |

### 2. Class List (`class_list_corrected.xlsx`) 📚
This file lists classes with their standards, divisions, and full names.

| id | standard | division | full_name |
| :--- | :--- | :--- | :--- |
| C_1 | V | G1 | VG1 |
| C_2 | V | G2 | VG2 |
| C_3 | VI | G1 | VIG1 |
| C_4 | VII | G1 | VIIG1 |

### 3. Subject Periods (`subject_periods_updated.xlsx`) 📖
This file specifies subjects for each standard, their weekly periods, and whether consecutive periods are required.

| id | standard | subject_name | weekly_periods | consecutive_periods |
| :--- | :--- | :--- | :--- | :--- |
| S_1 | V | URDU | 6 | No |
| S_2 | V | ENGLISH | 8 | No |
| S_3 | V | DRAWING | 2 | Yes |
| S_4 | VI | MATH | 7 | No |

---

## System Architecture 🏗️
The application follows a modular structure to ensure maintainability and scalability:
1.  **Frontend (React.js + Vite + Tailwind CSS):**
    * Dashboard: A central hub for input forms, timetable previews, and management options.
    * Components: Reusable React components for forms, timetable displays, and Excel upload interfaces.
    * Animations: CSS animations powered by Tailwind CSS and Framer Motion for smooth transitions and hover effects.
    * Themes: Colorful and customizable themes to enhance user engagement.
2.  **Backend (SQL Database):**
    * Stores teacher details, class information, subject allocations, and timetable configurations.
    * Supports queries for timetable generation and data retrieval.
3.  **Timetable Generation Logic:**
    * A randomization algorithm ensures conflict-free schedules, balancing teacher workloads and adhering to constraints (e.g., daily max periods, consecutive periods).
    * Incorporates principal preferences and free periods for teachers.
4.  **Excel Integration:**
    * Uses libraries like `xlsx` to parse uploaded Excel files and populate the database.
    * Validates input data to ensure correct formats.
5.  **Export Functionality:**
    * Generates printable timetables using libraries like `react-to-print`.
    * Exports Excel files using `xlsx` for offline use.

---

## Technology Stack 🛠️
* **Frontend:** React.js (latest), Vite, Tailwind CSS 4.1
* **Backend:** SQL (e.g., SQLite or PostgreSQL for flexibility)
* **Excel Parsing:** `xlsx` library
* **Export Libraries:** `react-to-print` (PDF), `xlsx` (Excel)
* **Animations:** Tailwind CSS animations, Framer Motion
* **Deployment:** Vite for fast builds and development

---

## Usage Guide 📖
1.  **Login as Principal 🔑:** Access the dashboard with principal credentials.
2.  **Upload Excel Files 📤:** Import teacher, class, and subject data using the provided Excel templates.
3.  **Configure Timetable Settings ⚙️:**
    * Specify subjects per standard.
    * Set periods per day for each day of the week.
    * Define weekly subject periods per class.
    * Indicate if consecutive periods are required for specific subjects.
    * Set the principal’s teaching preferences (weekly and daily periods).
4.  **Generate Timetable 🕒:** Click the "Generate" button to create a randomized timetable with multiple options.
5.  **Review and Adjust 🔍:** View the generated timetable, make manual adjustments if needed, and regenerate if necessary.
6.  **Download/Print 📄:** Export the timetable as a PDF for printing or an Excel file for distribution.

---

## Future Enhancements (Currently Optional) 🌈
* **Multi-Language Support 🌐:** Add support for additional languages to cater to diverse schools.
* **Role-Based Access 🔒:** Extend access to other administrators with limited permissions.
* **Cloud Integration ☁️:** Store data in a cloud-based database for remote access.
* **Advanced Analytics 📈:** Provide insights into teacher workloads and class schedules.

---

## Contributors 🤝
*
*
