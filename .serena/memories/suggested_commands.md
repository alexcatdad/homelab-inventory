# Suggested Commands

## Development

```bash
# Start both backend and frontend (recommended)
bun run dev

# Start only backend (port 3000)
bun run dev:server

# Start only frontend (port 5173)
bun run dev:client

# Build frontend for production
bun run build

# Start production server
bun run start
```

## Database & Data

```bash
# Import devices from hardware_inventory.yaml into SQLite
bun run import

# Run inventory CLI directly
bun scripts/inventory-cli.ts list
bun scripts/inventory-cli.ts show --name "Device Name"
bun scripts/inventory-cli.ts stats
bun scripts/inventory-cli.ts add --name "Name" --model "Model" --type "Server"
bun scripts/inventory-cli.ts remove --name "Device Name"
```

## Testing

```bash
# Run Playwright e2e tests (starts servers automatically)
bun run test

# Run tests with UI mode
bun run test:ui

# Run specific test file
bunx playwright test tests/app.spec.ts

# Run unit tests (if any exist)
bun test
```

## Package Management

```bash
# Install dependencies
bun install

# Add new dependency
bun add <package>

# Add dev dependency
bun add -d <package>
```

## Debugging

```bash
# Check API health
curl http://localhost:3000/health

# List devices via API
curl http://localhost:3000/api/devices

# Get stats
curl http://localhost:3000/api/stats
```

## System Commands (macOS/Darwin)

```bash
# Find processes using a port
lsof -i:3000
lsof -i:5173

# Kill process on port
lsof -ti:3000 | xargs kill -9

# Network discovery (for /inventory discover)
arp -a
```

## Claude Code Skill

Use `/inventory` in Claude Code for:
- `/inventory list` - List all devices
- `/inventory show <name>` - Show device details
- `/inventory add <description>` - Add device with AI enrichment
- `/inventory update <name> <field>=<value>` - Update device
- `/inventory remove <name>` - Delete device
- `/inventory discover` - Scan local network
