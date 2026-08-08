const db = require('../src/db');

console.log('Seeding V09 data...');

db.exec('DELETE FROM participations');
db.exec('DELETE FROM activities');
db.exec('DELETE FROM faculty');
db.exec('DELETE FROM activity_types');
db.exec('DELETE FROM departments');

const insertDepartment = db.prepare(
  'INSERT INTO departments (id, name) VALUES (?, ?)'
);

const insertFaculty = db.prepare(
  'INSERT INTO faculty (id, name, designation, department_id) VALUES (?, ?, ?, ?)'
);

const insertActivityType = db.prepare(
  'INSERT INTO activity_types (id, name) VALUES (?, ?)'
);

const insertActivity = db.prepare(
  'INSERT INTO activities (id, title, activity_type_id, organizer, event_date, duration_days, mode) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

const insertParticipation = db.prepare(
  'INSERT INTO participations (faculty_id, activity_id, role, evidence_ref, verification_status) VALUES (?, ?, ?, ?, ?)'
);

const seed = db.transaction(() => {
  insertDepartment.run(1, 'Computer Science');
  insertDepartment.run(2, 'Mechanical Engineering');
  insertDepartment.run(3, 'Management Studies');

  insertActivityType.run(1, 'FDP');
  insertActivityType.run(2, 'Workshop');
  insertActivityType.run(3, 'Conference');
  insertActivityType.run(4, 'STTP');

  insertFaculty.run(1, 'Dr. Alice Smith', 'Professor', 1);
  insertFaculty.run(2, 'Dr. Bob Jones', 'Associate Professor', 1);
  insertFaculty.run(3, 'Dr. Charlie Brown', 'Assistant Professor', 1);
  insertFaculty.run(4, 'Dr. Diana Prince', 'Professor', 2);
  insertFaculty.run(5, 'Dr. Evan Wright', 'Associate Professor', 2);
  insertFaculty.run(6, 'Dr. Fiona Gallagher', 'Assistant Professor', 2);
  insertFaculty.run(7, 'Dr. George Miller', 'Professor', 3);
  insertFaculty.run(8, 'Dr. Hannah Abbott', 'Associate Professor', 3);
  insertFaculty.run(9, 'Dr. Ian Curtis', 'Assistant Professor', 3);
  insertFaculty.run(10, 'Dr. Julia Roberts', 'HOD', 1);

  insertActivity.run(1, 'AI in Education FDP', 1, 'IIT Bombay', '2025-07-10', 5, 'Online');
  insertActivity.run(2, 'Advanced CNC Workshop', 2, 'NIT Trichy', '2025-08-15', 3, 'Offline');
  insertActivity.run(3, 'Global Tech Conference', 3, 'IEEE', '2025-09-20', 2, 'Hybrid');
  insertActivity.run(4, 'Research Methodology STTP', 4, 'AICTE', '2025-10-05', 7, 'Online');
  insertActivity.run(5, 'Cloud Security FDP', 1, 'Microsoft', '2025-11-12', 4, 'Online');
  insertActivity.run(6, 'Robotics Hands-on Workshop', 2, 'Local FabLab', '2025-12-01', 2, 'Offline');
  insertActivity.run(7, 'National Management Conference', 3, 'AIMA', '2026-01-15', 3, 'Offline');
  insertActivity.run(8, 'Outcome Based Education STTP', 4, 'NBA', '2026-02-08', 5, 'Hybrid');

  insertParticipation.run(1, 1, 'Participant', 'evidence/f01-a01.pdf', 'Verified');
  insertParticipation.run(2, 1, 'Speaker', 'evidence/f02-a01.pdf', 'Verified');
  insertParticipation.run(3, 1, 'Participant', 'evidence/f03-a01.pdf', 'Pending');
  insertParticipation.run(10, 1, 'Organizer', 'evidence/f10-a01.pdf', 'Verified');

  insertParticipation.run(4, 2, 'Participant', 'evidence/f04-a02.pdf', 'Verified');
  insertParticipation.run(5, 2, 'Participant', 'evidence/f05-a02.pdf', 'Rejected');
  insertParticipation.run(6, 2, 'Participant', 'evidence/f06-a02.pdf', 'Verified');

  insertParticipation.run(1, 3, 'Speaker', 'evidence/f01-a03.pdf', 'Verified');
  insertParticipation.run(7, 3, 'Participant', 'evidence/f07-a03.pdf', 'Pending');
  insertParticipation.run(8, 3, 'Participant', 'evidence/f08-a03.pdf', 'Verified');
  insertParticipation.run(9, 3, 'Participant', 'evidence/f09-a03.pdf', 'Verified');

  insertParticipation.run(1, 4, 'Participant', 'evidence/f01-a04.pdf', 'Verified');
  insertParticipation.run(2, 4, 'Participant', 'evidence/f02-a04.pdf', 'Verified');
  insertParticipation.run(9, 4, 'Participant', 'evidence/f09-a04.pdf', 'Pending');
  insertParticipation.run(3, 4, 'Participant', 'evidence/f03-a04.pdf', 'Verified');

  insertParticipation.run(2, 5, 'Participant', 'evidence/f02-a05.pdf', 'Verified');
  insertParticipation.run(3, 5, 'Participant', 'evidence/f03-a05.pdf', 'Verified');
  insertParticipation.run(10, 5, 'Speaker', 'evidence/f10-a05.pdf', 'Verified');
  insertParticipation.run(6, 5, 'Participant', 'evidence/f06-a05.pdf', 'Pending');

  insertParticipation.run(4, 6, 'Speaker', 'evidence/f04-a06.pdf', 'Verified');
  insertParticipation.run(5, 6, 'Participant', 'evidence/f05-a06.pdf', 'Verified');
  insertParticipation.run(6, 6, 'Organizer', 'evidence/f06-a06.pdf', 'Verified');

  insertParticipation.run(7, 7, 'Speaker', 'evidence/f07-a07.pdf', 'Verified');
  insertParticipation.run(8, 7, 'Participant', 'evidence/f08-a07.pdf', 'Verified');
  insertParticipation.run(9, 7, 'Participant', 'evidence/f09-a07.pdf', 'Pending');
  insertParticipation.run(10, 7, 'Participant', 'evidence/f10-a07.pdf', 'Verified');

  insertParticipation.run(1, 8, 'Participant', 'evidence/f01-a08.pdf', 'Verified');
  insertParticipation.run(2, 8, 'Participant', 'evidence/f02-a08.pdf', 'Pending');
  insertParticipation.run(4, 8, 'Participant', 'evidence/f04-a08.pdf', 'Verified');
  insertParticipation.run(7, 8, 'Participant', 'evidence/f07-a08.pdf', 'Verified');
  insertParticipation.run(10, 8, 'Participant', 'evidence/f10-a08.pdf', 'Verified');
});

seed();

const facultyCount = db.prepare('SELECT COUNT(*) AS count FROM faculty').get();
const participationCount = db.prepare('SELECT COUNT(*) AS count FROM participations').get();

console.log('Faculty:', facultyCount.count);
console.log('Participations:', participationCount.count);
console.log('Seed complete.');
