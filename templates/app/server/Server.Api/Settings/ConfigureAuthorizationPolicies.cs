using Microsoft.AspNetCore.Authorization;
using Server.Api.Entities;

namespace Server.Api.Settings;

public static class ConfigureAuthorizationPolicies
{
    public static void Configure(AuthorizationOptions options)
    {
        options.AddPolicy("TodosRead", policy =>
            policy.RequireClaim(Claims.Types.Todos, Claims.Values.Read));
        options.AddPolicy("TodosCreate", policy =>
            policy.RequireClaim(Claims.Types.Todos, Claims.Values.Create));
        options.AddPolicy("TodosUpdate", policy =>
            policy.RequireClaim(Claims.Types.Todos, Claims.Values.Update));
        options.AddPolicy("TodosDelete", policy =>
            policy.RequireClaim(Claims.Types.Todos, Claims.Values.Delete));

        options.AddPolicy("UsersRead", policy =>
            policy.RequireClaim(Claims.Types.Users, Claims.Values.Read));
        options.AddPolicy("UsersUpdate", policy =>
            policy.RequireClaim(Claims.Types.Users, Claims.Values.Update));
        options.AddPolicy("UsersManage", policy =>
            policy.RequireClaim(Claims.Types.Permission, Claims.Values.UsersManage));

        // Administrative permissions
        options.AddPolicy("RolesManage", policy =>
            policy.RequireClaim(Claims.Types.Permission, Claims.Values.RolesManage));

        // Own resource access (for members to access/update their own profile)
        options.AddPolicy("OwnProfileAccess", policy =>
            policy.RequireAssertion(context =>
                context.User.HasClaim(Claims.Types.Users, Claims.Values.ReadOwn) ||
                context.User.HasClaim(Claims.Types.Users, Claims.Values.UpdateOwn) ||
                context.User.IsInRole(Roles.Admin)));
    }
}