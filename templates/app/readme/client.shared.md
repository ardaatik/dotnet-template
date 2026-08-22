# Client UI

React + TypeScript + Vite SPA.

## Install and run

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run build:server` | Build and copy to `server/Server.Api/wwwroot` |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright end-to-end tests |

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | `http://localhost:5000` (dev) | API origin |

Create a `.env` file in this directory to override defaults.
