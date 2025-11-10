#!/bin/sh
set -e

# Trabalha no diretório da aplicação
cd /app || exit 0

install_deps() {
  echo "[entrypoint] Installing dependencies inside container..."
  if [ -f package-lock.json ]; then
    npm ci --silent --no-audit || npm install --silent --no-audit
  else
    npm install --silent --no-audit || true
  fi
}

# Condições que exigem instalação:
# - node_modules não existe
# - node_modules existe mas está vazio
# - nodemon (ou algum bin) não está presente
NEEDS_INSTALL=0
if [ ! -d node_modules ]; then
  NEEDS_INSTALL=1
else
  if [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    NEEDS_INSTALL=1
  fi
  if [ ! -x node_modules/.bin/nodemon ] && [ ! -x node_modules/.bin/.nodemon ]; then
    # nodemon não encontrado nos binários locais
    NEEDS_INSTALL=1
  fi
fi

if [ "$NEEDS_INSTALL" -eq 1 ]; then
  install_deps
fi

# Executa o comando passado (ex: npm run dev)
exec "$@"
