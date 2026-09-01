-- EXECUTE ESTE SQL NO SUPABASE > SQL EDITOR

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  duration integer not null default 30,
  active boolean not null default true
);

create table if not exists barbers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  service_id uuid not null references services(id),
  barber_id uuid not null references barbers(id),
  appointment_date date not null,
  appointment_time time not null,
  status text not null default 'confirmed',
  created_at timestamptz not null default now()
);

-- Impede duas reservas para o mesmo barbeiro, dia e horário
create unique index if not exists unique_active_barber_slot
on appointments (barber_id, appointment_date, appointment_time)
where status <> 'cancelled';

alter table services enable row level security;
alter table barbers enable row level security;
alter table appointments enable row level security;

create policy "public read services" on services for select using (true);
create policy "public read barbers" on barbers for select using (true);
create policy "public read appointments" on appointments for select using (true);
create policy "public insert appointments" on appointments for insert with check (true);
create policy "public update appointments" on appointments for update using (true) with check (true);

insert into services (name,price,duration) values
('Corte',30,30),('Barba',20,30),('Corte + Barba',45,60)
on conflict do nothing;

insert into barbers (name) values ('João'),('Carlos');