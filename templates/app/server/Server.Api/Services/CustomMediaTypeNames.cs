namespace Server.Api.Services;

public static class CustomMediaTypeNames
{
    public static class Application
    {
        public const string JsonV1 = "application/json;v=1";
        public const string JsonV2 = "application/json;v=2";
        public const string HateoasJson = "application/vnd.dotnet-template.hateoas+json";
        public const string HateoasJsonV1 = "application/vnd.dotnet-template.hateoas.1+json";
        public const string HateoasJsonV2 = "application/vnd.dotnet-template.hateoas.2+json";

        public const string HateoasSubType = "hateoas";
    }
}
