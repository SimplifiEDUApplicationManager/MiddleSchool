-- Run this in the Supabase SQL editor to create the submissions table
create table if not exists submissions (
  id uuid default gen_random_uuid() primary key,
  form text not null check (form in ('parent', 'student')),
  student_name text,
  submitted_at timestamptz default now(),
  answers jsonb not null
);

-- Index for looking up by student name (for pairing parent + student)
create index if not exists idx_submissions_student_name on submissions (student_name);
create index if not exists idx_submissions_form on submissions (form);
