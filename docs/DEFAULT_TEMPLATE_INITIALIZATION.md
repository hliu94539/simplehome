# Default Template Initialization

## Background

When the app is deployed to a fresh environment (e.g. Railway), new users see 0 items/tasks because no
per-user maintenance data has been created.  Four JSON files already exist in the project root that describe
the full catalog of maintenance items for each supported property type:

| File | Property type |
|---|---|
| `maintenance-template-singleFamilyHome.json` | `single_family` – 87 items |
| `maintenance-template-townhouse.json` | `townhouse` – 6 items |
| `maintenance-template-condo.json` | `condo` – 8 items |
| `maintenance-template-commercial.json` | `commercial` – 28 items |

The goal is to automatically initialize a new user's account with all four property templates and their
associated maintenance tasks at registration time.

---

## Implementation Plan

### Step 1 – Default Template Loader service (done)

**File:** `server/services/defaultTemplateLoader.ts`

A standalone, side-effect-free service that reads and normalizes the four JSON template files into
seed-ready objects.  No database writes occur here.

#### Exported API

```ts
loadDefaultTemplateSeeds(baseDir?: string): DefaultTemplateSeed[]
```

Reads the four JSON files under `baseDir` (defaults to `process.cwd()`), parses each
`householdCatalog` array, and returns a `DefaultTemplateSeed` for every property type.

```ts
summarizeDefaultTemplateSeeds(seeds: DefaultTemplateSeed[]): Record<DefaultTemplateType, number>
```

Returns a simple `{ type: count }` map – useful for logging and assertions.

#### Key types

```ts
type DefaultTemplateType = "single_family" | "townhouse" | "condo" | "commercial";

interface DefaultTemplateSeed {
  type: DefaultTemplateType;   // matches PropertyTemplate.type
  name: string;
  description: string;
  sourceFile: string;
  tasks: DefaultTemplateTaskSeed[];
}

interface DefaultTemplateTaskSeed {
  sourceItemId: string;   // original item id from JSON (useful for idempotency checks)
  task: InsertMaintenanceTask;
}
```

#### Normalization performed

- `lastMaintenanceDate` / `nextMaintenanceDate` – parsed from `{ minor, major }` raw objects and
  serialized via `serializeMaintenanceSchedule` (same format used by the rest of the app).
- `installationDate` – converted from an ISO date string to a `Date` or `null`.
- Empty / whitespace strings for `brand`, `model`, `location`, `notes` are coerced to `null`.
- `relatedItemIds` – serialized to a JSON string if present, otherwise `null`.
- Items missing `id` or `name` are silently skipped.
- `templateId` is set to `null` here and will be assigned by the caller once a
  `PropertyTemplate` record has been created for the user.

---

### Step 2 – Per-user initialization (next)

Add a function `initializeUserDefaultTemplates(userId, storage)` that, for each `DefaultTemplateSeed`:

1. Creates a `PropertyTemplate` record in `property_templates` (with `userId`).
2. Inserts all seed tasks into `maintenance_tasks` with `userId` and `templateId` set.
3. Updates `taskCount` on the template to match the actual number of inserted tasks.

### Step 3 – Wire into registration (next)

Call `initializeUserDefaultTemplates` immediately after `storage.createUser` succeeds inside
`POST /api/auth/register` in `server/routes.ts`.

### Step 4 – Backfill for existing users (next)

Add a self-heal pass in `MongoDBStorage.initialize()` that detects users who have no linked tasks for
one or more default property types and runs the initialization for them.

---

## Testing Notes

The loader can be exercised directly:

```bash
npx tsx -e "
import { loadDefaultTemplateSeeds, summarizeDefaultTemplateSeeds } from './server/services/defaultTemplateLoader.ts';
const seeds = loadDefaultTemplateSeeds(process.cwd());
console.log(JSON.stringify(summarizeDefaultTemplateSeeds(seeds)));
"
# → {"single_family":87,"townhouse":6,"condo":8,"commercial":28}
```
