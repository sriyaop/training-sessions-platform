# Training Sessions Platform

Internal training-session platform for requesting learning topics, recommending high-demand asks, volunteering to teach, scheduling sessions, enrolling attendees, and rating completed sessions.

The project focuses on the required lifecycle and authorization rules over visual polish: requester, speaker, enrollee, and rater permissions are enforced server-side, and all data is persisted in Supabase.

## Features

- Email/password registration, login, and logout through Supabase Auth.
- Optional Google sign-in through Supabase Auth.
- Topic requests with `OPEN`, `CLAIMED`, `SCHEDULED`, `COMPLETED`, and `CANCELLED` statuses.
- Recommendation/upvote toggle for topics requested by other users.
- Volunteer-to-teach flow with claim and unclaim support.
- Speaker scheduling with date/time, duration, location, and optional capacity.
- Enrollment with duplicate and capacity protection.
- Lazy completion when `scheduled_at` has passed; no background worker required.
- Post-session ratings and attributed comments from eligible attendees.
- Topics list with status/role filters, sorting, and pagination.
- Most Wanted, Upcoming Sessions, Past Sessions, Topic Detail, and User Dashboard views.
- Speaker profile pages with completed sessions, average rating, and attendee totals.

## Tech Stack And Rationale

- **Next.js 16 App Router + React 19 + TypeScript**: fast to build, server-rendered by default, and a good fit for form-driven workflows.
- **Server Actions**: keep lifecycle mutations close to server-side authorization checks without adding an API layer.
- **Tailwind CSS 4 + small shadcn-style primitives**: enough UI structure for clear tables/cards/forms without spending hackathon time on custom design systems.
- **Supabase Auth**: handles email/password authentication, session cookies, and secure password storage.
- **Supabase Postgres**: durable relational storage with foreign keys, uniqueness constraints, checks, triggers, and Row Level Security.

### Auth And Password Hashing

Authentication is handled by **Supabase Auth**. The application never stores plaintext passwords and never receives password hashes. Password hashing, credential verification, session issuance, and uniqueness checks for auth users are handled by Supabase Auth infrastructure. Application code only calls Supabase Auth methods such as `signUp`, `signInWithPassword`, and `signOut`.

This satisfies the requirement that passwords are not stored in plaintext or reversible form by application code.

## Setup And Run

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a Supabase project.

3. In the Supabase SQL editor, run:

```text
supabase-schema.sql
```

If you previously ran an older schema during development, also run:

```text
supabase-final-hardening-policies.sql
```

Fresh reviewers only need `supabase-schema.sql`.

4. Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SPLINE_SCENE_URL=optional-public-spline-viewer-url
```

`.env.example` is committed as a safe template. `.env.local` is intentionally ignored and must not be committed.

`NEXT_PUBLIC_SPLINE_SCENE_URL` is optional. If provided, the auth pages and dashboard render the public Spline scene in a contained visual panel. If omitted, the app falls back to a static panel.

5. For local hackathon testing, either disable email confirmation in Supabase Auth settings or manually confirm test users after registration.

6. Optional Google sign-in:

- Enable Google under `Authentication -> Sign In / Providers` in Supabase.
- Add this redirect URL in Supabase/Google OAuth settings:

```text
http://localhost:3000/auth/callback
```

7. Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Architecture Overview

- `src/lib/supabase/server.ts`: creates the SSR Supabase client and reads the authenticated user from cookies.
- `src/lib/data.ts`: read queries, list filtering/sorting/pagination, count enrichment, aggregate ratings, dashboard queries, and lazy session completion.
- `src/app/actions.ts`: all lifecycle mutations, validation, and server-side authorization checks.
- `src/app/*/page.tsx`: server-rendered route views and simple form flows.
- `src/app/speakers/[id]/page.tsx`: speaker profile summary and session history.
- `src/components/*`: shared navigation, page shell, badges, cards, pagination, and button primitive.
- `supabase-schema.sql`: database schema, enum, relationships, constraints, triggers, profile creation trigger, and RLS policies.
- `docs/requirement-checklist.md`: FR/AC verification checklist for final manual QA.

## Lifecycle And Authorization Coverage

- Users can request topics while authenticated.
- Users cannot recommend their own topic.
- Recommendations are limited to `OPEN` and `CLAIMED` topics and toggle on/off.
- Any authenticated user, including the requester, can claim an `OPEN` topic.
- Only the current speaker can unclaim before scheduling.
- Only the speaker can schedule or update scheduled details.
- Scheduled time must be in the future.
- Capacity must be positive and cannot be reduced below current enrollment.
- The speaker cannot enroll in or rate their own session.
- Only enrolled attendees can rate after completion.
- Ratings are one per user per topic; re-rating updates the existing row.
- Requesters and speakers can cancel only according to lifecycle rules.
- `COMPLETED` and `CANCELLED` are terminal in the Server Actions.

## Verification

Local static checks:

```bash
npm run lint
npm run build
```

Manual multi-user testing is tracked in:

```text
docs/requirement-checklist.md
```

Use at least two test accounts, and preferably three, to verify requester/speaker/attendee/outsider behavior.

## Optional Docker Run

Docker is optional; local Node setup is still the primary path.

```bash
docker build -t training-sessions-platform .
docker run --env-file .env.local -p 3000:3000 training-sessions-platform
```

## Assumptions

- This is an internal team tool with flat permissions; there are no admin or coordinator roles.
- Supabase email confirmation may be disabled during local demo testing for speed.
- Profile rows mirror Supabase Auth users through a database trigger.
- Lists refresh on navigation/page load; real-time updates are out of scope.
- Pagination uses offset pagination with a default page size of 10.

## Tradeoffs

- No production deployment is included because local-run is sufficient for the prompt.
- No notifications, calendar integrations, video tooling, waitlists, uploads, or realtime subscriptions were added.
- Lifecycle checks live primarily in Server Actions for readability and explicit user-facing errors; RLS provides an additional database safety layer.
- Aggregate counts are computed with straightforward queries rather than materialized views because expected hackathon data volume is small.
- UI is intentionally simple and form-driven to keep focus on correctness.

## AI Usage Disclosure

AI assistance was used during development, primarily through ChatGPT/Codex-style coding workflows.

AI accelerated:

- initial Next.js/Supabase scaffolding,
- schema and RLS policy drafting,
- Server Action lifecycle implementation,
- page/form generation,
- README and requirement-checklist drafting,
- debugging support for Supabase Auth and RLS behavior.

Human review/refinement focused on:

- comparing behavior against the original FR/AC list,
- manually testing authentication and lifecycle flows,
- rejecting optional features that would expand scope,
- tightening authorization and validation messages,
- preserving clean incremental Git history.

Generated code was linted, built, reviewed, and adjusted against the hackathon requirements before submission.

## Future Work

- Add stronger automated integration tests around lifecycle transitions.
- Add a calendar-style upcoming sessions view.
- Add speaker profile summaries.
- Add safe Markdown rendering for topic descriptions and comments.
- Add Docker setup for even faster reviewer startup.
