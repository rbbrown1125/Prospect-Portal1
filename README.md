# Prospect Portal

This repository contains both the Express API and the Vite-built React client that power the Prospect Portal application.

## Running with Docker

The Docker image now bundles everything the application needs to run in isolation:

- Node.js runtime and the compiled React client + Express server bundle
- A managed PostgreSQL 15 instance that is initialised on first run with the latest Drizzle schema
- Airtable-backed asset storage for profile photos (no ephemeral container disk usage)

### Build the image

```bash
docker build -t prospect-portal .
```

> **Troubleshooting:** If you see `docker: 'docker buildx build' requires 1 argument`, it means the build command was run
> without specifying the build context. Make sure to include the trailing `.` (or provide an explicit path/URL) so Docker
> knows which files to send to the build engine.

### Publish to Docker Hub

Authenticate with Docker Hub and push the built image so it can be consumed from Docker Desktop or other hosts:

```bash
docker login
docker tag prospect-portal your-dockerhub-user/prospect-portal:latest
docker push your-dockerhub-user/prospect-portal:latest
```

The repository also includes `scripts/publish-docker.sh` to streamline the workflow. Provide the Docker Hub repository name
(for example `your-dockerhub-user/prospect-portal`) and an optional tag:

```bash
./scripts/publish-docker.sh your-dockerhub-user/prospect-portal v1
```

The script simply wraps `docker build` and `docker push`. It assumes you are already logged in (`docker login`) and have the
appropriate permissions to publish to the chosen repository.

### Run the container

Provide the required secrets at runtime. The bundled database is available on `postgresql://postgres:postgres@127.0.0.1:5432/prospect_portal` inside the container, so you only need to override it when connecting to an external database.

```bash
docker run --rm \
  -p 5000:5000 \
  -e SESSION_SECRET="replace-with-strong-secret" \
  -e SENDGRID_API_KEY="<your-sendgrid-api-key>" \
  -e AIRTABLE_API_KEY="<your-airtable-personal-access-token>" \
  -e AIRTABLE_BASE_ID="<your-airtable-base-id>" \
  prospect-portal
```

On first boot the entrypoint script initialises Postgres, applies the Drizzle schema (`npm run db:push`) and then launches the server. Subsequent boots reuse the existing data directory inside the container. Mount `/var/lib/postgresql/data` to a volume if you want to persist the bundled database between container runs:

```bash
docker run --rm \
  -p 5000:5000 \
  -v prospect-portal-data:/var/lib/postgresql/data \
  ...
```

## Environment Variables

- `DATABASE_URL` – PostgreSQL connection string used by Drizzle ORM. Defaults to the bundled database when not set.
- `SESSION_SECRET` – Secret used to sign session cookies.
- `SENDGRID_API_KEY` – API key used when the application sends emails. Optional but recommended when email features are required.
- `AIRTABLE_API_KEY` – Airtable personal access token used to upload and manage profile image assets.
- `AIRTABLE_BASE_ID` – Airtable base that will receive uploaded assets.
- `AIRTABLE_TABLE_NAME` – Table within the base to store assets (defaults to `Assets`).
- `AIRTABLE_ATTACHMENT_FIELD` – Attachment field name within the table (defaults to `File`).
- `SEED_SAMPLE_DATA` – Set to `true` to automatically populate the bundled database (and Airtable, when configured) with demo data during container startup.
- `RUN_INTEGRATION_TESTS` – Set to `true` to execute the integration smoke tests before the application starts. When enabled you can optionally set `INTEGRATION_TEST_API` to point at an already running API to validate its health endpoint.
- `INTEGRATION_TEST_API` – Fully qualified URL of the API health endpoint to probe during smoke tests (skipped when unset).

## Sample data & smoke testing

The repository ships with a TypeScript seeding utility that provisions a demo admin user, sites, prospects, engagement history, and optionally an Airtable-hosted profile image. Use it locally with:

```bash
npm run seed:samples
```

To validate connectivity to the database, Airtable, SendGrid, and optionally a running API instance, execute the integration smoke test:

```bash
npm run test:integrations
```

The Docker entrypoint can run the same routines automatically by exporting `SEED_SAMPLE_DATA=true` and `RUN_INTEGRATION_TESTS=true` when launching the container.

Provide additional variables (such as OAuth credentials) as needed by your deployment scenario.
