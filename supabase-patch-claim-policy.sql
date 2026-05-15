create policy "Authenticated users can claim open topics" on public.topics
for update to authenticated using (status = 'OPEN' and speaker_id is null)
with check (auth.uid() = speaker_id and status = 'CLAIMED');
