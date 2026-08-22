using Microsoft.Extensions.FileProviders;

namespace Server.Api.Extensions;

public static class SpaExtensions
{
    public static WebApplication UseSpaStaticFiles(this WebApplication app)
    {
        string wwwrootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
        if (!File.Exists(Path.Combine(wwwrootPath, "index.html")))
        {
            return app;
        }

        PhysicalFileProvider fileProvider = new(wwwrootPath);

        app.UseDefaultFiles(new DefaultFilesOptions
        {
            FileProvider = fileProvider,
        });

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = fileProvider,
            OnPrepareResponse = context =>
            {
                if (context.Context.Request.Path.StartsWithSegments("/assets"))
                {
                    context.Context.Response.Headers.CacheControl = "public,max-age=31536000,immutable";
                }
            },
        });

        return app;
    }

    public static WebApplication MapSpaFallback(this WebApplication app)
    {
        string indexPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "index.html");
        if (!File.Exists(indexPath))
        {
            return app;
        }

        app.MapFallbackToFile("index.html", new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(Path.GetDirectoryName(indexPath)!),
        });

        return app;
    }
}
