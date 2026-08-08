const express = require('express');
const path = require('path');
const db = require('./src/db');

const app = express();
const PORT = 3001;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Dashboard ----------
app.get('/', (req, res) => {
  // totals for the stat cards up top
  const totals = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM faculty) AS faculty_count,
      (SELECT COUNT(*) FROM activities) AS activity_count,
      (SELECT COUNT(*) FROM participations) AS participation_count,
      (SELECT COUNT(*) FROM participations WHERE verification_status = 'Verified') AS verified_count
  `).get();

  // FDP participation summary, grouped by activity type
  const fdpSummary = db.prepare(`
    SELECT at.name AS activity_type, COUNT(p.id) AS total_participations
    FROM participations p
    JOIN activities a ON a.id = p.activity_id
    JOIN activity_types at ON at.id = a.activity_type_id
    GROUP BY at.name
    ORDER BY total_participations DESC
  `).all();

  // department-wise participation
  const deptParticipation = db.prepare(`
    SELECT d.name AS department, COUNT(p.id) AS total
    FROM participations p
    JOIN faculty f ON f.id = p.faculty_id
    JOIN departments d ON d.id = f.department_id
    GROUP BY d.name
    ORDER BY total DESC
  `).all();

  // activity category analysis
  const categoryAnalysis = db.prepare(`
    SELECT at.name AS category,
           COUNT(DISTINCT a.id) AS activities,
           COUNT(p.id) AS participations
    FROM activity_types at
    LEFT JOIN activities a ON a.activity_type_id = at.id
    LEFT JOIN participations p ON p.activity_id = a.id
    GROUP BY at.name
  `).all();

  res.render('dashboard', { title: 'Dashboard', totals, fdpSummary, deptParticipation, categoryAnalysis });
});

// ---------- Faculty ----------
app.get('/faculty', (req, res) => {
  const search = req.query.search || '';
  const department = req.query.department || '';

  let sql = `
    SELECT f.*, d.name AS department_name,
           (SELECT COUNT(*) FROM participations p WHERE p.faculty_id = f.id) AS activity_count
    FROM faculty f
    JOIN departments d ON d.id = f.department_id
    WHERE 1 = 1
  `;
  const params = [];

  if (search) {
    sql += ' AND (f.name LIKE ? OR f.designation LIKE ?)';
    params.push('%' + search + '%', '%' + search + '%');
  }
  if (department) {
    sql += ' AND f.department_id = ?';
    params.push(department);
  }
  sql += ' ORDER BY f.name';

  const faculty = db.prepare(sql).all(...params);
  const departments = db.prepare('SELECT * FROM departments ORDER BY name').all();

  res.render('faculty-list', { title: 'Faculty Directory', faculty, departments, search, department });
});

app.get('/faculty/:id', (req, res) => {
  const faculty = db.prepare(`
    SELECT f.*, d.name AS department_name
    FROM faculty f
    JOIN departments d ON d.id = f.department_id
    WHERE f.id = ?
  `).get(req.params.id);

  if (!faculty) return res.status(404).send('Faculty member not found');

  // full FDP / activity history for this person
  const history = db.prepare(`
    SELECT p.*, a.title, a.event_date, a.duration_days, a.mode, at.name AS activity_type
    FROM participations p
    JOIN activities a ON a.id = p.activity_id
    JOIN activity_types at ON at.id = a.activity_type_id
    WHERE p.faculty_id = ?
    ORDER BY a.event_date DESC
  `).all(req.params.id);

  res.render('faculty-detail', { title: faculty.name, faculty, history });
});

// ---------- Activities ----------
app.get('/activities', (req, res) => {
  const search = req.query.search || '';
  const type = req.query.type || '';

  let sql = `
    SELECT a.*, at.name AS type_name,
           (SELECT COUNT(*) FROM participations p WHERE p.activity_id = a.id) AS participant_count
    FROM activities a
    JOIN activity_types at ON at.id = a.activity_type_id
    WHERE 1 = 1
  `;
  const params = [];

  if (search) {
    sql += ' AND (a.title LIKE ? OR a.organizer LIKE ?)';
    params.push('%' + search + '%', '%' + search + '%');
  }
  if (type) {
    sql += ' AND a.activity_type_id = ?';
    params.push(type);
  }
  sql += ' ORDER BY a.event_date DESC';

  const activities = db.prepare(sql).all(...params);
  const types = db.prepare('SELECT * FROM activity_types ORDER BY name').all();

  res.render('activity-list', { title: 'Activities', activities, types, search, type });
});

app.get('/activities/new', (req, res) => {
  const types = db.prepare('SELECT * FROM activity_types ORDER BY name').all();
  res.render('activity-form', { title: 'Add Activity', types, activity: null, error: null });
});

app.post('/activities', (req, res) => {
  const { title, activity_type_id, organizer, event_date, duration_days, mode } = req.body;
  const types = db.prepare('SELECT * FROM activity_types ORDER BY name').all();

  // don't let an empty form hit the database
  if (!title || !activity_type_id || !organizer || !event_date || !duration_days || !mode) {
    return res.render('activity-form', { title: 'Add Activity', types, activity: req.body, error: 'Please fill in every field.' });
  }

  const result = db.prepare(`
    INSERT INTO activities (title, activity_type_id, organizer, event_date, duration_days, mode)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, activity_type_id, organizer, event_date, duration_days, mode);

  res.redirect('/activities/' + result.lastInsertRowid);
});

app.get('/activities/:id', (req, res) => {
  const activity = db.prepare(`
    SELECT a.*, at.name AS type_name
    FROM activities a
    JOIN activity_types at ON at.id = a.activity_type_id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!activity) return res.status(404).send('Activity not found');

  const participants = db.prepare(`
    SELECT p.*, f.name AS faculty_name, f.designation, d.name AS department_name
    FROM participations p
    JOIN faculty f ON f.id = p.faculty_id
    JOIN departments d ON d.id = f.department_id
    WHERE p.activity_id = ?
    ORDER BY f.name
  `).all(req.params.id);

  // only show faculty not already registered for this activity
  const availableFaculty = db.prepare(`
    SELECT f.id, f.name || ' (' || d.name || ')' AS label
    FROM faculty f
    JOIN departments d ON d.id = f.department_id
    WHERE f.id NOT IN (SELECT faculty_id FROM participations WHERE activity_id = ?)
    ORDER BY f.name
  `).all(req.params.id);

  res.render('activity-detail', { title: activity.title, activity, participants, availableFaculty });
});

// register a faculty member to an activity
app.post('/activities/:id/register', (req, res) => {
  const activity_id = req.params.id;
  const { faculty_id, role, evidence_ref } = req.body;

  if (faculty_id && role) {
    try {
      db.prepare(`
        INSERT INTO participations (faculty_id, activity_id, role, evidence_ref, verification_status)
        VALUES (?, ?, ?, ?, 'Pending')
      `).run(faculty_id, activity_id, role, evidence_ref || null);
    } catch (err) {
      // duplicate registration or bad FK, just send them back
    }
  }
  res.redirect('/activities/' + activity_id);
});

// update verification status from the faculty profile
app.post('/participations/:id/status', (req, res) => {
  const { verification_status } = req.body;
  const participation = db.prepare('SELECT * FROM participations WHERE id = ?').get(req.params.id);

  if (participation && ['Pending', 'Verified', 'Rejected'].includes(verification_status)) {
    db.prepare('UPDATE participations SET verification_status = ? WHERE id = ?')
      .run(verification_status, req.params.id);
  }
  res.redirect('/faculty/' + participation.faculty_id);
});

app.listen(PORT, () => {
  console.log('FDP Tracker running on http://localhost:' + PORT);
});
