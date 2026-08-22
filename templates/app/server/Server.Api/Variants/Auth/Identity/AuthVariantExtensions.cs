using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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

        builder.Services.AddDbContext<ApplicationIdentityDbContext>(options =>
            DatabaseProviderConfigurator.ConfigureIdentity(options, builder.Configuration));

        return builder;
    }

    public static WebApplicationBuilder AddAuthProvider(this WebApplicationBuilder builder)
    {
        builder.Services
            .AddIdentity<IdentityUser, IdentityRole>()
            .AddEntityFrameworkStores<ApplicationIdentityDbContext>();

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
            .AddJwtBearer(options =>
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
            });

        builder.Services.AddAuthorization(ConfigureAuthorizationPolicies.Configure);
        builder.Services.AddTransient<TokenProvider>();

        return builder;
    }
}
