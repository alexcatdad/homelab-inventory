# Home Lab Inventory - Project Overview

## Purpose
A homelab hardware inventory management system that allows tracking and visualizing hardware devices, specifications, storage, and upgrade potential. The web interface is read-only for visualization; CRUD operations are performed via a Claude Code skill (`/inventory`).

## Tech Stack
- **Runtime**: Bun (not Node.js)
- **Backend**: Hono web framework on port 3000
- **Database**: bun:sqlite (native SQLite)
- **Frontend**: Svelte 5 with Vite on port 5173
- **Styling**: Custom CSS design system (dark cyberpunk theme)
- **Language**: TypeScript throughout

## Architecture

```
src/
├── server/           # Hono API server
│   ├── db/          # SQLite schema and queries
│   │   ├── schema.ts    # Database initialization
│   │   └── queries.ts   # All DB operations
│   ├── routes/      # (empty - routes in index.ts)
│   ├── services/    # (empty - business logic)
│   └── index.ts     # Main server entry point
├── client/          # Svelte frontend
│   ├── components/  # UI components
│   │   ├── viz/     # Visualization charts
│   │   ├── Dashboard.svelte
│   │   ├── DeviceGrid.svelte
│   │   ├── DeviceCard.svelte
│   │   ├── DeviceDetail.svelte
│   │   └── Header.svelte
│   ├── lib/         # Stores and API client
│   │   ├── stores.ts
│   │   └── api.ts
│   ├── styles/
│   │   └── global.css
│   ├── index.html
│   ├── main.ts
│   └── App.svelte
├── shared/          # Shared types between server/client
│   └── types.ts
└── skill/           # Claude Code skill handlers (planned)

scripts/
├── inventory-cli.ts # CLI for inventory management
└── import-yaml.ts   # Import from hardware_inventory.yaml

.claude/commands/
└── inventory.md     # /inventory skill definition

data/
└── inventory.db     # SQLite database (gitignored)
```

## API Endpoints
- `GET /health` - Health check
- `GET /api/devices` - List all devices (with relations)
- `GET /api/devices/:id` - Get single device
- `GET /api/stats` - Dashboard statistics
- `GET /api/topology` - Network topology data

## Key Data Types
- `DeviceType`: Server, Desktop, Laptop, Component, IoT, Network
- `DeviceWithRelations`: Device with GPUs, storage, PCIe slots loaded
- `StatsResponse`: Aggregated stats for dashboard

## Features
- Dashboard with summary cards and charts
- Device list with type filtering and search
- Device detail panel (slide-out)
- Storage chart (stacked horizontal bars by type)
- RAM utilization chart (current vs max)
- Device type distribution chart
