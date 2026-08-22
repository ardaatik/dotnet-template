## Database (PostgreSQL)

Local PostgreSQL runs in Docker on port **5432**.

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `server` |
| User | `postgres` |
| Password | `Password1!` |

Connection string (already in `appsettings.Development.json`):

```
Host=server.postgres;Port=5432;Database=server;Username=postgres;Password=Password1!
```
