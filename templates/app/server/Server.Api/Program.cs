using Scalar.AspNetCore;
using Server.Api;
using Server.Api.Extensions;
using Server.Api.Settings;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder
    .AddApiServices()
    .AddErrorHandling()
    .AddDatabase()
    .AddObservability()
    .AddApplicationServices()
    .AddAuthenticationServices()
    .AddCorsPolicy();

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    app.MapScalarApiReference(options =>
    {
        options.WithOpenApiRoutePattern("/swagger/1.0/swagger.json");
    });
    await app.ApplyMigrationsAsync();
    await app.SeedInitialDataAsync();
}


app.UseExceptionHandler();

app.UseCors(CorsOptions.PolicyName);

app.UseAuthentication();
app.UseAuthorization();

app.UseSpaStaticFiles();

app.MapControllers();

app.MapSpaFallback();

await app.RunAsync();
