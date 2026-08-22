using System.Text;
using Azure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Graph;
using Microsoft.Identity.Web;
using Microsoft.IdentityModel.Tokens;
using Server.Api.Authorization;
using Server.Api.Database;
using Server.Api.Services;
using Server.Api.Settings;
using Server.Api.Variants.Database;

namespace Server.Api.Variants.Auth;

public static class AuthVariantExtensions
{
    public static WebApplicationBuilder AddDatabaseProvider(this WebApplicationBuilder builder)
    {
        builder.Services.AddDbContext<ApplicationDbContext>(options =>
            DatabaseProviderConfigurator.ConfigureApplication(options, builder.Configuration));

        return builder;
    }

    public static WebApplicationBuilder AddAuthProvider(this WebApplicationBuilder builder)
    {
        builder.Services.AddSingleton<GraphServiceClient>(_ =>
        {
            var clientSecretCredential = new ClientSecretCredential(
                builder.Configuration["AzureAd:TenantId"]!,
                builder.Configuration["AzureAd:ClientId"]!,
                builder.Configuration["AzureAd:ClientSecret"]!);

            return new GraphServiceClient(clientSecretCredential);
        });

        builder.Services.Configure<JwtAuthOptions>(builder.Configuration.GetSection(JwtAuthOptions.SectionName));
        JwtAuthOptions jwtAuthOptions = builder.Configuration
            .GetSection(JwtAuthOptions.SectionName)
            .Get<JwtAuthOptions>()!;

        builder.Services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuer = jwtAuthOptions.Issuer,
                    ValidAudience = jwtAuthOptions.Audience,
                    ValidateLifetime = true,
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtAuthOptions.Key)),
                    ClockSkew = TimeSpan.Zero
                };
            })
            .AddMicrosoftIdentityWebApi(options =>
            {
                builder.Configuration.Bind("AzureAd", options);
                options.TokenValidationParameters.RoleClaimType =
                    "http://schemas.microsoft.com/identity/claims/scope";
            },
            options => builder.Configuration.Bind("AzureAd", options),
            "Entra");

        builder.Services.AddAuthorization(ConfigureAuthorizationPolicies.Configure);
        builder.Services.AddScoped<IUserClaimsProvider, DbUserClaimsProvider>();
        builder.Services.AddScoped<IIdentityResolverService, IdentityResolverService>();
        builder.Services.AddTransient<TokenProvider>();

        return builder;
    }
}
