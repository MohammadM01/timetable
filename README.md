School Timetable Generator 📚✨

	Project Overview 🌟
The School Timetable Generator is a modern, user-friendly web application designed to assist school principals in creating randomized, flexible, and scalable timetables for all classes in a school. Built using React.js (latest version) with Vite as the build tool and styled with Tailwind CSS 4.1, this application offers a vibrant, colorful interface with smooth animations powered by Framer Motion to enhance user experience. The system integrates a SQL database for data persistence and supports Excel file uploads for seamless input of teacher, class, and subject information. The generated timetable ensures balanced teacher workloads, incorporates principal preferences, and provides downloadable outputs in both printable and Excel formats.
This project is developed by a team of two members for a budget of ₹20,000, prioritizing flexibility, scalability, and ease of use, enabling principals to manage teacher allocations, class schedules, and subject distributions efficiently while allowing for dynamic adjustments.
________________________________________
	Features 🚀
•	Principal-Centric Dashboard 🖥️: A centralized interface for principals to input data, manage timetables, and download results.
•	Excel File Upload 📊: Upload teacher details (names, weekly periods, daily max periods), class details (standards, divisions), and subject details (subjects, weekly periods, consecutive periods) using Excel files.
•	Dynamic Input Forms ✍️:
o	Input the number of teachers and their names.
o	Specify classes (e.g., VG1, VG2) with standards and divisions.
o	Define subjects per standard (e.g., English, Math for Standard V).
o	Configure periods per day (e.g., Monday: 9 periods, Friday: 5 periods).
o	Set weekly subject periods per class (e.g., 6 English periods for VG1).
o	Option for consecutive periods for specific subjects.
•	Principal’s Teaching Preferences 👩‍🏫: Allocate teaching periods for the principal (who is also a teacher) with customizable weekly and daily limits.
•	Randomized Timetable Generation 🔄: Automatically generates balanced timetables for all classes, ensuring teachers have free periods and no conflicts.
•	Flexible Teacher Allocations 🔧: Adjust teacher schedules dynamically to accommodate changes.
•	Downloadable Outputs 📥: Export timetables as printable PDFs and Excel files for easy distribution.
•	Colorful Themes & Animations 🎨: A visually appealing interface with Tailwind CSS 4.1 and Framer Motion animations for an engaging user experience.
•	Scalability 🌍: Designed to handle varying numbers of teachers, classes, and subjects, making it suitable for schools of different sizes.
________________________________________
	Excel File Format Example 📋
The system supports Excel file uploads to streamline data input. Below are the expected formats for the three required Excel files:
1. Teacher Periods (teacher_periods.xlsx) 🧑‍🏫
This file contains teacher details, including their names, weekly teaching periods, and daily maximum periods.
Example Format:

 <img width="975" height="230" alt="Screenshot 2025-08-09 165719" src="https://github.com/user-attachments/assets/98ae9d21-a64a-4a8b-ba3e-6bea090b8599" />
•	id: Unique identifier for each teacher.
•	name: Full name of the teacher.
•	weekly_periods: Total teaching periods per week.
•	daily_max_periods: Maximum periods a teacher can teach in a single day.
3. Class List (class_list_corrected.xlsx) 📚
This file lists classes with their standards, divisions, and full names.
Example Format:

<img width="832" height="240" alt="Screenshot 2025-08-09 165856" src="https://github.com/user-attachments/assets/902b33d2-503f-4b1b-884c-08fe1d21b52b" /> 
•	id: Unique identifier for each class.
•	standard: The grade or standard (e.g., V, VI, VII).
•	division: The division within the standard (e.g., G1, G2).
•	full_name: Concatenated name of the standard and division (e.g., VG1).
4. Subject Periods (subject_periods_updated.xlsx) 📖
This file specifies subjects for each standard, their weekly periods, and whether consecutive periods are required.
Example Format:

<img width="877" height="233" alt="Screenshot 2025-08-09 173128" src="https://github.com/user-attachments/assets/71732de5-4f9d-4de8-98e3-3737862801ae" />
•	id: Unique identifier for each subject entry.
•	standard: The grade or standard (e.g., V, VI, VII).
•	subject_name: Name of the subject (e.g., URDU, ENGLISH).
•	weekly_periods: Number of periods per week for the subject.
•	consecutive_periods: Indicates if the subject requires consecutive periods (Yes/No).
[ eg : Drawing, Work EXP, Craft required 2 consecutive periods ]
________________________________________
	System Architecture 🏗️
The application follows a modular structure to ensure maintainability and scalability:
1.	Frontend (React.js + Vite + Tailwind CSS):
o	Dashboard: A central hub for input forms, timetable previews, and management options.
o	Components: Reusable React components for forms, timetable displays, and Excel upload interfaces.
o	Animations: CSS animations powered by Tailwind CSS and Framer Motion for smooth transitions and hover effects.
o	Themes: Colorful and customizable themes to enhance user engagement.
2.	Backend (SQL Database):
o	Stores teacher details, class information, subject allocations, and timetable configurations.
o	Supports queries for timetable generation and data retrieval.
3.	Timetable Generation Logic:
o	A randomization algorithm ensures conflict-free schedules, balancing teacher workloads and adhering to constraints (e.g., daily max periods, consecutive periods).
o	Incorporates principal preferences and free periods for teachers.
4.	Excel Integration:
o	Uses libraries like xlsx to parse uploaded Excel files and populate the database.
o	Validates input data to ensure correct formats.
5.	Export Functionality:
o	Generates printable timetables using libraries like react-to-print.
o	Exports Excel files using xlsx for offline use.
________________________________________
	Technology Stack 🛠️
•	Frontend: React.js (latest), Vite, Tailwind CSS 4.1
•	Backend: SQL (e.g., SQLite or PostgreSQL for flexibility)
•	Excel Parsing: xlsx library
•	Export Libraries: react-to-print (PDF), xlsx (Excel)
•	Animations: Tailwind CSS animations, Framer Motion
•	Deployment: Vite for fast builds and development
________________________________________
	Usage Guide 📖
1.	Login as Principal 🔑: Access the dashboard with principal credentials.
2.	Upload Excel Files 📤: Import teacher, class, and subject data using the provided Excel templates.
3.	Configure Timetable Settings ⚙️:
o	Specify subjects per standard.
o	Set periods per day for each day of the week.
o	Define weekly subject periods per class.
o	Indicate if consecutive periods are required for specific subjects.
o	Set the principal’s teaching preferences (weekly and daily periods).
4.	Generate Timetable 🕒: Click the "Generate" button to create a randomized timetable with multiple options.
5.	Review and Adjust 🔍: View the generated timetable, make manual adjustments if needed, and regenerate if necessary.
6.	Download/Print 📄: Export the timetable as a PDF for printing or an Excel file for distribution.
________________________________________
	Future Enhancements (Currently Optional) 🌈
•	Multi-Language Support 🌐: Add support for additional languages to cater to diverse schools.
•	Role-Based Access 🔒: Extend access to other administrators with limited permissions.
•	Cloud Integration ☁️: Store data in a cloud-based database for remote access.
•	Advanced Analytics 📈: Provide insights into teacher workloads and class schedules.
________________________________________
Contributions 🤝
•	Mohammad Mulla -
•	Shifa Khan -

