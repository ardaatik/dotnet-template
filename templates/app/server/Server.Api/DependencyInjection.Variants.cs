using Server.Api.Variants.Auth;

namespace Server.Api;

public static partial class DependencyInjection
{
    public static WebApplicationBuilder AddDatabase(this WebApplicationBuilder builder) =>
        builder.AddDatabaseProvider();

    public static WebApplicationBuilder AddAuthenticationServices(this WebApplicationBuilder builder) =>
        builder.AddAuthProvider();
}
