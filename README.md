# Couple

App privada de pareja — calendario compartido, estados de ánimo, watchlist, menú de comidas y más.

## Stack

- **Frontend/Backend**: Next.js 16 (App Router, Turbopack)
- **Base de datos**: PostgreSQL con Prisma ORM
- **Auth**: better-auth (email + password)
- **Monorepo**: Turborepo + pnpm workspaces
- **UI**: Tailwind CSS
- **Infraestructura dev**: Docker Compose

## Estructura

```
couple/
├── apps/
│   └── web/          # Next.js app
├── packages/
│   ├── db/           # Prisma schema + cliente
│   └── shared/       # Tipos TypeScript compartidos
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Requisitos

- Node.js 18+
- pnpm
- Docker + Docker Compose

## Setup

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores
```

También crear `apps/web/.env.local`:

```env
DATABASE_URL="postgresql://couple:couple_dev@localhost:5432/couple_db"
BETTER_AUTH_SECRET=<generá uno con: openssl rand -base64 32>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Levantar la base de datos

```bash
docker compose up -d
```

### 4. Correr migraciones

```bash
pnpm --filter @couple/db db:migrate
```

### 5. Iniciar la app

```bash
pnpm --filter web dev
```

La app corre en `http://localhost:3000`.

## pgAdmin

Disponible en `http://localhost:5050`
- Email: `admin@example.com`
- Password: `admin`

## Flujo de onboarding

1. El primer usuario se registra en `/sign-up` → se crea el grupo
2. Va a `/invite` y copia el link de invitación
3. La pareja entra al link → se registra → queda conectada al grupo
