# Materna AI — Pregnancy Health Management Website

A full-stack prototype implementing:

1. Login / account creation (email + password)
2. Demo Google / Apple sign-in entry points
3. Home page with two intake modes:
   - Precise guided form
   - Conversational AI-style intake
4. Glassmorphism dashboard with four sections:
   - Nutrition
   - Medication Adherence
   - Physical Activity Tracker
   - Maternal Health Trends
5. Persistent SQLite database on the Node.js backend
6. Password hashing with bcrypt
7. JWT session authentication
8. Medication taken/missed tracking, schedule, deletion, and browser notification permission
9. Activity logging
10. Nutrition logging
11. Maternal-health measurement history

## Run locally

Requirements: Node.js 20+ recommended.

```bash
npm install
npm run dev
```

Open:
http://localhost:5173

API:
http://localhost:4000

## Production build

```bash
npm run build
npm start
```

## Database

The backend automatically creates:

`server/materna.db`

SQLite tables:
- users
- health_profiles
- medications
- activity_logs
- nutrition_logs
- health_measurements

## Important note about OAuth

The Google / Apple buttons currently use a safe local demo flow because real OAuth requires provider credentials, callback URLs, and production configuration. The rest of the authentication and data persistence is functional.

## Medical-safety design note

This prototype is a health-information tracker, not a diagnostic system. It intentionally avoids making treatment decisions, prescribing medication, changing dosages, or automatically recommending exercise. Prescriptions and exercise guidance are entered according to the individual's healthcare plan.
