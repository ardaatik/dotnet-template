using DotNet.Testcontainers.Containers;
using Testcontainers.MsSql;
using Testcontainers.PostgreSql;

namespace DotnetTemplate.Test.Infrastructure;

public sealed class DatabaseContainer : IAsyncDisposable
{
    private readonly IContainer _container;

    private DatabaseContainer(IContainer container, string connectionString)
    {
        _container = container;
        ConnectionString = connectionString;
    }

    public string ConnectionString { get; }

    public static async Task<DatabaseContainer> StartAsync(string db)
    {
        return db switch
        {
            "sqlserver" => await StartSqlServerAsync(),
            "postgres" => await StartPostgresAsync(),
            _ => throw new ArgumentOutOfRangeException(nameof(db), db, "Unknown database provider."),
        };
    }

    public async ValueTask DisposeAsync()
    {
        await _container.DisposeAsync();
    }

    private static async Task<DatabaseContainer> StartSqlServerAsync()
    {
        MsSqlContainer container = new MsSqlBuilder()
            .WithPassword("Password1!")
            .Build();

        await container.StartAsync();
        return new DatabaseContainer(container, AppendSqlServerOptions(container.GetConnectionString()));
    }

    private static async Task<DatabaseContainer> StartPostgresAsync()
    {
        PostgreSqlContainer container = new PostgreSqlBuilder()
            .WithDatabase("server")
            .WithUsername("postgres")
            .WithPassword("Password1!")
            .Build();

        await container.StartAsync();
        return new DatabaseContainer(container, container.GetConnectionString());
    }

    private static string AppendSqlServerOptions(string connectionString)
    {
        if (!connectionString.Contains("Database=", StringComparison.OrdinalIgnoreCase))
        {
            connectionString += ";Database=server";
        }

        if (!connectionString.Contains("TrustServerCertificate=", StringComparison.OrdinalIgnoreCase))
        {
            connectionString += ";TrustServerCertificate=True";
        }

        return connectionString;
    }
}
