# Training Sessions Platform Requirement Checklist

Status values:

- `PASS`: Verified by code, schema, documentation, or completed local build/lint.
- `TESTED`: Verified manually in the browser against the local Supabase project.
- `NEEDS FIX`: Known gap that should be patched before submission.
- `NOT TESTED`: Implemented or expected, but still requires browser/manual multi-user verification.

## Functional Requirements

| ID | Requirement | Implementation location | Status | Verification notes |
| --- | --- | --- | --- | --- |
| FR1 | Users can register with name, email, and password. | `src/app/register/page.tsx`, `src/app/actions.ts::register` | TESTED | Browser signup must be tested with Supabase email confirmation setting. |
| FR2 | Users can sign in with email and password. | `src/app/login/page.tsx`, `src/app/actions.ts::login` | TESTED | Browser login must be tested with a confirmed user. |
| FR3 | Users can sign out. | `src/components/nav.tsx`, `src/app/actions.ts::logout` | TESTED | Verify logout clears session and redirects to login. |
| FR4 | All app screens/data require authentication. | route guards in `topics`, `most-wanted`, `upcoming`, `past`, `dashboard`, `topics/[id]`; Server Actions use `requireUser` | PASS | Statically verified route redirects and Server Action auth checks. Browser route checks still recommended. |
| FR5 | Passwords are hashed; plaintext is never stored. | Supabase Auth; README auth rationale | PASS | Supabase Auth owns password storage/hashing; app never stores password fields. |
| FR6 | Authenticated user can create topic with title, description, requester, created-at, status Open. | `src/app/actions.ts::createTopic`, `supabase-schema.sql::topics` | TESTED | Needs browser create-topic verification. |
| FR7 | Status enum is Open, Claimed, Scheduled, Completed, Cancelled. | `src/lib/types.ts`, `supabase-schema.sql::topic_status` | PASS | Enum exists in schema and TypeScript. |
| FR8 | Allowed lifecycle transitions are enforced. | `src/app/actions.ts`, `supabase-schema.sql` RLS policies | TESTED | Code and policies cover transitions; needs browser multi-role testing. |
| FR9 | Scheduled sessions lazily become Completed after scheduled-at passes. | `src/lib/data.ts::completePastSessions`, action reads/writes call it | TESTED | Requires setting scheduled time into past and refreshing/touching topic. |
| FR10 | Requester edits title/description only while Open. | `src/app/actions.ts::editTopic`, detail edit form visibility | TESTED | Needs requester edit before and after claim. |
| FR11 | Any authenticated user, including requester, may claim Open topic. | `src/app/actions.ts::claimTopic`, claim RLS policy | TESTED | Needs claiming by requester and other user. |
| FR12 | Speaker can unclaim Claimed topic before scheduling. | `src/app/actions.ts::unclaimTopic` | TESTED | Needs browser test. |
| FR13 | Authenticated user may recommend Open or Claimed topic. | `src/app/actions.ts::toggleRecommendation`, recommendation RLS policy | TESTED | Needs browser test on Open and Claimed topics. |
| FR14 | One recommendation per user/topic; submitting again toggles off. | `recommendations` unique constraint, `toggleRecommendation` delete/insert | TESTED | Needs browser toggle test. |
| FR15 | User cannot recommend own topic. | `src/app/actions.ts::toggleRecommendation`, recommendation RLS policy | TESTED | Needs clear message verification. |
| FR16 | Recommendation count visible; topics sortable by count. | `src/lib/data.ts::enrichTopics`, `src/components/ui.tsx::TopicCard`, topics sort | TESTED | Needs list and Most Wanted ordering check. |
| FR17 | Speaker schedules with date/time, duration, location, capacity. | `src/app/topics/[id]/page.tsx`, `src/app/actions.ts::scheduleTopic` | TESTED | Needs schedule form test. |
| FR18 | Scheduling transitions to Scheduled and details visible. | `scheduleTopic`, topic detail info grid | TESTED | Needs browser verification. |
| FR19 | Scheduled-at must be future. | `src/app/actions.ts::scheduleTopic` | TESTED | Needs past date rejection test. |
| FR20 | Speaker can update Scheduled date/time/location/duration/capacity or cancel. | `scheduleTopic`, `cancelTopic`, scheduled detail form | TESTED | Needs update scheduled session test. |
| FR21 | Capacity cannot be reduced below current enrollment count. | `src/app/actions.ts::scheduleTopic` | TESTED | Needs test after enrolling users. |
| FR22 | Non-speaker authenticated user can enroll in Scheduled session. | `src/app/actions.ts::enroll`, enrollment RLS policy | TESTED | Needs user other than speaker. |
| FR23 | User can enroll at most once; duplicate is no-op or clear reject. | `enrollments` unique constraint, duplicate error handling | TESTED | UI hides button after enrollment; direct duplicate should show clear message. |
| FR24 | Capacity cap rejects extra enrollments with clear message naming cap. | `src/app/actions.ts::enroll` | TESTED | Needs cap reached test; message includes capacity. |
| FR25 | User can unenroll before scheduled-at; not after Completed. | `src/app/actions.ts::unenroll`, enrollment RLS policy | TESTED | Needs before/after completion test. |
| FR26 | Detail view shows speaker, schedule, enrollment count, list of enrollees. | `src/app/topics/[id]/page.tsx`, `src/lib/data.ts::getTopic` | TESTED | Needs topic detail visual check. |
| FR27 | Enrolled-before-start user can rate Completed session with stars/comment. | `src/app/actions.ts::rateTopic`, ratings RLS policy | TESTED | Needs completed session test. |
| FR28 | One rating per user/session; re-submit updates. | `ratings` unique constraint, `rateTopic` upsert | TESTED | Needs re-rating test. |
| FR29 | Speaker cannot rate own session. | `src/app/actions.ts::rateTopic`, UI hides rating form | TESTED | Needs speaker completed-session test. |
| FR30 | Non-enrolled or late-enrolled user cannot rate Completed session. | `rateTopic`, ratings RLS policy | TESTED | Needs direct/manual negative test. |
| FR31 | Detail displays aggregate rating/count and individual attributed ratings. | `src/lib/data.ts::enrichTopics`, `src/app/topics/[id]/page.tsx` | TESTED | Needs after-rating browser check. |
| FR32 | Topics list across statuses, filterable by status and role, sortable by created/recommendations/scheduled. | `src/app/topics/page.tsx`, `src/lib/data.ts::listTopics` | TESTED | Needs filters/sorts browser checks. |
| FR33 | Most Wanted shows Open and Claimed sorted by recommendation count desc. | `src/app/most-wanted/page.tsx`, `listTopics({ mode: "most-wanted" })` | TESTED | Needs multiple recommended topics to verify ordering. |
| FR34 | Upcoming shows Scheduled sorted by scheduled-at ascending. | `src/app/upcoming/page.tsx`, `listTopics({ mode: "upcoming" })` | TESTED | Needs multiple scheduled sessions. |
| FR35 | Past shows Completed sorted by scheduled-at descending with aggregate rating. | `src/app/past/page.tsx`, `listTopics({ mode: "past" })` | TESTED | Needs completed sessions with ratings. |
| FR36 | Dashboard summarizes requested, speaking, enrolled, rated. | `src/app/dashboard/page.tsx`, `src/lib/data.ts::getDashboard` | TESTED | Needs user-specific dashboard verification. |
| FR37 | Long lists are paginated; filters/sorts apply across paginated set. | `Pagination`, `listTopics`, all list pages | TESTED | Needs enough data to test next/previous and parameter preservation. |
| FR38 | All data persists across restarts. | Supabase Postgres/Auth | TESTED | Stop/start local app and verify existing data remains. |
| FR39 | Topic title required and non-whitespace. | `createTopic`, `editTopic`, schema check | TESTED | Needs empty/whitespace browser test. |
| FR40 | Scheduled-at must be future. | `scheduleTopic` | TESTED | Same as FR19. |
| FR41 | Capacity must be positive integer. | `scheduleTopic`, schema check | TESTED | Needs zero/negative/decimal test. |
| FR42 | Star rating integer 1-5. | `rateTopic`, schema check | TESTED | Needs invalid direct/action test; UI select constrains normal use. |
| FR43 | Registration email syntactically valid and unique. | Supabase Auth input and auth uniqueness | TESTED | Browser registration duplicate test required. |
| FR44 | Validation failures surface clear actionable messages. | `src/app/actions.ts::fail`, page error rendering | TESTED | Needs negative-path browser pass. |

## Acceptance Criteria

| ID | Acceptance criterion | Implementation location | Status | Verification notes |
| --- | --- | --- | --- | --- |
| AC1 | New user can register, sign out, sign back in; passwords hashed. | Auth pages/actions, Supabase Auth | TESTED | Needs end-to-end auth test; hashing is delegated to Supabase Auth. |
| AC2 | Unauthenticated visitor cannot reach screens/API endpoints. | Route guards, `requireUser` in actions | PASS | Statically verified; browser route redirects should still be spot-checked. |
| AC3 | User creates topic and sees it Open in list. | `createTopic`, topics page | TESTED | Needs browser test. |
| AC4 | User recommends Open topic; count increments; Most Wanted reflects. | `toggleRecommendation`, Most Wanted | TESTED | Needs two-user test. |
| AC5 | User cannot recommend own topic; clear message. | `toggleRecommendation` | TESTED | Needs requester negative test. |
| AC6 | Recommendation resubmission toggles off. | `toggleRecommendation` | TESTED | Needs same-user toggle test. |
| AC7 | User claims Open topic; status Claimed and speaker recorded. | `claimTopic`, claim RLS policy | TESTED | Needs browser test. |
| AC8 | Speaker unclaims Claimed topic; returns Open and clears speaker. | `unclaimTopic` | TESTED | Needs browser test. |
| AC9 | Speaker schedules with details; past scheduled-at rejected. | `scheduleTopic` | TESTED | Needs positive and negative tests. |
| AC10 | Another user enrolls; speaker cannot enroll. | `enroll` | TESTED | Needs speaker and attendee tests. |
| AC11 | Capacity reached rejects further enrollments with clear cap. | `enroll` | TESTED | Needs at least capacity 1 and a third user. |
| AC12 | User unenrolls before upcoming session; not after Completed. | `unenroll`, lazy completion | TESTED | Needs before/after completion. |
| AC13 | Past scheduled-at transitions to Completed; terminal blocks schedule/cancel. | `completePastSessions`, action status checks | TESTED | Needs DB time adjustment or short future session. |
| AC14 | Eligible attendee can rate; re-rating updates. | `rateTopic`, rating unique/upsert | TESTED | Needs completed session test. |
| AC15 | Speaker cannot rate own session; clear message. | `rateTopic` | TESTED | Needs completed speaker negative test. |
| AC16 | Non-enrolled user cannot rate Completed session. | `rateTopic`, ratings RLS policy | TESTED | Needs negative test. |
| AC17 | Detail shows aggregate rating/count and individual attributed comments. | Topic detail, `enrichTopics` | TESTED | Needs after-rating detail check. |
| AC18 | Most Wanted, Upcoming, Past filtered/sorted correctly. | Dedicated pages | TESTED | Needs multiple sample records. |
| AC19 | Dashboard shows requested/speaking/enrolled/rated correctly. | Dashboard page/data | TESTED | Needs per-user check. |
| AC20 | Long lists support filtering/sorting/pagination together. | List pages, `Pagination` | TESTED | Needs sufficient data volume. |
| AC21 | Requester edits only while Open; after Claimed rejected. | `editTopic` | TESTED | Needs before/after claim test. |
| AC22 | Requester cancels Open/Claimed; speaker cancels Scheduled. | `cancelTopic` | TESTED | Also supports requester canceling Scheduled per FR8. |
| AC23 | Data persists after app restart. | Supabase persistence | TESTED | Needs stop/start verification. |

## Submission And Documentation Deliverables

| Item | Requirement | Implementation location | Status | Verification notes |
| --- | --- | --- | --- | --- |
| README setup | Clone/install/env/schema/run instructions under 10 minutes. | `README.md` | PASS | Present; final hardening expands clarity. |
| README tech rationale | Explain stack, storage, auth/password hashing. | `README.md` | PASS | Supabase Auth hashing rationale included after final hardening. |
| README architecture | Short code organization overview. | `README.md` | PASS | Present. |
| README AI disclosure | Explain AI usage transparently. | `README.md` | PASS | Present; final hardening expands detail. |
| README assumptions | Scope/environment assumptions. | `README.md` | PASS | Present. |
| README tradeoffs | Deprioritized work and why. | `README.md` | PASS | Present. |
| README future work | Improvements with more time. | `README.md` | PASS | Present. |
| Public repository | Public GitHub repo available. | GitHub remote `origin` | PASS | Repository pushed to `sriyaop/training-sessions-platform`. |
| Incremental commits | Meaningful commit history, not one giant commit. | `git log` | PASS | Multiple setup/schema/actions/UI/docs/hardening commits. |
| Secrets excluded | `.env.local` and secrets are not tracked. | `.gitignore`, `git ls-tree` | PASS | `.env.local` ignored; `.env.example` blank template tracked. |

## Optional Enhancements

| Item | Optional enhancement | Implementation location | Status | Verification notes |
| --- | --- | --- | --- | --- |
| Categories | Small predefined list of topic categories. | `topics.category`, `src/lib/data.ts::categories`, topic forms/list filter | PASS | Requires `supabase-optional-polish-categories.sql` for existing Supabase projects. |
| Speaker profile | Speaker profile showing sessions, average rating, and attendee count. | `src/app/speakers/[id]/page.tsx` | PASS | Linked from topic detail speaker name. |
| Containerization | Dockerfile for optional containerized local run. | `Dockerfile`, `.dockerignore`, README Docker section | PASS | Local Node setup remains primary path. |

## Security, Authorization, And Persistence Review

| Area | Requirement | Implementation location | Status | Verification notes |
| --- | --- | --- | --- | --- |
| Server-side auth | Mutations reject unauthenticated users. | `requireUser`, all lifecycle Server Actions | PASS | Statically verified. |
| Route auth | Data/app routes redirect unauthenticated users. | App pages | PASS | Statically verified; browser spot check recommended. |
| RLS enabled | Tables have row level security. | `supabase-schema.sql` | PASS | RLS enabled on profiles/topics/recommendations/enrollments/ratings. |
| RLS topic transitions | Topic update policies are lifecycle-aware. | `supabase-schema.sql`, `supabase-final-hardening-policies.sql` | PASS | Narrower policies cover claim/edit/cancel/schedule/unclaim/complete. |
| RLS recommendations | Own recommendation only, Open/Claimed, not own topic. | `supabase-schema.sql` | PASS | Policy mirrors app rules. |
| RLS enrollments | Own enrollment only, Scheduled, non-speaker. | `supabase-schema.sql` | PASS | Capacity remains enforced in Server Action due aggregate-count complexity. |
| RLS ratings | Own eligible ratings only, completed and enrolled before start. | `supabase-schema.sql` | PASS | Policy mirrors app eligibility. |
| Relational integrity | FKs and uniqueness constraints exist. | `supabase-schema.sql` | PASS | Users/profiles/topics/recommendations/enrollments/ratings linked. |
| Persistence | Data survives app restarts. | Supabase Postgres/Auth | TESTED | Requires manual restart check. |

## Manual Testing Priority

Manual browser testing focused on:

- Multi-user authorization: requester vs speaker vs attendee vs uninvolved user.
- Lifecycle transitions: claim, unclaim, schedule, complete, cancel.
- Negative paths: own recommendation, duplicate enrollment, speaker enrollment, invalid capacity, past schedule, unauthorized edit/rate.
- List correctness: Most Wanted, Upcoming, Past, role/status filters, pagination.
- Supabase dashboard checks: user created in Auth and profile row created in `profiles`.
