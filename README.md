# Doc Reader

An API for extracting data from documents, built with Node.js, Express, Prisma and Docker.

## Requirements

- Docker and Docker Compose (v2) installed

## Quick start (Docker-first development)

1. Copy and edit environment variables:

```bash
cp .env.example .env
# Edit .env if needed (by default it is configured for PostgreSQL)
```

2. Start the stack (app + databases + admin UIs):

```bash
docker compose up -d

# Follow application logs
docker compose logs -f app
```

The app will be available at http://localhost:3000

### Initialize Prisma (first run)

```bash
# Run Prisma migrations (if any)
docker compose exec app npm run prisma:migrate:dev

# Generate Prisma Client
docker compose exec app npm run prisma:generate
```

### Available endpoint

- `GET /health` — returns a simple health check

## Databases

The stack includes two databases for flexibility:

- PostgreSQL (port 5432) — primary
- MongoDB (port 27017) — available if you decide to migrate later

### Switching from PostgreSQL to MongoDB

1. Edit `.env` and point `DATABASE_URL` to the MongoDB URL (comment out the PostgreSQL URL).

2. Update `src/prisma/schema.prisma` datasource `provider` to `"mongodb"` and run:

```bash
docker compose down
docker compose up -d
docker compose exec app npm run prisma:generate
```

## NPM scripts

Use the scripts declared in `package.json` from inside the container. Examples:

```bash
# Start the app (production mode)
npm start

# Development (nodemon watch) — used by the container
npm run dev

# Tests
npm test

# Prisma commands
npm run prisma
npm run prisma:generate
npm run prisma:migrate:dev
```

## Docker development flow

This project is developed inside Docker containers. The app container includes an entrypoint script
(`docker-entrypoint.sh`) that installs dependencies inside the container if `node_modules` is missing or incomplete.

The repository is mounted into the container via a bind mount (`.:/app`) so local code edits are reflected immediately.
`nodemon` runs in the container (via `npm run dev`) and restarts the app when source files change.

Common commands:

```bash
# Start all services
docker compose up -d

# Show app logs
docker compose logs -f app

# Open a shell in the app container
docker compose exec app sh

# Force reinstall dependencies inside the container
docker compose exec app npm ci
```

## Notes

- Keep secrets out of source control. Use `.env.example` as a template.
- Docker volumes persist database data across restarts. Use `docker compose down -v` to remove volumes and reset state.
