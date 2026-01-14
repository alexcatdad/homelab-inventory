# Code Style & Conventions

## General

- **Language**: TypeScript throughout
- **Runtime**: Bun (NOT Node.js)
- **Module System**: ES Modules (`"type": "module"`)

## TypeScript

- Use explicit types for function parameters and returns
- Use interfaces over type aliases for object shapes
- Export types from `src/shared/types.ts` for shared use
- Avoid `any` - use `unknown` if type is truly unknown

## Naming Conventions

- **Files**: kebab-case (`device-card.svelte`, `inventory-cli.ts`)
- **Components**: PascalCase (`DeviceCard.svelte`)
- **Functions**: camelCase (`getDeviceById`, `loadData`)
- **Types/Interfaces**: PascalCase (`DeviceWithRelations`, `StatsResponse`)
- **Constants**: SCREAMING_SNAKE_CASE or camelCase
- **CSS Variables**: kebab-case (`--bg-primary`, `--accent-cyan`)

## Svelte 5 Specifics

- Use native Svelte 5 runes (NOT compatibility mode)
- Component instantiation: `mount(App, { target: ... })` from `svelte`
- State: `let value = $state(initialValue)`
- Effects/lifecycle: `$effect(() => { ... })` - replaces `onMount`
- Store subscriptions: use `$effect` to subscribe and return cleanup
- Event handlers: `onclick` (not `on:click`)
- Derived values: `let derived = $derived(expression)`

Example pattern for stores:
```svelte
let isLoading = $state(true);
$effect(() => {
  const unsub = loading.subscribe(v => isLoading = v);
  return () => unsub();
});
```

## CSS

- Custom design system in `src/client/styles/global.css`
- CSS variables for all colors, spacing, typography
- Dark theme (cyberpunk aesthetic)
- Component-scoped styles via `<style>` blocks
- No Tailwind utility classes in components (custom CSS only)

## Database

- Use `bun:sqlite` (NOT better-sqlite3)
- Schema defined in `src/server/db/schema.ts`
- Queries in `src/server/db/queries.ts`
- SQLite file at `data/inventory.db`

## API

- Use Hono framework
- RESTful endpoints under `/api/`
- Return JSON responses
- Use proper HTTP status codes

## Bun-Specific

- Use `Bun.file()` over `fs.readFile()`
- Use `bun:sqlite` for SQLite
- No `dotenv` - Bun loads `.env` automatically
- Use `bun test` for testing
