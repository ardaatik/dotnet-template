using Server.Api.DTOs.Common;

namespace Server.Api.Services;

public sealed class LinkService(
    LinkGenerator linkGenerator,
    IHttpContextAccessor httpContextAccessor,
    IWebHostEnvironment environment)
{
    public LinkDto Create(
        string endpointName,
        string rel,
        string method,
        object? values = null,
        string? controller = null)
    {
        string? href = linkGenerator.GetUriByAction(
            httpContextAccessor.HttpContext!,
            endpointName,
            controller,
            values);

        if (href == null)
        {
            throw new Exception("Invalid endpoint name provided");
        }

        // Upgrade to HTTPS only when the incoming request is HTTPS (or terminated as such at a proxy).
        if (!environment.IsDevelopment() &&
            href.StartsWith("http://", StringComparison.Ordinal))
        {
            HttpRequest request = httpContextAccessor.HttpContext!.Request;
            bool requestIsHttps = request.IsHttps ||
                string.Equals(request.Headers["X-Forwarded-Proto"], "https", StringComparison.OrdinalIgnoreCase);

            if (requestIsHttps)
            {
                href = href.Replace("http://", "https://", StringComparison.Ordinal);
            }
        }

        return new LinkDto
        {
            Href = href,
            Rel = rel,
            Method = method
        };
    }
}
