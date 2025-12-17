create table public.users (
  id uuid not null default extensions.uuid_generate_v4 (),
  email character varying(255) not null,
  role public.user_role null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email)
) TABLESPACE pg_default;

create table public.tickets (
  id uuid not null default gen_random_uuid (),
  company_name text not null,
  company_phone text not null,
  company_email text not null,
  brand_name text not null,
  years_of_operation_in_equipment integer null,
  location text not null,
  inspection_date timestamp without time zone not null,
  inspection_time timestamp without time zone not null,
  photos text[] null,
  gst text not null,
  billing_address text not null,
  equipment_type text not null,
  equipment_sl_no text not null,
  capacity integer null,
  specification_plate_photo text null,
  poc_name text not null,
  poc_phone text not null,
  poc_email text not null,
  problem_statement text not null,
  created_at timestamp with time zone null default now(),
  constraint tickets_pkey primary key (id)
) TABLESPACE pg_default;


create table public.inspection (
  id uuid primary key default gen_random_uuid(),

  company_name text not null,
  company_phone text not null,
  company_email text not null,

  brand_name text not null,

  years_of_operation_in_equipment int,
  years_of_operations int,

  location text not null,

  inspection_date timestamp not null,
  inspection_time timestamp not null,

  photos text[], -- optional

  gst text not null,
  billing_address text not null,

  equipment_type text not null,
  equipment_sl_no text not null,
  capacity int,

  specification_plate_photo text,

  poc_name text not null,
  poc_phone text not null,
  poc_email text not null,

  problem_statement text not null,
  possible_solution text,

  created_at timestamp with time zone default now()
);

create table public.new_jobs (
  id uuid not null default gen_random_uuid (),
  location text not null,
  photos text[] null,
  assigned uuid null,
  price integer null,
  equipment_type text not null,
  equipment_sl_no text not null,
  poc_name text not null,
  poc_phone text not null,
  poc_email text not null,
  problem_statement text not null,
  possible_solution text null,
  created_at timestamp with time zone null default now(),
  constraint new_jobs_pkey primary key (id),
  constraint new_jobs_assigned_fkey foreign KEY (assigned) references users (id)
) TABLESPACE pg_default;


create table public.surveys (
  id uuid not null default extensions.uuid_generate_v4 (),
  job_number character varying not null,
  description text not null,
  equipments_required text[] not null,
  amount integer null,
  photos text[] null,
  created_at timestamp with time zone null default now(),
  agency_id uuid not null,
  engineer_id uuid not null,
  constraint surveys_pkey primary key (id),
  constraint surveys_agency_id_fkey foreign KEY (agency_id) references agencies (id),
  constraint surveys_engineer_id_fkey foreign KEY (engineer_id) references engineers (user_id),
  constraint surveys_job_number_fkey foreign KEY (job_number) references jobs (job_number) on delete CASCADE
) TABLESPACE pg_default;

create table public.bids (
  id uuid not null default gen_random_uuid (),
  job_id uuid not null,
  user_id uuid not null,
  name text not null,
  email text not null,
  phone text not null,
  price integer not null,
  created_at timestamp with time zone null default now(),
  constraint bids_pkey primary key (id),
  constraint bids_job_user_unique unique (job_id, user_id),
  constraint bids_job_id_fkey foreign KEY (job_id) references new_jobs (id) on delete CASCADE,
  constraint bids_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;
