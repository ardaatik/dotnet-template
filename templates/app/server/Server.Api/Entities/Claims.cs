namespace Server.Api.Entities;

public static class Claims
{
    public static class Types
    {
        public const string Todos = "todos";
        public const string Tables = "tables";
        public const string Users = "users";
        public const string Permission = "permission";
    }

    public static class Values
    {
        // CRUD operations
        public const string Read = "read";
        public const string Create = "create";
        public const string Update = "update";
        public const string Delete = "delete";

        // Permissions
        public const string UsersManage = "users.manage";
        public const string RolesManage = "roles.manage";

        // Own resource access
        public const string ReadOwn = "read_own";
        public const string UpdateOwn = "update_own";
    }

    // Helper methods for creating common claims
    public static class TodoClaims
    {
        public static System.Security.Claims.Claim Read() => new(Types.Todos, Values.Read);
        public static System.Security.Claims.Claim Create() => new(Types.Todos, Values.Create);
        public static System.Security.Claims.Claim Update() => new(Types.Todos, Values.Update);
        public static System.Security.Claims.Claim Delete() => new(Types.Todos, Values.Delete);
    }

    public static class TableClaims
    {
        public static System.Security.Claims.Claim Read() => new(Types.Tables, Values.Read);
        public static System.Security.Claims.Claim Create() => new(Types.Tables, Values.Create);
        public static System.Security.Claims.Claim Update() => new(Types.Tables, Values.Update);
    }

    public static class UserClaims
    {
        public static System.Security.Claims.Claim Read() => new(Types.Users, Values.Read);
        public static System.Security.Claims.Claim Update() => new(Types.Users, Values.Update);
        public static System.Security.Claims.Claim ReadOwn() => new(Types.Users, Values.ReadOwn);
        public static System.Security.Claims.Claim UpdateOwn() => new(Types.Users, Values.UpdateOwn);
    }

    public static class PermissionClaims
    {
        public static System.Security.Claims.Claim UsersManage() => new(Types.Permission, Values.UsersManage);
        public static System.Security.Claims.Claim RolesManage() => new(Types.Permission, Values.RolesManage);
    }
}
