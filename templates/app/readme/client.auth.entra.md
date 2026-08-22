## Entra environment variables

Copy `.env.example` to `.env` and fill in your Entra app registration values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `VITE_ENTRA_CLIENT_ID` | Entra app registration client ID |
| `VITE_ENTRA_AUTHORITY` | Authority URL, e.g. `https://login.microsoftonline.com/{tenantId}` |

Restart the dev server after changing `.env`.
