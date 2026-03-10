# BandBoost AI

AI-powered English exam preparation platform for IELTS and PTE exams.

## Overview

BandBoost AI helps users prepare for IELTS and PTE exams by practicing Listening, Reading, Writing, and Speaking skills with AI-powered feedback, progress tracking, session-based practice, exam simulation, mistake review, and score prediction.

## Tech Stack

- **Frontend**: React with Wouter routing, TanStack Query, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend**: Express.js with Passport.js session authentication
- **Database**: PostgreSQL with Drizzle ORM
- **Architecture**: Mobile-first PWA-ready design with dark/light mode

## Project Structure

```
client/src/
  pages/        - Landing, Auth, Onboarding, Dashboard, Listening, Reading, Writing, Speaking, Progress, Admin, ExamSimulation, Mistakes
  components/   - AppShell (navigation), ThemeProvider (dark/light mode), UI components (shadcn)
  lib/          - Query client, utilities
  hooks/        - use-auth (with role/premium access), use-toast, mobile detection

server/
  index.ts      - Express app setup
  routes.ts     - All API routes including practice sessions, attempts, admin CRUD
  auth.ts       - Passport session auth with RBAC middleware (requireAuth, requireAdmin, requireOwner)
  storage.ts    - Database storage layer (IStorage interface with content CRUD)
  db.ts         - Drizzle/PostgreSQL connection
  seed.ts       - Seed data: 25 reading passages (100 questions), 25 listening passages (100 questions), 100 writing prompts, 100 speaking prompts

shared/
  schema.ts     - All Drizzle schemas and Zod validation (14 tables)
```

## Key Features

- **Landing Page**: Hero, features, exam types, testimonials, pricing, FAQ with dark/light toggle
- **Dark/Light Mode**: Theme toggle on landing, auth, and dashboard pages via ThemeProvider
- **Authentication**: Username/password + email validation (disposable/temp emails blocked)
- **Role-Based Access Control**: owner, admin, user roles with subscription status
- **Onboarding**: 5-step wizard (exam type, level, target score, weak skill, study time)
- **Dashboard**: Predicted score, streak, daily tasks, skills overview, AI recommendation
- **Session-Based Practice**: Start Session button, randomized questions, smart selection (incorrect > unattempted > old correct)
- **Listening Module**: 10 questions per session, 20 min timer, premium locks
- **Reading Module**: 10 questions per session, 20 min timer, premium locks
- **Writing Module**: 5 prompts per session, 40 min timer, AI feedback, premium locks
- **Speaking Module**: 5 prompts per session with prep + response time, AI feedback, premium locks
- **Exam Simulation**: Full mock exam with 4 sequential timed sections (Listening > Reading > Writing > Speaking), band score estimate
- **Mistake Review**: View incorrect attempts by module, see correct answers and explanations
- **Progress Page**: Radar chart, trend lines, skill breakdown
- **Admin Panel**: User management, content CRUD (Reading/Listening passages + questions, Writing/Speaking prompts)
- **Free vs Premium**: Free users limited to 3 sessions/day per module, first 10 items only; premium users get unlimited access
- **Practice Attempt Tracking**: Every answer recorded with correct/incorrect status, used for smart question selection
- **Adaptive Difficulty**: Suggests harder questions when accuracy > 80%, easier when < 50%
- **Daily Usage Tracking**: Tracks per-module usage per day for free tier enforcement

## RBAC System

- **Owner**: Full unrestricted access, bypasses all paywalls. Auto-created at startup (owner@bandboost.ai / securepassword)
- **Admin**: Admin panel access, user management, content management, premium access
- **User**: Free or premium based on subscription_status and premium_override

Access logic: owner > admin > premium_override > subscription_status=active > free

## Database Tables

users, user_profiles, daily_tasks, reading_passages, reading_questions, listening_passages, listening_questions, writing_prompts, writing_submissions, speaking_prompts, speaking_submissions, user_progress, vocabulary_items, practice_attempts, daily_usage

## API Routes

### Auth
- `POST /api/auth/register` - Register (requires valid email, blocks temp mail)
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/user` - Get current user

### User
- `GET/POST /api/user/profile` - User profile/onboarding
- `GET /api/user/skills` - Skill scores
- `GET /api/user/progress` - Progress history

### Tasks
- `GET /api/tasks/today` - Daily tasks
- `POST /api/tasks/:id/complete` - Complete task
- `POST /api/tasks/complete-by-type` - Auto-complete by skill type

### Practice (Session-Based)
- `GET /api/practice/session/:module` - Get randomized session (smart selection)
- `POST /api/practice/attempt` - Record practice attempt
- `GET /api/practice/mistakes` - Get incorrect attempts (optional ?module= filter)
- `GET /api/practice/history` - Practice stats and module breakdown
- `GET /api/practice/daily-usage` - Daily usage counts and premium status

### Content
- `GET /api/reading/passages` - Reading passages
- `GET /api/reading/passages/:id/questions` - Reading questions
- `POST /api/reading/submit` - Submit reading answers
- `GET /api/listening/passages` - Listening passages
- `GET /api/listening/passages/:id/questions` - Listening questions
- `POST /api/listening/submit` - Submit listening answers
- `GET /api/writing/prompts` - Writing prompts
- `POST /api/writing/submit` - Submit writing for AI scoring
- `GET /api/speaking/prompts` - Speaking prompts
- `POST /api/speaking/submit` - Submit speaking for AI scoring

### Admin
- `GET /api/admin/users` - List all users (admin/owner only)
- `PATCH /api/admin/users/:userId` - Update user role/subscription
- `POST/PATCH/DELETE /api/admin/reading/passages` - CRUD reading passages
- `POST/PATCH/DELETE /api/admin/reading/questions` - CRUD reading questions
- `POST/PATCH/DELETE /api/admin/listening/passages` - CRUD listening passages
- `POST/PATCH/DELETE /api/admin/listening/questions` - CRUD listening questions
- `POST/PATCH/DELETE /api/admin/writing/prompts` - CRUD writing prompts
- `POST/PATCH/DELETE /api/admin/speaking/prompts` - CRUD speaking prompts

## Score Prediction
Formula: `(avgSkillScore / 100 * 4 + 3.5)`, capped at 9.0

## Free Tier Limits
- 3 practice sessions per module per day
- Access to first 10 questions/prompts per module only
- Premium users get unlimited sessions and full content library
