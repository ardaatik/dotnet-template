---
name: backend-api
description: Explains the Azure Functions backend for web scraping, blob storage, Azure AI Search indexing, and RAG chat. Use when integrating with backend APIs, debugging crawl jobs, wiring frontend fetch calls, modifying scrape/chat/delete flows, or answering questions about endpoints, Durable Functions, or environment variables.
---

# Backend API

Read `docs/api.md` for full request/response schemas, error messages, and handler source files. Use this skill for orientation; consult the doc before implementing or changing API contracts.

## Architecture

| Item         | Value                                               |
| ------------ | --------------------------------------------------- |
| Stack        | .NET 8, Azure Functions v4, isolated worker         |
| Namespace    | `WebScrapper.Functions`                             |
| Local port   | 7233                                                |
| Route prefix | `/api/`                                             |
| Auth         | `AuthorizationLevel.Anonymous` on all HTTP triggers |
| Timeout      | 2 hours (`host.json`)                               |
| Durable hub  | `ScraperHubLocal`                                   |

**Data flow:** crawl URL → chunk content → Azure Blob Storage → Azure AI Search indexer → RAG chat over indexed chunks (optional Azure OpenAI synthesis).

## HTTP Endpoints

| Method   | Route                            | Purpose                                                                   |
| -------- | -------------------------------- | ------------------------------------------------------------------------- |
| `POST`   | `/api/ScrapeUrl`                 | Start async crawl; returns `jobId`, `crawlId`, `statusUrl` (202)          |
| `GET`    | `/api/ScrapeStatus/{instanceId}` | Poll Durable job status; `output` has `OrchestratorResult` when completed |
| `GET`    | `/api/ListUrls`                  | List scraped blobs with parsed metadata                                   |
| `GET`    | `/api/InspectBlobs`              | Debug: blob metadata + 200-char preview (not used by frontend)            |
| `DELETE` | `/api/DeleteUrl`                 | Delete by `crawlId` (session) or `blobName` (single); triggers indexer    |
| `POST`   | `/api/ResetAll`                  | Wipe all blobs and up to 1000 search docs; destructive                    |
| `POST`   | `/api/Chat`                      | RAG: top-4 search + optional OpenAI answer with citations                 |

Route names are case-insensitive (`/api/Chat` ≡ `/api/chat`).

### Key request bodies

**ScrapeUrl:** `{ url, maxDepth?, maxPages? }` — defaults: depth 2, pages 15.

**DeleteUrl:** `{ crawlId }` OR `{ blobName }` — exactly one required.

**Chat:** `{ question }` — returns `{ answer, citations[] }`.

### ScrapeUrl side effects

Before scheduling the orchestrator, `SearchIndexManager.EnsureFieldsExistAsync()` runs once per process to align index fields and indexer mappings.

## Durable Functions (non-HTTP)

```
POST /api/ScrapeUrl → ScrapeOrchestrator → ScrapePageActivity (parallel BFS) → Blob Storage
                                         → TriggerIndexerActivity → Azure AI Search
```

- **ScrapeOrchestrator:** BFS crawl, same-domain links only, respects `maxDepth` / `maxPages`.
- **ScrapePageActivity:** HTML via `HttpScraper`, SPA fallback via `PlaywrightScraper`; files via `FileProcessor`; chunks via `ContentProcessor`.
- **TriggerIndexerActivity:** POSTs indexer run; no-op if `SearchServiceName` unset.

Poll `GET /api/ScrapeStatus/{jobId}` until status is `Completed` or `Failed`.

## Environment Variables

| Variable                                                                    | Role                                   |
| --------------------------------------------------------------------------- | -------------------------------------- |
| `AzureWebJobsStorage`                                                       | Functions host storage                 |
| `FUNCTIONS_WORKER_RUNTIME`                                                  | `dotnet-isolated`                      |
| `ScraperBlobConnectionString`                                               | Blob connection                        |
| `ScraperContainerName`                                                      | Container (default `scraped-websites`) |
| `SearchServiceName`, `SearchApiKey`, `SearchIndexName`, `SearchIndexerName` | Azure AI Search                        |
| `AzureOpenAIEndpoint`, `AzureOpenAIApiKey`, `AzureOpenAIDeploymentName`     | Optional chat synthesis                |

Local values: `local.settings.json` (not committed).

## Frontend Integration (this repo)

| Component                                                                         | Endpoints                                                                   |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/components/CrawlPage.tsx`, `LinksDashboard.tsx`, `BackgroundJobsContext.tsx` | `POST /api/ScrapeUrl`, `GET /api/ScrapeStatus/{jobId}`, `GET /api/ListUrls` |
| `src/components/DocumentList.tsx`, `DocumentsPage.tsx`                            | `GET /api/ListUrls`, `DELETE /api/DeleteUrl`                                |
| `src/components/ResetPage.tsx`, `SystemReset.tsx`                                 | `POST /api/ResetAll`                                                        |
| `src/components/ChatInterface.tsx`, `ChatPage.tsx`                                | `POST /api/chat`                                                            |

## Agent Guidelines

1. **Contract changes:** Update both backend handlers and frontend fetch calls; verify field casing (`BlobName` vs `blobName` differs between ListUrls and DeleteUrl responses).
2. **Async crawls:** Never block on scrape completion in the HTTP handler; poll `ScrapeStatus` or use `BackgroundJobsContext`.
3. **Search lag:** After delete or crawl, indexer runs asynchronously — documents may lag in chat results by a few seconds.
4. **ResetAll:** Destructive; confirm intent before suggesting or calling in scripts.
5. **Missing OpenAI:** Chat still returns search context when Azure OpenAI env vars are absent.

## Typical Flow

1. `POST /api/ScrapeUrl` → get `jobId`
2. Poll `GET /api/ScrapeStatus/{jobId}` until done
3. `GET /api/ListUrls` for scraped documents
4. `POST /api/Chat` with a question
5. `DELETE /api/DeleteUrl` with `crawlId` to clean up, or `POST /api/ResetAll` to wipe everything
