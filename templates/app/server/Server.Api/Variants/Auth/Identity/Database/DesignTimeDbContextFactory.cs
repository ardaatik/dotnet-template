using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Server.Api.Variants.Database;

namespace Server.Api.Database;

public sealed class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        IConfigurationRoot configuration = BuildConfiguration();
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        DatabaseProviderConfigurator.ConfigureApplication(optionsBuilder, configuration);
        return new ApplicationDbContext(optionsBuilder.Options);
    }

    internal static IConfigurationRoot BuildConfiguration()
    {
        string environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        return new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .AddEnvironmentVariables()
            .Build();
    }
}

public sealed class ApplicationIdentityDbContextFactory : IDesignTimeDbContextFactory<ApplicationIdentityDbContext>
{
    public ApplicationIdentityDbContext CreateDbContext(string[] args)
    {
        IConfigurationRoot configuration = ApplicationDbContextFactory.BuildConfiguration();
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationIdentityDbContext>();
        DatabaseProviderConfigurator.ConfigureIdentity(optionsBuilder, configuration);
        return new ApplicationIdentityDbContext(optionsBuilder.Options);
    }
}
