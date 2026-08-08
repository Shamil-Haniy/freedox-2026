CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS faculty (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    designation TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS activity_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    activity_type_id INTEGER NOT NULL,
    organizer TEXT NOT NULL,
    event_date TEXT NOT NULL,
    duration_days INTEGER NOT NULL CHECK(duration_days > 0),
    mode TEXT NOT NULL CHECK(mode IN ('Online', 'Offline', 'Hybrid')),
    FOREIGN KEY (activity_type_id) REFERENCES activity_types(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS participations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faculty_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Participant', 'Speaker', 'Organizer')),
    evidence_ref TEXT,
    verification_status TEXT NOT NULL DEFAULT 'Pending' CHECK(verification_status IN ('Pending', 'Verified', 'Rejected')),
    FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    UNIQUE(faculty_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_participations_faculty ON participations(faculty_id);
CREATE INDEX IF NOT EXISTS idx_participations_activity ON participations(activity_id);
CREATE INDEX IF NOT EXISTS idx_faculty_department ON faculty(department_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type_id);
