drop policy if exists "Requesters and speakers update allowed topics" on public.topics;
drop policy if exists "Users create own recommendations" on public.recommendations;
drop policy if exists "Users create own enrollments" on public.enrollments;
drop policy if exists "Users delete own enrollments" on public.enrollments;
drop policy if exists "Users create own ratings" on public.ratings;
drop policy if exists "Users update own ratings" on public.ratings;

alter table public.topics
drop constraint if exists scheduled_topics_require_session_details;

alter table public.topics
add constraint scheduled_topics_require_session_details check (
  status not in ('SCHEDULED', 'COMPLETED')
  or (
    scheduled_at is not null
    and duration_minutes is not null
    and length(trim(coalesce(location, ''))) > 0
  )
);

create policy "Requesters can edit open topics" on public.topics
for update to authenticated using (auth.uid() = requester_id and status = 'OPEN')
with check (auth.uid() = requester_id and status = 'OPEN');

create policy "Requesters can cancel active topics" on public.topics
for update to authenticated using (auth.uid() = requester_id and status in ('OPEN', 'CLAIMED', 'SCHEDULED'))
with check (auth.uid() = requester_id and status = 'CANCELLED');

create policy "Speakers can unclaim claimed topics" on public.topics
for update to authenticated using (auth.uid() = speaker_id and status = 'CLAIMED')
with check (speaker_id is null and status = 'OPEN');

create policy "Speakers can schedule claimed topics" on public.topics
for update to authenticated using (auth.uid() = speaker_id and status = 'CLAIMED')
with check (auth.uid() = speaker_id and status = 'SCHEDULED');

create policy "Speakers can update scheduled topics" on public.topics
for update to authenticated using (auth.uid() = speaker_id and status = 'SCHEDULED')
with check (auth.uid() = speaker_id and status = 'SCHEDULED');

create policy "Speakers can cancel scheduled topics" on public.topics
for update to authenticated using (auth.uid() = speaker_id and status = 'SCHEDULED')
with check (auth.uid() = speaker_id and status = 'CANCELLED');

create policy "Users create own recommendations for open demand" on public.recommendations
for insert to authenticated with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.topics
    where topics.id = topic_id
      and topics.status in ('OPEN', 'CLAIMED')
      and topics.requester_id <> auth.uid()
  )
);

create policy "Users create own scheduled enrollments" on public.enrollments
for insert to authenticated with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.topics
    where topics.id = topic_id
      and topics.status = 'SCHEDULED'
      and topics.speaker_id <> auth.uid()
  )
);

create policy "Users delete own future enrollments" on public.enrollments
for delete to authenticated using (
  auth.uid() = user_id
  and exists (
    select 1 from public.topics
    where topics.id = topic_id
      and topics.status = 'SCHEDULED'
      and topics.scheduled_at > now()
  )
);

create policy "Users create own eligible ratings" on public.ratings
for insert to authenticated with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.topics
    join public.enrollments
      on enrollments.topic_id = topics.id
      and enrollments.user_id = auth.uid()
    where topics.id = topic_id
      and topics.status = 'COMPLETED'
      and topics.speaker_id <> auth.uid()
      and enrollments.created_at <= topics.scheduled_at
  )
);

create policy "Users update own eligible ratings" on public.ratings
for update to authenticated using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.topics
    join public.enrollments
      on enrollments.topic_id = topics.id
      and enrollments.user_id = auth.uid()
    where topics.id = topic_id
      and topics.status = 'COMPLETED'
      and topics.speaker_id <> auth.uid()
      and enrollments.created_at <= topics.scheduled_at
  )
);
