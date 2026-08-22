## Database (SQL Server)

Local SQL Server runs in Docker on port **1433**.

| Setting | Value |
|---------|-------|
| Server | `localhost,1433` |
| Database | `server` |
| User | `sa` |
| Password | `Password1!` |

Connection string (already in `appsettings.Development.json`):

```
Server=server.sqlserver;Database=server;User Id=sa;Password=Password1!;TrustServerCertificate=True
```
