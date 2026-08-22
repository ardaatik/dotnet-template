# Dotnet Template

Parameterized full-stack project template: ASP.NET Core API + React SPA with Todos sample, JWT authorization, Docker, and selectable variants.

## Variants

| Symbol | Values                            | Description                                     |
| ------ | --------------------------------- | ----------------------------------------------- |
| `db`   | `sqlserver` (default), `postgres` | Database provider + docker compose              |
| `auth` | `identity` (default), `entra`     | Email/password vs Entra hybrid (MSAL → app JWT) |

## Generate a project

**Recommended — wizard** (installs template, generates, and configures variants):

```bash
dotnet run --project src/DotnetTemplate.Cli
```

**Manual:**

```bash
dotnet new install ./templates/app
dotnet new dotnet-template-app -n MyApp -o ./MyApp --db postgres --auth entra --allow-scripts yes
```

The `dotnet new` post-action runs configure automatically. To re-run manually:

```bash
dotnet run --project src/DotnetTemplate.Cli -- configure ./MyApp --db postgres --auth entra
```

Generated projects include variant-specific READMEs at the project root and in `client/ui`.

## How configure works

After `dotnet new` copies the template, a post-action runs `tools/configure`, which:

1. Copies the matching db/auth files (csproj, DI, docker compose, controllers, migrations)
2. Assembles variant-specific READMEs from `readme/` fragments
3. Removes scaffolding (`Infra/`, `Variants/`, `tools/`, `readme/`)

The CLI ([`src/DotnetTemplate.Cli`](src/DotnetTemplate.Cli/Program.cs)) references the same configure project and can run configure without the generated copy.

## Local template development

Default build uses SQL Server + Identity:

```bash
cd templates/app/server/Server.Api
dotnet build
```

Other combinations:

```bash
dotnet build --property:DbProvider=Postgres --property:AuthProvider=Entra
```

Verify all four generated combinations (requires Docker for database smoke tests):

```bash
dotnet test tests/DotnetTemplate.Test
```

## Repository layout

```
templates/app/              # dotnet new template source
  readme/                   # README fragments (assembled at configure time)
  tools/configure/          # Post-action configurator
  server/                   # ASP.NET Core API
  client/ui/                # React SPA
src/DotnetTemplate.Cli/     # Interactive wizard CLI
tests/DotnetTemplate.Test/  # Template verification tests
```

## CI

Pull requests and pushes to `main` run `dotnet test tests/DotnetTemplate.Test`, which generates all four db/auth combinations, builds each server, and smoke-tests database migrations.
