using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Server.Api.Database;

namespace Server.Api.Variants.Database;

public static class DatabaseProviderConfigurator
{
    public static void ConfigureApplication(DbContextOptionsBuilder options, IConfiguration configuration)
    {
        options
            .UseSqlServer(
                configuration.GetConnectionString("Database"),
                sqlOptions => sqlOptions
                    .MigrationsHistoryTable(HistoryRepository.DefaultTableName, Schemas.Application))
            .UseSnakeCaseNamingConvention();
    }

    public static void ConfigureIdentity(DbContextOptionsBuilder options, IConfiguration configuration)
    {
        options
            .UseSqlServer(
                configuration.GetConnectionString("Database"),
                sqlOptions => sqlOptions
                    .MigrationsHistoryTable(HistoryRepository.DefaultTableName, Schemas.Identity))
            .UseSnakeCaseNamingConvention();
    }
}
