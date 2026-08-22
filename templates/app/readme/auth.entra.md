## Authentication (Microsoft Entra ID)

Hybrid auth: MSAL sign-in on the client, app-issued JWT for API calls.

### Entra app registration

1. Create an Entra app registration (SPA + API).
2. Add redirect URI: `http://localhost:5173`.
3. Expose scope: `api://{clientId}/API.Read`.
4. Configure server secrets (user-secrets or environment):

```bash
cd server/Server.Api
dotnet user-secrets set "AzureAd:TenantId" "<tenant-id>"
dotnet user-secrets set "AzureAd:ClientId" "<client-id>"
dotnet user-secrets set "AzureAd:ClientSecret" "<client-secret>"
dotnet user-secrets set "AzureAd:Audience" "api://<client-id>"
```

5. Configure the client — see [client/ui/README.md](client/ui/README.md) for `.env` setup.
