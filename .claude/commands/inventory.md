---
description: Manage homelab hardware inventory - add devices with AI spec enrichment, list, search, update
argument-hint: <add|list|show|update|remove|enrich|discover> [args]
allowed-tools: Bash, Read, Write, WebSearch, WebFetch
---

# Home Lab Inventory Management

Manage the hardware inventory stored in SQLite at `data/inventory.db`.

**Database path**: `/Users/alex/Projects/home-inventory/data/inventory.db`

## Commands

Parse the argument `$ARGUMENTS` to determine which subcommand to run:

### `add <device description>`
Add a new device with AI-powered spec enrichment:

1. Parse the device description (e.g., "Synology DS923+" or "AMD Ryzen 9 5900X CPU")
2. **Use WebSearch** to find detailed specifications:
   - Search: `"<device name> specifications"`
   - Extract: CPU, cores, threads, RAM max, storage bays, PCIe slots, TDP, dimensions
3. Determine device type: Server, Desktop, Laptop, Component, IoT, or Network
4. Insert into database using Bun script:
   ```bash
   bun /Users/alex/Projects/home-inventory/scripts/inventory-cli.ts add \
     --name "<friendly name>" \
     --model "<manufacturer model>" \
     --type "<device type>" \
     --specs '<JSON specs>'
   ```
5. Report what was added with the enriched specs

### `list [filter]`
List all devices, optionally filtered:

```bash
bun /Users/alex/Projects/home-inventory/scripts/inventory-cli.ts list [--type Server|Desktop|etc] [--search "query"]
```

Format output as a nice table showing: Name, Type, CPU, RAM, Storage summary.

### `show <name>`
Show detailed info for a device:

```bash
bun /Users/alex/Projects/home-inventory/scripts/inventory-cli.ts show --name "<device name>"
```

Display all specs, storage drives, GPUs, PCIe slots, and upgrade analysis.

### `update <name> <field>=<value>`
Update a device field:

```bash
bun /Users/alex/Projects/home-inventory/scripts/inventory-cli.ts update --name "<name>" --field "<field>" --value "<value>"
```

Supported fields: `name`, `model`, `type`, `location`, `notes`, `ram.current`, `cpu.model`, etc.

### `remove <name>`
Remove a device from inventory:

```bash
bun /Users/alex/Projects/home-inventory/scripts/inventory-cli.ts remove --name "<device name>"
```

Confirm before deleting.

### `enrich <name>`
Re-run AI spec lookup for an existing device:

1. Get current device info
2. **Use WebSearch** to find updated/additional specs
3. Update the device with enriched data
4. Report what was added/changed

### `discover`
Scan the local network for devices:

1. Run: `arp -a` to get local network devices
2. For each discovered device:
   - Check if MAC/hostname matches existing inventory
   - If new: Ask user if they want to add it
   - If known: Update last_seen and IP address
3. Report findings

## Spec Enrichment Guidelines

When searching for device specs, extract and structure:

**For Computers/Servers:**
- CPU: model, cores, threads, socket, TDP
- RAM: max supported, type (DDR4/DDR5), slots
- Storage: bays, max capacity, supported types
- Expansion: PCIe slots (generation, lanes)
- Networking: ethernet ports, speeds

**For Components (CPU, GPU, motherboard):**
- Full model name and SKU
- Key specifications
- Compatibility info (socket, chipset)
- TDP/power requirements

**For NAS/Storage:**
- Drive bays and supported sizes
- RAID capabilities
- CPU and RAM specs
- Network connectivity

## Output Format

Always provide clear, formatted output:
- Use tables for lists
- Use bullet points for detailed specs
- Confirm actions with the user
- Show what was changed/added
