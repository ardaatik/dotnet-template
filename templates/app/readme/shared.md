# Getting Started

Full-stack app: ASP.NET Core API + React SPA.

## Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local database)

## Quick start

1. Start the database:

```bash
cd server
docker compose -f docker-compose.db.yml up -d
```

2. Run the API:

```bash
cd server/Server.Api
dotnet run
```

The API listens on `http://localhost:5000` (Swagger at `/swagger`).

3. Run the UI:

```bash
cd client/ui
npm install
npm run dev
```

The UI runs at `http://localhost:5173`. See [client/ui/README.md](client/ui/README.md) for UI-specific setup.
