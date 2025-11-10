#!/bin/sh
set -e

# Trabalha no diretório da aplicação
cd /app || exit 0

log() {
  echo "[entrypoint] $@"
}

install_deps() {
  log "Installing dependencies inside container..."
  tries=0
  max_attempts=3
  while [ "$tries" -lt "$max_attempts" ]; do
    if [ -f package-lock.json ]; then
      log "npm ci (attempt $((tries+1))/$max_attempts)"
      npm ci --no-audit --no-fund && break || log "npm ci failed"
    else
      log "npm install (attempt $((tries+1))/$max_attempts)"
      npm install --no-audit --no-fund && break || log "npm install failed"
    fi
    tries=$((tries+1))
    log "Retrying dependency install in 2s..."
    sleep 2
  done

  # Final check
  if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    log "ERROR: node_modules is empty after install attempts"
    return 1
  fi
  if [ ! -x node_modules/.bin/nodemon ]; then
    log "Warning: nodemon not found in node_modules/.bin"
  fi

  log "Dependencies installed/checked"
  return 0
}

# Decide se precisa instalar (se estiver vazio ou sem nodemon)
NEEDS_INSTALL=0
if [ ! -d node_modules ]; then
  NEEDS_INSTALL=1
else
  if [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    NEEDS_INSTALL=1
  fi
  if [ ! -x node_modules/.bin/nodemon ]; then
    NEEDS_INSTALL=1
  fi
fi

if [ "$NEEDS_INSTALL" -eq 1 ]; then
  if ! install_deps; then
    log "Dependency installation failed - continuing but app may fail."
  fi
fi

# Ensure Prisma client is generated if Prisma is available
generate_prisma_client() {
  SCHEMA_PATH="src/prisma/schema.prisma"
  if [ -x node_modules/.bin/prisma ] || command -v npx >/dev/null 2>&1; then
    log "Generating Prisma client (schema: $SCHEMA_PATH)"
    if npx prisma generate --schema="$SCHEMA_PATH"; then
      log "Prisma client generated"
    else
      log "Warning: prisma generate failed"
    fi
  else
    log "Prisma CLI not available; skipping prisma generate"
  fi
}

generate_prisma_client

# Ensure uploads directory exists and is writable inside the container
uploads_dir="/app/uploads"
if [ ! -d "$uploads_dir" ]; then
  log "Creating uploads directory: $uploads_dir"
  mkdir -p "$uploads_dir" || log "Warning: failed to create uploads directory"
fi
log "Setting permissive permissions on uploads directory ($uploads_dir)"
chmod 0777 "$uploads_dir" || log "Warning: chmod on uploads directory failed"

# Finally execute the passed command (ex: npm run dev)
log "Executing: $@"
exec "$@"
