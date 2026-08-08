# V09 — Faculty Development & Participation Tracker

**Team:** Ohm's Lawbreakers  
**Event:** FreeDox Hackathon 2026  
**Problem Statement:** V09 — Faculty Development & Participation

---

## The Problem, in Plain English

When a college goes through accreditation, one of the first things evaluators ask for is proof that faculty are actually developing themselves — attending FDPs, workshops, conferences, and training programs.

Most institutions still track this in scattered Excel sheets and paper files, which causes three real problems:

1. **No single source of truth** — the same FDP gets recorded differently across departments.
2. **Evidence gets lost** — certificates aren't linked to the participation record, so nobody can prove who attended what.
3. **Reporting is painful** — answering "how many faculty attended FDPs this year, department-wise?" means counting by hand.

Our job was to build a working system that fixes this: log the activities, register who participated, attach evidence, and auto-generate the exact reports accreditation asks for.

---

## What We Built

A full web application that lets an institution:

- **Create** activities (FDPs, workshops, conferences, STTPs) with organizer, date, duration, and mode
- **Register** faculty into activities with a specific role — Participant, Speaker, or Organizer
- **Attach an evidence reference** (certificate) to each participation
- **Verify** participation status: Pending → Verified / Rejected
- **Search and filter** faculty by name, designation, or department
- **Delete** activities and participation records safely
- **View live reports** that recalculate automatically

Everything runs locally, needs no internet, and uses realistic dummy data — no real institutional records, as required.

---

## The Database Design (the core of the challenge)

### The hard decision
The problem deliberately overlaps with V04 (Student Events). It asked us to decide: **should "Event/Activity" be one shared entity for both students and faculty, or kept separate?**

This was genuinely the hardest design call of the whole build, so here's our full reasoning.

**Option A — one shared `Event` table.**  
Attractive because it avoids duplication. But the `Participation` table would then need to reference *either* a student *or* a faculty member. That forces a polymorphic foreign key (`participant_id` + `participant_type`), which **cannot be enforced by a real foreign key constraint** — the database can't verify the ID actually exists in the right table.

**Option B — separate faculty activity tables.** ← what we chose  
`activities` holds the event definition. `participations` is a proper junction table linking a faculty member to an activity, carrying their role, evidence, and verification status.

**Why we chose B:**
- **Real foreign key enforcement.** Every `participations.faculty_id` must point to a real faculty row, and every `activity_id` must point to a real activity. SQLite enforces this. No orphan records, no broken references.
- **Accreditation = data integrity.** The entire point of this module is that the records are trustworthy. We refused to weaken referential integrity just to share a table with a hypothetical student module.
- **Clean separation.** Event details live in one place; "who attended and where's their proof" lives in another.

### Why `participations` is a junction table
A faculty member attends many activities, and an activity has many faculty — a classic many-to-many. So we broke it into a junction table instead of cramming everything into one row. This gives us two things:
- Event details aren't duplicated once per attendee.
- Evidence and role attach to the **participation**, not the event — because the certificate belongs to the person who attended, not the event itself.

### Schema at a glance

| Table | Purpose |
|-------|---------|
| `departments` | Faculty's home department |
| `faculty` | Faculty member — name, designation, department |
| `activity_types` | Master list — FDP, Workshop, Conference, STTP |
| `activities` | The event itself — title, type, organizer, date, duration, mode |
| `participations` | Junction — which faculty attended which activity, plus role, evidence, status |
| `departments` ── faculty
| `participations`
| `activity_types` |activities 


---

## Tech Stack and Why We Chose It

These were deliberate engineering choices, not defaults.

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | Node.js + Express | Lightweight, zero boilerplate. We could focus on logic instead of framework config — ideal for a 9-hour MVP. |
| Database | SQLite (`better-sqlite3`) | We needed real foreign keys and integrity. SQLite gives us that in a single file — no server to configure, no connection to drop, trivially easy to back up. |
| Frontend | EJS + vanilla CSS | Server-side rendering kept it simple and fast. No build step, no bundler, no SPA complexity. |
| Data access | `better-sqlite3` (sync) | The sync API made route handlers short and readable — clarity beats cleverness at a hackathon. |

### Why SQLite over PostgreSQL?
This was a real debate. Postgres is the "professional" answer, but for this context SQLite is the better engineering call:
- It's a **file on disk** — nothing to install, no service to keep alive.
- The venue network is unreliable; a networked DB could disconnect mid-demo. SQLite can't.
- We still get full foreign-key enforcement, which is the feature that actually matters here.

### Why EJS instead of React?
We consciously skipped a frontend framework. Our risk wasn't "the UI isn't fancy enough" — it was "the database logic and reports need to be correct." Every hour spent fighting a React build was an hour not spent on the ER model. EJS let us render data directly on the server with zero build tooling.

---

## Data Integrity and Security

This is where we spent real effort, because accreditation data has to be trustworthy:

- **Foreign key constraints are ON.** You cannot register a participation for a faculty member or activity that doesn't exist — the database rejects it.
- **Safe deletes.** Deleting an activity first removes its participation rows, so we never leave orphaned records.
- **SQL injection protection.** Every query uses parameterized `?` placeholders. User input is never concatenated into SQL.
- **Output escaping.** We use EJS `<%= %>` (auto-escaping) everywhere user data is displayed, preventing XSS.
- **Server-side validation.** Forms are checked before touching the DB — empty or malformed submissions are rejected.
- **Check constraints.** Fields like `mode` and `verification_status` only accept valid values at the database level.

---

## UI Flow

Matches the required flow from the problem card:
Faculty → Activities → Activity Details → Evidence
Plus the full feature set:

| Requirement | Where it lives |
|-------------|----------------|
| Create | Activities → Add New Activity |
| View | Activity detail page, Faculty profile page |
| Search / Filter | Faculty directory (search + department filter) |
| Update | Verification status dropdown on faculty profile |
| Delete | Remove participation / delete activity |
| Report / Insight | Dashboard — 3 report tables + 4 stat cards |

---

## The Reports (all live, none hard-coded)

The dashboard computes everything from the database in real time:

1. **FDP Participation Summary** — participation counts grouped by activity type
2. **Department-wise Participation** — which departments are most active
3. **Activity Category Analysis** — activities and participations per category
4. **Stat cards** — total faculty, activities, participations, and verified evidences

Add an activity or register a faculty member and these numbers update immediately. That's the Report/Insight requirement, satisfied with real SQL aggregations.

---

## Dummy Data (as required — no real records)

We seeded:
- **10 faculty** across 3 departments
- **26 activities** (the rubric asked for 25+) spanning 4 activity types
- **60+ participation records** with realistic roles, evidence references, and verification statuses

Generated via `seed/seed.js`, so it's reproducible — run it and you get the same dataset every time.

---

## How to Run It

Prerequisite: Node.js. That's it.

`bash
npm install
node seed/seed.js   # load the dummy dataset
npm start `

Then open http://localhost:3001
(We use port 3001 because port 3000 was occupied on the lab machines.)



# How to Test It (the acceptance-test path)
The problem card's acceptance test says: "A reviewer can add an activity and register multiple faculty to it, and pull a single faculty member's full FDP/activity history."
Here's exactly how to do that in our app:
Dashboard — note the stat cards and the three report tables.
Activities → Add New Activity — fill the form and submit. You land on the new activity's detail page.
Register faculty — use the form at the bottom of the activity page to register two or three faculty, adding an evidence reference.
Faculty — search for one of the faculty you just registered and open their profile.
See their full history — the activity you just created is there, with the evidence reference.
Update — change a verification status using the dropdown.
Delete — hit "Remove" on a participation, or "Delete Activity" on an activity page. Watch the dashboard numbers adjust.
Every step recalculates the reports live.

# What We'd Add With More Time
.Being honest about the MVP boundary:
.Real file uploads for evidence (right now it's a reference string).
.Authentication and roles — faculty see/edit only their own records; admins verify.
.CSV/PDF export of the reports for the accreditation submission.
.Pagination on the activity list once it grows past a few dozen.
.Team — Ohm's Lawbreakers

# Member
Focus
Shamil Haniy
Database design, backend routes, ER modeling
[Adrian V Toras]
Frontend views, CSS
[Aveez KM]
Dummy data, acceptance testing
[Tauheed]
Documentation, presentation
