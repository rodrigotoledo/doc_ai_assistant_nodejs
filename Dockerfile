FROM node:20-alpine AS base

ARG USER_ID=1000
ARG GROUP_ID=1000
# try creating group/user with the requested IDs; if those IDs are already
# present in the base image the commands may fail. tolerate failures and
# fall back to creating the group/user without forcing the numeric IDs.
RUN addgroup -g ${GROUP_ID} appgroup 2>/dev/null || addgroup appgroup || true \
 && adduser -D -u ${USER_ID} -G appgroup appuser 2>/dev/null || adduser -D -G appgroup appuser

# ensure the app directory exists and is owned by the app user (best-effort)
RUN mkdir -p /app \
 && chown -R appuser:appgroup /app || true
WORKDIR /app

# Instala dependências primeiro (melhor cache)
COPY package*.json ./
# NOTE: npm install is done at container start by docker-entrypoint.sh. We
# avoid running `npm ci` at build time so the image build won't fail if the
# build environment has restricted network/registry access. The entrypoint
# will perform a runtime install when necessary.

# Copia o restante do código
COPY . .

# Copia entrypoint que instala dependências em tempo de execução quando necessário
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENV NODE_ENV=development
EXPOSE 3000

ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
CMD ["npm", "start"]
