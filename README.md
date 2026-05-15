# Training Sessions Platform

Internal training-session platform for requesting learning topics, recommending them, volunteering to teach, scheduling sessions, enrolling, and rating completed sessions.

## Tech Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4 and small shadcn-style UI primitives
- Supabase Auth for login/register
- Supabase Postgres for relational persistence
- Server Actions for mutations with server-side authorization checks

This stack keeps the hackathon build small while still giving real auth, relational data, and deployable persistence.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project.

3. Run `supabase-schema.sql` in the Supabase SQL editor.

4. Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. For the smoothest hackathon demo, disable email confirmation in Supabase Auth settings or confirm users manually.

6. Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Architecture Overview

- `src/lib/supabase/server.ts` creates the SSR Supabase client and reads the authenticated user from cookies.
- `src/lib/data.ts` contains read queries, count enrichment, aggregate rating calculation, and lazy completion of past scheduled sessions.
- `src/app/actions.ts` contains all lifecycle mutations and validates auth, ownership, status transitions, capacity, enrollment, and rating permissions server-side.
- `src/app/*/page.tsx` files are simple server-rendered pages with HTML forms calling Server Actions.
- `supabase-schema.sql` defines tables, relationships, uniqueness constraints, checks, triggers, and RLS policies.

## Business Rules Covered

- One recommendation, enrollment, and rating per user per topic.
- Requesters cannot recommend their own topics.
- Topics can be edited only by the requester while `OPEN`.
- Only `OPEN` topics can be claimed; speakers can unclaim before scheduling.
- Only speakers can schedule, and scheduled times must be future dates.
- Enrollment is only for `SCHEDULED` sessions, blocks the speaker, enforces capacity, and prevents duplicates.
- Sessions become `COMPLETED` lazily on reads/writes when `scheduled_at` has passed.
- Only enrolled attendees can rate completed sessions; re-rating updates the existing rating.
- Requesters can cancel `OPEN` or `CLAIMED`; speakers can cancel `SCHEDULED`; terminal statuses stay terminal.

## Assumptions

- Supabase email confirmation may be disabled for demo speed.
- Public profile rows mirror Supabase Auth users.
- Views are readable to authenticated users; mutations still validate authorization in Server Actions.
- Pagination is simple offset pagination with a default page size of 10.

## Tradeoffs

- No background worker is used; completion is intentionally lazy per the requirements.
- Aggregate counts are computed with straightforward queries instead of a materialized stats table.
- UI uses plain forms and server redirects for reliability and speed.
- RLS is present, but detailed lifecycle enforcement lives in Server Actions to keep hackathon implementation readable.

## AI Usage Disclosure

AI assistance was used to generate and refine the application structure, Server Actions, Supabase schema, lifecycle checks, and README. Human review should still verify Supabase settings and run end-to-end demo flows.

## Future Improvements

- Add optimistic pending states for form submissions.
- Add admin reporting and CSV export.
- Add calendar invites for scheduled sessions.
- Add richer search across topics and speakers.
- Move aggregate counts into database views if list volume grows.
