// server.js
// keeping everything in one file because its a small mvp and easier to debug during the hackathon

const express = require('express');
const path = require('path');
const db = require('./src/db');

const app = express();
// port 3001 because 3000 was blocked by another app on the lab pc
const PORT = 3001; 

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// dashboard route - gets the counts for the top cards
app.get('/', (req, res) => {
  const totals = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM faculty) AS faculty_count,
      (SELECT COUNT(*) FROM activities) AS activity_count,
      (SELECT COUNT(*) FROM participations) AS participation_count,
      (SELECT COUNT(*) FROM participations WHERE verification_status = 'Verified') AS verified_count
  `).get();

  // fdp summary by type
  const fdpSummary = db.prepare(`
    SELECT at.name AS activity_type, COUNT(p.id) AS total_participations
    FROM participations p
    JOIN activities a ON a.id = p.activity_id
    JOIN activity_types at ON at.id = a.activity_type_id
    GROUP BY at.name ORDER BY total_participations DESC
  `).all();

  // department wise counts
  const deptParticipation = db.prepare(`
    SELECT d.name AS department, COUNT(p.id) AS total
    FROM participations p
    JOIN faculty f ON f.id = p.faculty_id
    JOIN departments d ON d.id = f.department_id
    GROUP BY d.name ORDER BY total DESC
  `).all();

  // activity category analysis (rubric specifically asks for this on the dashboard)
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

// faculty list with search
app.get('/faculty', (req, res) => {
  const search = req.query.search || '';
  const department = req.query.department || '';

  let sql = `SELECT f.*, d.name AS department_name, (SELECT COUNT(*) FROM participations p WHERE p.faculty_id = f.id) AS activity_count FROM faculty f JOIN departments d ON d.id = f.department_id WHERE 1 = 1`;
  const params = [];

  if (search) { sql += ' AND (f.name LIKE ? OR f.designation LIKE ?)'; params.push('%' + search + '%', '%' + search + '%'); }
  if (department) { sql += ' AND f.department_id = ?'; params.push(department); }
  sql += ' ORDER BY f.name';

  const faculty = db.prepare(sql).all(...params);
  const departments = db.prepare('SELECT * FROM departments ORDER BY name').all();
  res.render('faculty-list', { title: 'Faculty', faculty, departments, search, department });
});

// single faculty profile
app.get('/faculty/:id', (req, res) => {
  const faculty = db.prepare('SELECT f.*, d.name AS department_name FROM faculty f JOIN departments d ON d.id = f.department_id WHERE f.id = ?').get(req.params.id);
  if (!faculty) return res.status(404).send('Faculty not found');

  const history = db.prepare(`
    SELECT p.*, a.title, a.event_date, a.duration_days, a.mode, at.name AS activity_type
    FROM participations p
    JOIN activities a ON a.id = p.activity_id
    JOIN activity_types at ON at.id = a.activity_type_id
    WHERE p.faculty_id = ? ORDER BY a.event_date DESC
  `).all(req.params.id);

  res.render('faculty-detail', { title: faculty.name, faculty, history });
});

// activities list
app.get('/activities', (req, res) => {
  const activities = db.prepare(`
    SELECT a.*, at.name AS type_name, (SELECT COUNT(*) FROM participations p WHERE p.activity_id = a.id) AS participant_count
    FROM activities a JOIN activity_types at ON at.id = a.activity_type_id ORDER BY a.event_date DESC
  `).all();
  res.render('activity-list', { title: 'Activities', activities });
});

// add activity form
app.get('/activities/new', (req, res) => {
  const types = db.prepare('SELECT * FROM activity_types ORDER BY name').all();
  res.render('activity-form', { title: 'Add Activity', types, activity: null, error: null });
});

// save new activity
app.post('/activities', (req, res) => {
  const { title, activity_type_id, organizer, event_date, duration_days, mode } = req.body;
  const types = db.prepare('SELECT * FROM activity_types ORDER BY name').all();

  if (!title || !activity_type_id || !organizer || !event_date || !duration_days || !mode) {
    return res.render('activity-form', { title: 'Add Activity', types, activity: req.body, error: 'Please fill in every field.' });
  }

  // using ? so people cant do sql injection in the form
  const result = db.prepare('INSERT INTO activities (title, activity_type_id, organizer, event_date, duration_days, mode) VALUES (?, ?, ?, ?, ?, ?)').run(title, activity_type_id, organizer, event_date, duration_days, mode);
  res.redirect('/activities/' + result.lastInsertRowid);
});

// activity details
app.get('/activities/:id', (req, res) => {
  const activity = db.prepare('SELECT a.*, at.name AS type_name FROM activities a JOIN activity_types at ON at.id = a.activity_type_id WHERE a.id = ?').get(req.params.id);
  if (!activity) return res.status(404).send('Activity not found');

  const participants = db.prepare(`
    SELECT p.*, f.name AS faculty_name, f.designation, d.name AS department_name
    FROM participations p
    JOIN faculty f ON f.id = p.faculty_id JOIN departments d ON d.id = f.department_id
    WHERE p.activity_id = ? ORDER BY f.name
  `).all(req.params.id);

  const availableFaculty = db.prepare(`
    SELECT f.id, f.name || ' (' || d.name || ')' AS label FROM faculty f JOIN departments d ON d.id = f.department_id
    WHERE f.id NOT IN (SELECT faculty_id FROM participations WHERE activity_id = ?) ORDER BY f.name
  `).all(req.params.id);

  res.render('activity-detail', { title: activity.title, activity, participants, availableFaculty });
});

// register faculty to activity
app.post('/activities/:id/register', (req, res) => {
  const { faculty_id, role, evidence_ref } = req.body;
  if (faculty_id && role) {
    try {
      db.prepare('INSERT INTO participations (faculty_id, activity_id, role, evidence_ref, verification_status) VALUES (?, ?, ?, ?, \'Pending\')').run(faculty_id, req.params.id, role, evidence_ref || null);
    } catch (err) { /* ignore duplicates */ }
  }
  res.redirect('/activities/' + req.params.id);
});

// update verification status
app.post('/participations/:id/status', (req, res) => {
  const { verification_status } = req.body;
  const p = db.prepare('SELECT * FROM participations WHERE id = ?').get(req.params.id);
  if (p && ['Pending', 'Verified', 'Rejected'].includes(verification_status)) {
    db.prepare('UPDATE participations SET verification_status = ? WHERE id = ?').run(verification_status, req.params.id);
  }
  res.redirect('/faculty/' + p.faculty_id);
});

// --- DELETE ROUTES ---

// deleting an activity. we delete participations first so sqlite foreign keys dont crash
app.post('/activities/:id/delete', (req, res) => {
  const id = req.params.id;
  db.prepare('DELETE FROM participations WHERE activity_id = ?').run(id);
  db.prepare('DELETE FROM activities WHERE id = ?').run(id);
  res.redirect('/activities');
});

// deleting a single participation record
app.post('/participations/:id/delete', (req, res) => {
  const id = req.params.id;
  const p = db.prepare('SELECT faculty_id FROM participations WHERE id = ?').get(id);
  db.prepare('DELETE FROM participations WHERE id = ?').run(id);
  res.redirect(p ? '/faculty/' + p.faculty_id : '/');
});

app.listen(PORT, () => console.log('FDP Tracker running on http://localhost:' + PORT));
