# Parts & Assembly System Implementation Plan

## Overview
Add trackable hardware parts (CPU, RAM, GPU, Storage, Motherboard) that can be assembled into devices or kept as standalone inventory. Parts track full history of which systems they've been in.

## Requirements Summary
- **Part types:** CPU, RAM, GPU, Storage, Motherboard (major components only)
- **Identity:** Auto-generated IDs (CPU-001, RAM-042, etc.)
- **Assembly:** Pick from available parts to install in Server/Desktop/Laptop
- **Disassembly:** Deletes device, releases all parts to inventory
- **History:** Full timeline of install/remove events with dates
- **Specs vs Parts:** Separate concepts - specs describe capabilities, parts are physical items

---

## 1. Database Schema (`src/server/db/schema.ts`)

### New Tables

```sql
-- Parts inventory
CREATE TABLE parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id TEXT NOT NULL UNIQUE,           -- "CPU-001", "RAM-042"
  part_type TEXT NOT NULL CHECK(part_type IN ('CPU', 'RAM', 'GPU', 'Storage', 'Motherboard')),
  manufacturer TEXT,
  model TEXT NOT NULL,
  serial_number TEXT,
  device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
  specs_json TEXT,                        -- Type-specific attributes as JSON
  acquired_date TEXT,
  purchase_price REAL,
  location TEXT,
  condition TEXT DEFAULT 'Good' CHECK(condition IN ('New', 'Excellent', 'Good', 'Fair', 'Poor')),
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- History tracking
CREATE TABLE part_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  device_id INTEGER NOT NULL,
  device_name TEXT NOT NULL,              -- Snapshot (survives device deletion)
  device_model TEXT,
  event_type TEXT NOT NULL CHECK(event_type IN ('installed', 'removed')),
  event_date TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Auto-ID generation
CREATE TABLE part_id_sequences (
  part_type TEXT PRIMARY KEY,
  next_id INTEGER DEFAULT 1
);
```

---

## 2. TypeScript Types (`src/shared/types.ts`)

```typescript
export type PartType = 'CPU' | 'RAM' | 'GPU' | 'Storage' | 'Motherboard';
export type PartCondition = 'New' | 'Excellent' | 'Good' | 'Fair' | 'Poor';

export interface Part {
  id?: number;
  part_id: string;
  part_type: PartType;
  manufacturer?: string;
  model: string;
  serial_number?: string;
  device_id?: number | null;
  specs?: Record<string, unknown>;
  acquired_date?: string;
  purchase_price?: number;
  location?: string;
  condition?: PartCondition;
  notes?: string;
}

export interface PartHistoryEvent {
  id?: number;
  part_id: number;
  device_id: number;
  device_name: string;
  device_model?: string;
  event_type: 'installed' | 'removed';
  event_date: string;
  notes?: string;
}

export interface PartWithHistory extends Part {
  device?: { id: number; name: string; type: DeviceType } | null;
  history: PartHistoryEvent[];
}
```

---

## 3. API Endpoints

### Parts CRUD (`src/server/routes/parts.ts`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parts` | List parts (filter: type, status, device_id, q) |
| GET | `/api/parts/available` | Parts not installed (for assembly picker) |
| GET | `/api/parts/:id` | Part detail with history |
| POST | `/api/parts` | Create part (auto-generates part_id) |
| PATCH | `/api/parts/:id` | Update part |
| DELETE | `/api/parts/:id` | Delete part |

### Assembly Operations (add to device routes)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/devices/:id/parts` | Get installed parts |
| POST | `/api/devices/:id/parts` | Install parts (body: { part_ids: number[] }) |
| DELETE | `/api/devices/:id/parts/:partId` | Remove single part |
| POST | `/api/devices/:id/disassemble` | Delete device, release all parts |

---

## 4. UI Components

### New Files
```
src/client/components/parts/
  PartsView.svelte          -- Grid view with filters
  PartCard.svelte           -- Card showing part_id, type, model, status
  PartDetail.svelte         -- Slide-out panel with specs + history timeline
  PartForm.svelte           -- Create/edit form with dynamic specs fields
  AssemblyPanel.svelte      -- Part picker for device assembly
  DisassembleConfirm.svelte -- Warning modal (device will be deleted)

src/client/lib/
  partsApi.ts               -- API client functions
  partsStores.ts            -- Svelte stores for parts state
```

### Component Details

**PartCard:** Type-colored badge, part_id, model, status ("In: [Device]" or "Inventory")

**PartDetail:** Specs section, current device, history timeline with install/remove events

**AssemblyPanel:** Triggered from DeviceDetail, shows available parts filtered by type, checkboxes to select, "Install" button

**DisassembleConfirm:** Warning that device is deleted, lists parts released, requires typing device name to confirm

### Existing File Changes

- **Header.svelte:** Add "Parts" nav item
- **DeviceDetail.svelte:** Add "Installed Parts" section, "Assemble" button, "Disassemble" button
- **App.svelte:** Add PartsView route, mount part modals

---

## 5. Implementation Order

### Phase 1: Schema & Types
1. Add tables to `schema.ts`
2. Add types to `types.ts`

### Phase 2: Backend
1. Create `src/server/db/partQueries.ts`
2. Create `src/server/routes/parts.ts`
3. Register routes in `index.ts`

### Phase 3: Frontend Foundation
1. Create `partsApi.ts`
2. Create `partsStores.ts`
3. Create PartCard, PartsView
4. Add to navigation

### Phase 4: Detail & Forms
1. Create PartDetail
2. Create PartForm
3. Add parts section to DeviceDetail

### Phase 5: Assembly
1. Create AssemblyPanel
2. Create DisassembleConfirm
3. Wire up assembly/disassembly flows

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/server/db/schema.ts` | Add 3 new tables |
| `src/shared/types.ts` | Add Part types |
| `src/server/index.ts` | Register /api/parts routes |
| `src/client/components/Header.svelte` | Add Parts nav |
| `src/client/components/DeviceDetail.svelte` | Add installed parts, buttons |
| `src/client/App.svelte` | Add Parts view route |

## Key Design Notes

- **Part ID generation:** Sequence table ensures unique IDs like "CPU-001"
- **History survives deletion:** device_name/model snapshots in part_history
- **Disassembly:** Device record deleted, parts get `device_id = NULL`
- **Specs storage:** JSON column for flexibility per part type
- **Existing GPUs/storage tables:** Keep parallel (don't migrate yet)
