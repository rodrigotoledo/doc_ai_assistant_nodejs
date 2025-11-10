FROM node:20-alpine AS base

ARG USER_ID=1000
ARG GROUP_ID=1000

# create a group and user that will match the host UID/GID when building with build-args
RUN addgroup -g ${GROUP_ID} appgroup \
 && adduser -D -u ${USER_ID} -G appgroup appuser

# create app dir and ensure ownership for the non-root user
RUN mkdir -p /app && chown -R appuser:appgroup /app
WORKDIR /app

# copy the entrypoint and make it executable (done as root)
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# copy package files and ensure ownership so installs run as the non-root user
COPY package*.json ./
RUN chown -R appuser:appgroup /app

# switch to the non-root user for installs and runtime (prevents root-owned files on host mounts)
USER appuser

# install dependencies (development image — try clean install, fallback to npm install)
RUN npm ci || npm install

# copy rest of the source as the app user
COPY --chown=appuser:appgroup . .

ENV NODE_ENV=development
EXPOSE 3000

ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
CMD ["npm", "start"]
