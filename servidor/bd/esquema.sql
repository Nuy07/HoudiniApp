-- HoudiniApp: base de datos en Supabase (PostgreSQL).
-- Paso 1 de 2. Pégalo completo en Supabase > SQL Editor y presiona Run.
-- Se puede ejecutar varias veces: no borra ni duplica datos.

begin;

-- ---------- NUBE: cuentas, respaldo y tienda ----------
create table if not exists public.usuarios (
  id       bigint generated always as identity primary key,
  usuario  text not null unique check (usuario ~ '^[a-z0-9_]{3,20}$'),
  sal      text not null,
  hash     text not null,               -- nunca se guarda la contraseña
  creado   timestamptz not null default now()
);

create table if not exists public.sesiones (
  token_hash  text primary key,         -- huella del token, no el token
  usuario_id  bigint not null references public.usuarios (id) on delete cascade,
  expira      timestamptz not null
);

create table if not exists public.respaldos (
  usuario_id   bigint primary key references public.usuarios (id) on delete cascade,
  iv           text not null check (length(iv) <= 32),
  datos        text not null check (length(datos) <= 1000000),  -- llega cifrado desde el teléfono
  actualizado  timestamptz not null default now()
);

create table if not exists public.marketplace (
  id           bigint generated always as identity primary key,
  tipo         text not null check (tipo in ('perfil', 'voz')),
  nombre       text not null check (length(nombre) between 1 and 60),
  descripcion  text not null check (length(descripcion) between 1 and 160),
  contenido    jsonb not null check (jsonb_typeof(contenido) = 'object'),
  autor_id     bigint references public.usuarios (id) on delete cascade,  -- vacío = paquete oficial
  descargas    integer not null default 0 check (descargas >= 0),
  creado       timestamptz not null default now()
);

-- ---------- TIEMPO REAL: cómplices y alertas ----------
create table if not exists public.complices (
  solicitante_id   bigint not null references public.usuarios (id) on delete cascade,
  destinatario_id  bigint not null references public.usuarios (id) on delete cascade,
  aceptado         boolean not null default false,
  creado           timestamptz not null default now(),
  primary key (solicitante_id, destinatario_id),
  check (solicitante_id <> destinatario_id)
);

create table if not exists public.alertas (
  id         bigint generated always as identity primary key,
  de_id      bigint not null references public.usuarios (id) on delete cascade,
  para_id    bigint not null references public.usuarios (id) on delete cascade,
  mensaje    text not null check (length(mensaje) between 1 and 200),
  lat        double precision check (lat between -90 and 90),
  lng        double precision check (lng between -180 and 180),
  creada     timestamptz not null default now(),
  entregada  boolean not null default false,
  check ((lat is null) = (lng is null))  -- ubicación completa o ninguna
);

-- ---------- Índices ----------
create index if not exists sesiones_usuario on public.sesiones (usuario_id);
create index if not exists sesiones_expira on public.sesiones (expira);
create index if not exists marketplace_autor on public.marketplace (autor_id);
create index if not exists complices_destinatario on public.complices (destinatario_id);
create index if not exists alertas_de on public.alertas (de_id);
create index if not exists alertas_para on public.alertas (para_id);
create index if not exists alertas_pendientes on public.alertas (para_id, id) where not entregada;
create index if not exists alertas_creada on public.alertas (creada);

-- Un solo vínculo por pareja, sin importar quién lo pidió.
create unique index if not exists complices_pareja on public.complices
  (least(solicitante_id, destinatario_id), greatest(solicitante_id, destinatario_id));

-- Evita repetir los paquetes oficiales.
create unique index if not exists marketplace_oficial on public.marketplace (tipo, nombre)
  where autor_id is null;

-- ---------- Seguridad ----------
-- Supabase publica el esquema "public" por internet con su propia API.
-- Con RLS y sin políticas nadie entra por ahí: solo la API de Python.
alter table public.usuarios    enable row level security;
alter table public.sesiones    enable row level security;
alter table public.respaldos   enable row level security;
alter table public.marketplace enable row level security;
alter table public.complices   enable row level security;
alter table public.alertas     enable row level security;

revoke all on public.usuarios, public.sesiones, public.respaldos, public.marketplace,
  public.complices, public.alertas from anon, authenticated;

commit;
