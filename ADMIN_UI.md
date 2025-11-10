docker compose up -d
Admin UIs included in Docker Compose

To make database administration easier, the `docker-compose.yml` contains two optional admin UIs:

- pgAdmin (available at `http://localhost:5050`) — a web interface for managing PostgreSQL. Use the credentials defined in `.env` (`PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD`) to log in. In pgAdmin add a server pointing to host `postgres` and port `5432`.

- mongo-express (available at `http://localhost:8081`) — a lightweight web UI for MongoDB. Credentials are read from `MONGO_EXPRESS_USER` and `MONGO_EXPRESS_PASS` in `.env`.

Quick example:

```bash
# Start services
docker compose up -d

# Open pgAdmin at http://localhost:5050
# Open mongo-express at http://localhost:8081
```

If you prefer not to expose these UIs, remove or comment out the `pgadmin` and `mongo-express` services in `docker-compose.yml`.
