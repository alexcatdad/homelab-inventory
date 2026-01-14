import type { DeviceWithRelations, StatsResponse } from '../../../shared/types';
import { formatBytes } from '../../../shared/types';

export function formatInventoryContext(
  devices: DeviceWithRelations[],
  stats: StatsResponse | null
): string {
  const lines: string[] = [];

  // Summary section
  if (stats) {
    lines.push('## Inventory Summary');
    lines.push(`- Total Devices: ${stats.total_devices}`);
    lines.push(`- Total Storage: ${stats.total_storage_formatted}`);
    lines.push(`- Total RAM (Current): ${stats.total_ram_current}`);
    lines.push(`- Total RAM (Potential): ${stats.total_ram_potential}`);
    lines.push(`- Upgradeable Devices: ${stats.upgradeable_devices}`);

    // Device counts by type
    const typeCounts = Object.entries(stats.devices_by_type)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');
    if (typeCounts) {
      lines.push(`- By Type: ${typeCounts}`);
    }
    lines.push('');
  }

  // Devices section
  lines.push('## Devices');
  lines.push('');

  for (const device of devices) {
    lines.push(`### ${device.name} (${device.type})`);
    lines.push(`Model: ${device.model}`);

    // CPU
    if (device.specifications?.cpu) {
      const cpu = device.specifications.cpu;
      const cpuParts: string[] = [cpu.model];
      if (cpu.cores) cpuParts.push(`${cpu.cores}c/${cpu.threads || cpu.cores}t`);
      if (cpu.tdp_watts) cpuParts.push(`${cpu.tdp_watts}W TDP`);
      lines.push(`- CPU: ${cpuParts.join(', ')}`);
      if (cpu.video_codecs) {
        lines.push(`- HW Transcode: ${cpu.video_codecs}`);
      }
    }

    // RAM
    if (device.specifications?.ram) {
      const ram = device.specifications.ram;
      lines.push(`- RAM: ${ram.current} / ${ram.max_supported} max (${ram.type})`);
      if (ram.slots_used && ram.slots_total) {
        lines.push(`- RAM Slots: ${ram.slots_used}/${ram.slots_total} used`);
      }
    }

    // Motherboard
    if (device.specifications?.motherboard) {
      const mb = device.specifications.motherboard;
      const mbParts: string[] = [mb.model];
      if (mb.chipset) mbParts.push(mb.chipset);
      lines.push(`- Motherboard: ${mbParts.join(', ')}`);

      const storagePorts: string[] = [];
      if (mb.sata_ports) storagePorts.push(`${mb.sata_ports}x SATA`);
      if (mb.nvme_slots) storagePorts.push(`${mb.nvme_slots}x NVMe`);
      if (storagePorts.length > 0) {
        lines.push(`- Storage Ports: ${storagePorts.join(', ')}`);
      }
    }

    // Storage
    if (device.storage && device.storage.length > 0) {
      const totalBytes = device.storage.reduce((sum, s) => sum + (s.capacity_bytes || 0), 0);
      const storageList = device.storage
        .map(s => `${s.type} ${s.capacity}`)
        .join(', ');
      lines.push(`- Storage: ${storageList} (Total: ${formatBytes(totalBytes)})`);
    }

    // GPUs
    if (device.gpus && device.gpus.length > 0) {
      const gpuList = device.gpus
        .map(g => g.vram ? `${g.model} (${g.vram})` : g.model)
        .join(', ');
      lines.push(`- GPUs: ${gpuList}`);
    }

    // PCIe Slots
    if (device.pcie_slots && device.pcie_slots.length > 0) {
      const available = device.pcie_slots.filter(s => s.status === 'Available').length;
      const total = device.pcie_slots.length;
      lines.push(`- PCIe Slots: ${available}/${total} available`);
    }

    // Upgrade Analysis
    if (device.upgrade_analysis) {
      if (device.upgrade_analysis.cpu_max) {
        lines.push(`- CPU Upgrade Path: ${device.upgrade_analysis.cpu_max}`);
      }
      if (device.upgrade_analysis.notes) {
        lines.push(`- Upgrade Notes: ${device.upgrade_analysis.notes}`);
      }
    }

    // Location/Notes
    if (device.location) {
      lines.push(`- Location: ${device.location}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}
