# V09 — Faculty Development & Participation

DocFree Hackathon 2026

## What this is
A faculty activity tracker that records FDPs, workshops, conferences and training programs, registers which faculty attended, and keeps an evidence/verification trail for accreditation reporting.

## The problem in one line
Institutions need proof of which faculty took part in which development activity, with evidence, so they can report it during accreditation.

## Tech stack
- Backend: Node.js + Express
- Database: SQLite (better-sqlite3) — see docs/technology-decision.md
- Views: EJS
- Styling: hand-written CSS, no framework

## Run it
    npm install
    npm run seed     # loads dummy data
    npm start        # http://localhost:3000

## Demo path
1. `/` — dashboard with participation summaries
2. `/activities/new` — add a new activity
3. Open an activity and register faculty to it
4. `/faculty` — open a profile to see full activity history and update verification status

## Folder layout
    server.js            # all routes live here
    src/db.js            # SQLite connection + schema load
    src/views/           # EJS templates
    seed/seed.js         # dummy data
    docs/                # technology decisions + ER diagram

## Data model
See docs/er-diagram.md for the ER diagram and the reasoning behind the V09 design challenge.
