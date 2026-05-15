create type topic_category as enum ('Engineering', 'Product', 'Design', 'Data', 'Leadership', 'Process');

alter table public.topics
add column if not exists category topic_category not null default 'Engineering';
