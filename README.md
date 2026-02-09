<<<<<<< HEAD
# College Event Calendar

A full-stack Next.js application for managing college events, featuring role-based access for Students and Organizers, event registration, and real-time notifications.

## Technologies
- **Framework**: Next.js 14/15 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (via Prisma)
- **Styling**: Tailwind CSS / CSS Modules
- **Auth**: Custom JWT Authentication

## Getting Started

### 1. Prerequisites
- Node.js installed (v18+)

### 2. Installation
```bash
npm install
```

### 3. Database Setup
The project uses SQLite. Ensure the database schema is pushed:
```bash
npx prisma db push
```
This creates/updates `dev.db`.

### 4. Environment Variables
Check `.env` file. It should contain:
```ini
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
# Optional SMTP for emails
# SMTP_HOST=...
```

### 5. Running the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features & Usage

### Organizer Role
1. Sign up and select "Organizer".
2. Go to Dashboard.
3. Click "Create Event" to add new events.
4. Manage events and view registered attendees.

### Student Role
1. Sign up and select "Student".
2. Browse events on the Calendar or Dashboard.
3. Click "Register" on an event.
4. View your registrations in "My Events".
5. Check "Notifications" for updates.
=======
# sisteventcalendar
>>>>>>> ba3286775156e3ecfc33fd697fa490cf044a73c1
