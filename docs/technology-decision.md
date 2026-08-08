# Technology and Architecture Decisions

## ER Design: Faculty Activity Participation

Requirement:
We must track faculty participation in FDPs, workshops, conferences, and training programs, including evidence for each faculty member's participation.

Options considered:
1. A flat faculty_activity table containing event details and faculty details together.
2. A generic shared participation table with participant_type and participant_id.
3. A reusable Activity master table with a faculty-specific Participation junction table.

Evaluation:
A flat table would duplicate activity details for every faculty participant. A generic shared participation table would allow both students and faculty to use one table, but it weakens relational integrity because participant_id cannot have a clean foreign key to both faculty and student tables at the same time. For this MVP, data integrity and clear foreign keys are more important than hypothetical reuse.

Decision:
We chose a reusable Activity master table and a faculty-specific Participation junction table. Activity stores the event definition: title, type, organizer, date, duration, and mode. Participation stores the faculty member's link to that activity, their role, evidence reference, and verification status.

If student participation is required later, we can add a separate student_participations table referencing the same Activity table, preserving foreign-key integrity.

Evidence:
The schema enforces foreign keys from Participation to Faculty and Activity. The UNIQUE constraint on faculty_id and activity_id prevents duplicate registration. Evidence is attached to the participation record because the certificate belongs to the faculty member's attendance, not to the activity definition.

## Database Choice

Requirement:
We need a relational database with foreign keys, aggregation reports, and reliable local demonstration.

Options considered:
1. SQLite
2. PostgreSQL
3. MongoDB

Evaluation:
MongoDB was rejected because the data is strongly relational and requires foreign-key integrity. PostgreSQL is strong, but it requires a separate database service and more setup. SQLite gives us full relational table support, foreign keys, and zero configuration. Since the hackathon environment has unstable internet and limited setup time, SQLite is the safest engineering choice.

Decision:
We chose SQLite with foreign keys enabled.

Evidence:
All CRUD and report queries run locally without network dependency. Foreign-key constraints reject invalid faculty or activity references. Prepared statements are used to prevent SQL injection.

## Backend and Frontend Choice

Requirement:
We need a simple CRUD interface with search, filters, forms, and dashboard reports.

Options considered:
1. Node.js + Express + EJS
2. React + separate API

Evaluation:
React adds build complexity and is unnecessary for server-rendered dashboard tables. Django adds more structure than needed for this MVP. Express and EJS allow us to render database data directly with minimal setup.

Decision:
We chose Node.js, Express, and EJS.

AI Used
  QWen 3.8 Max
Evidence:
The stack is lightweight, runs offline, and supports the required Create, View, Search, Update, and Report flow without complex frontend tooling.
