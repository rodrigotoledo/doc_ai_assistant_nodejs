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
docker compose build --no-cache app

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

### Upload example (multipart)

You can upload a file to the running app using multipart/form-data. Example using curl from your local machine (assumes the stack is up and the app on localhost:3000):

```bash
# from the repo root, use the fixture included with the project as a quick test
curl -v -F "file=@tests/fixtures/identification.txt" http://localhost:3000/documents

# or, from anywhere, point to a full path on your machine that contains the file
# curl -v -F "file=@/full/path/to/identification.txt" http://localhost:3000/documents
```

The server will save the file to the `uploads/` directory (ignored by git) and return the created document JSON.

## Databases

The stack includes two databases for flexibility:

- PostgreSQL (port 5432) — primary
- MongoDB (port 27017) — available if you decide to migrate later

### Database Environments (Development vs Test)

Similar to Rails, this project uses separate PostgreSQL databases for development and testing:

- **Development**: `doc_reader_dev` database
- **Test**: `doc_reader_test` database

The app automatically switches databases based on the `NODE_ENV` environment variable:

- `NODE_ENV=development` (default in Docker) → uses `doc_reader_dev`
- `NODE_ENV=test` (set during testing) → uses `doc_reader_test`

This ensures:
- Development data doesn't interfere with tests
- Tests run against a clean database state
- Integration tests use real database operations (no mocks for DB layer)

### Switching from PostgreSQL to MongoDB

1. Edit `.env` and point `DATABASE_URL` to the MongoDB URL (comment out the PostgreSQL URL).

2. Update `src/prisma/schema.prisma` datasource `provider` to `"mongodb"` and run:

```bash
docker compose down
docker compose up -d
docker compose exec app npm run prisma:generate
```

## Testing with docker

Run the command below to test manually

```bash
docker compose exec app npm run test
```

### Automatic test watcher (like Rails Guard)

If you want tests to re-run automatically when source or test files change (similar to Rails' Guard), this project provides two options via npm scripts:

- `npm run test:watch` — runs Jest in watch mode (recommended). Jest will run only affected tests and is fast.
- `npm run test:watch:nodemon` — uses `nodemon` to re-run the full `npm test` command on file changes (runs the whole suite each change).

Run either from inside the running app container:

```bash
# Jest watch (smart incremental runs)
docker compose exec app npm run test:watch

# Nodemon-based full-run watcher
docker compose exec app npm run test:watch:nodemon
```

If you prefer an isolated watcher container (so your main `app` service stays focused on the server), add a small service to `docker-compose.override.yml` or a local override file:

```yaml
services:
  watcher:
    image: doc-reader-app
    command: ["npm", "run", "test:watch"]
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    env_file:
      - .env
    user: "${UID}:${GID}"
```

Start it with:

```bash
docker compose up -d watcher
docker compose logs -f watcher
```

Notes:

- Use the Jest watch mode for faster, smarter runs — it runs only tests affected by the changed files.
- The `nodemon` watcher is simpler (re-runs the command on any change) but slower for large suites.
- Because the project uses a bind mount (`.:/app`), file edits on the host are visible to watchers running inside containers.
- If you use `npm ci` or change `package.json`, remember to regenerate/commit `package-lock.json` so installs are deterministic inside containers.

### Coverage watcher and recommended workflow

This project provides a few ways to run tests and generate coverage. Coverage generation is slower than the Jest watch mode because it runs the full suite and creates an HTML report.

Scripts available in `package.json` (use inside the running app container or locally):

- `npm run test` — run the test suite once.
- `npm run test:watch` — Jest's interactive watch mode (fast, incremental).
- `npm run test:watch:nodemon` — nodemon-based watcher that reruns the full `npm test` suite when files change (simple but slower).
- `npm run test:coverage` — run Jest with coverage and generate the `coverage/` report (HTML at `coverage/lcov-report/index.html`).
- `npm run test:watch:nodemon:coverage` — nodemon-based watcher that reruns `npm run test:coverage` on file changes (very slow; use sparingly).

Examples (run inside container via Docker Compose):

```bash
# Prisma commands
docker compose exec app npm run prisma
docker compose exec app npm run prisma:generate
docker compose exec app npm run prisma:migrate:dev

# interactive Jest watch (recommended for fast dev feedback)
docker compose exec app npm run test:watch

# nodemon-based full-run watcher
docker compose exec app npm run test:watch:nodemon

# run coverage once
docker compose exec app npm run test:coverage

# coverage watcher (re-runs coverage on each change - slow)
docker compose exec app npm run test:watch:nodemon:coverage
```

After running coverage, open the report (host machine):

```bash
# from repo root (Linux)
xdg-open coverage/lcov-report/index.html || true
# or open manually in your browser
```

Recommendations and improvements

- Use `npm run test:watch` (Jest watch) during active development — it is the fastest and most ergonomic.
- Use coverage runs (`npm run test:coverage`) in CI or when you need up-to-date metrics.
- Consider adding a coverage threshold in Jest config to fail CI on regressions (e.g. `coverageThreshold`). I can add an example for your CI config.
- Add unit tests for the service layer (`src/services/documents.service.js`) to raise coverage; currently service coverage is the primary uncovered area.
- In CI, run `npm run test:coverage` and upload `coverage/lcov.info` to a code-coverage service (Codecov/Coveralls) if you want history and PR checks.

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

### Fixing uploads permissions inside the container / from the host

If you see permission errors when the app or tests try to write into `uploads/` (for example when the directory was created by root), you can fix ownership/permissions from the host or inside the running container.

From the host (sets container `uploads/` ownership to your current user's UID:GID):

```bash
# run from the repo root on your machine
docker compose exec app chown -R "$(id -u):$(id -g)" /app/uploads || true
docker compose exec app chmod -R 0777 /app/uploads || true
```

Or run the same commands inside the container (useful in CI when numeric IDs are different):

```bash
docker compose exec app sh -c "chown -R $(id -u):$(id -g) /app/uploads || true"
docker compose exec app sh -c "chmod -R 0777 /app/uploads || true"
```

These commands are best-effort and use `|| true` to avoid failing in environments where the operations are unnecessary or not permitted.

## Notes

- Keep secrets out of source control. Use `.env.example` as a template.
- Docker volumes persist database data across restarts. Use `docker compose down -v` to remove volumes and reset state.
