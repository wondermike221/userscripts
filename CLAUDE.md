# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run dev                    # watch mode, all outputs
npm run dev:userscripts        # watch mode, userscripts only
npm run dev:bookmarklets       # watch mode, bookmarklets only
npm run build                  # lint + clean + production build
npm run lint                   # eslint + prettier check
npm run lint:fix               # eslint + prettier auto-fix
```

No test suite exists. Type-check implicitly via rollup build; `npm run lint` is the CI gate.

## Architecture

Two output types built by `rollup.config.mjs`:

- **Userscripts** (`src/<name>/index.ts` → `dist/<name>.user.js`) — IIFE bundles with Violentmonkey metadata header. SolidJS/VM globals are external (loaded via `@require` CDN). Each script exports a `meta.js` file that provides the userscript header.
- **Bookmarklets** (`src/bookmarklets/**` → `dist/bookmarklets/<name>.js`) — fully inlined, minified, wrapped as `javascript:(async function(){...})();`.

Active userscripts: `snow`, `snow-dashboard`, `fedex-form-filler`, `rove-demo`, `wordle-solver`, `isabisabel-gacha`, `shadow-query-console`. Commented-out entries in `rollup.config.mjs` are disabled.

## Snow Userscript

The main userscript for eBay's ServiceNow (`ebayinc.service-now.com`). Three layers:

### 1. API layer (`src/snow/api.ts`, `src/snow/types.ts`)

Hits ServiceNow JSONv2 (`/<table>.do?JSONv2&displayvalue=all`). Key types:

- `DVOf<T>` — mapped type that generates `dv_<field>` display-value mirrors for all fields in `T`. Use `dv_*` fields for human-readable values in emails/UI; raw fields for sys_ids.
- `WithParsedVars<TRecord, TVars>` — adds `u_variables_parsed` to a record after JSON-parsing the `u_variables` string.
- `TicketData` — discriminated union `{ type: 'sc_task', task, ritm, user, manager, assets }` | `{ type: 'incident', incident, user, manager }`.

`fetchTicketData()` in `src/snow/modules/routing/fetchTicketData.ts` reads the current URL via `getCurrentRecord()` (SolidJS signal) and fetches all related records in sequence.

### 2. Rove workflow engine (`src/snow/modules/routing/`)

Uses the `rove` library (private GitHub package) as a command-palette workflow runner. The tree registered with `init(config)` in `routing/index.tsx` is the top-level menu.

**Building workflows** — use helpers from `routing/workflow.ts`:

```ts
step.action(label, fn)                       // fires fn() on select
step.input(label, inputType, storageKey)     // persists to localStorage
step.kb(label, url)                          // opens URL in new tab
step.branch(label, loadFn, onSelectFn)       // ephemeral pick list
buildSteps([['key', item], ...])             // ALWAYS use array-of-pairs, not object literal
errorNode('message')                         // return (don't throw) when workflow can't run
workflowNode(workflow)                       // wraps Workflow as lazy DirectoryNodeItem
```

Each `Workflow` is `{ label: string; load: () => Promise<DirectoryNode> }`. `load()` is called once on first activation and cached — data fetched inside is captured by closure. If ticket changes without page reload, the cached data is stale.

`storageKey` values for `step.input` must be globally unique across all workflows — prefix with workflow name.

### 3. Email templates (`src/snow/modules/routing/templates/`)

Each template file exports typed functions returning `EmailTemplate` from `src/utils/mailto_utils.ts`. Use `sendEmailFromTemplate()` which opens a `mailto:` link and optionally copies HTML to clipboard.

For Outlook-safe HTML emails, use the `s.*` helpers and `emailBody()` from `mailto_utils.ts`:

```ts
s.p(text)           // paragraph with Calibri 11pt
s.ul([...items])    // bulleted list
s.b(text)           // bold
s.a(url, text)      // hyperlink with Outlook color
emailBody(...parts) // wrapper div
```

`window.open()` after `copyRichTextToClipboard()` will steal focus and silently fail the copy — always copy first, then open.

## Key Utilities

- `src/utils/mailto_utils.ts` — `EmailTemplate`, `sendEmailFromTemplate`, `s.*` HTML helpers, `makeTrackingLink`
- `src/utils/index.ts` — `convertPlainTextToHTMLTable`, `copyRichTextToClipboard`
- `src/snow/modules/snowURLParser.ts` — SolidJS reactive signal tracking current SNOW record from URL; call `initializeUrlTracking()` once at startup

## Adding a New Workflow

1. Create `src/snow/modules/routing/workflows/<name>.ts` exporting a `Workflow`.
2. Create `src/snow/modules/routing/templates/<name>.ts` if email templates are needed.
3. Import and register in `routing/index.tsx` under the appropriate directory key.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current
