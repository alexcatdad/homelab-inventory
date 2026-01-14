<script lang="ts">
  import type { DeviceWithRelations } from '../../../shared/types';

  let { devices = [] }: { devices: DeviceWithRelations[] } = $props();

  interface StorageData {
    name: string;
    nvme: number;
    ssd: number;
    hdd: number;
    raid: number;
    total: number;
  }

  let storageData = $derived(devices
    .filter(d => d.storage && d.storage.length > 0)
    .map(d => {
      const data: StorageData = { name: d.name, nvme: 0, ssd: 0, hdd: 0, raid: 0, total: 0 };
      for (const s of d.storage || []) {
        const bytes = s.capacity_bytes || 0;
        const type = s.type.toLowerCase();
        if (type.includes('nvme')) data.nvme += bytes;
        else if (type.includes('raid')) data.raid += bytes;
        else if (type.includes('ssd')) data.ssd += bytes;
        else if (type.includes('hdd')) data.hdd += bytes;
        data.total += bytes;
      }
      return data;
    })
    .sort((a, b) => b.total - a.total));

  let maxTotal = $derived(Math.max(...storageData.map(d => d.total), 1));

  function formatSize(bytes: number): string {
    if (bytes === 0) return '0';
    const tb = bytes / (1024 ** 4);
    if (tb >= 1) return `${tb.toFixed(1)}TB`;
    const gb = bytes / (1024 ** 3);
    return `${gb.toFixed(0)}GB`;
  }
</script>

<div class="chart">
  {#each storageData as device, i}
    <div class="row" style="animation-delay: {i * 50}ms">
      <div class="label" title={device.name}>
        {device.name.length > 12 ? device.name.slice(0, 12) + '...' : device.name}
      </div>
      <div class="bar-container">
        <div class="bar-stack" style="width: {(device.total / maxTotal) * 100}%">
          {#if device.nvme > 0}
            <div
              class="segment nvme"
              style="width: {(device.nvme / device.total) * 100}%"
              title="NVMe: {formatSize(device.nvme)}"
            ></div>
          {/if}
          {#if device.ssd > 0}
            <div
              class="segment ssd"
              style="width: {(device.ssd / device.total) * 100}%"
              title="SSD: {formatSize(device.ssd)}"
            ></div>
          {/if}
          {#if device.raid > 0}
            <div
              class="segment raid"
              style="width: {(device.raid / device.total) * 100}%"
              title="RAID: {formatSize(device.raid)}"
            ></div>
          {/if}
          {#if device.hdd > 0}
            <div
              class="segment hdd"
              style="width: {(device.hdd / device.total) * 100}%"
              title="HDD: {formatSize(device.hdd)}"
            ></div>
          {/if}
        </div>
        <span class="value">{formatSize(device.total)}</span>
      </div>
    </div>
  {/each}

  {#if storageData.length === 0}
    <div class="empty">NO DATA</div>
  {:else}
    <div class="legend">
      <span class="legend-item"><span class="dot nvme"></span>NVMe</span>
      <span class="legend-item"><span class="dot ssd"></span>SSD</span>
      <span class="legend-item"><span class="dot raid"></span>RAID</span>
      <span class="legend-item"><span class="dot hdd"></span>HDD</span>
    </div>
  {/if}
</div>

<style>
  .chart {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    opacity: 0;
    animation: fadeIn 0.3s var(--ease-out-quad) forwards;
  }

  @keyframes fadeIn {
    to { opacity: 1; }
  }

  .label {
    width: 90px;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bar-container {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .bar-stack {
    display: flex;
    height: 20px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    min-width: 8px;
    transition: width var(--duration-slow) var(--ease-out-expo);
    background: var(--panel-deep);
  }

  .segment {
    height: 100%;
    transition: width var(--duration-slow) var(--ease-out-expo);
  }

  .segment.nvme { background: linear-gradient(180deg, #4a9eff, var(--storage-nvme)); }
  .segment.ssd { background: linear-gradient(180deg, #34d399, var(--storage-ssd)); }
  .segment.raid { background: linear-gradient(180deg, #c084fc, var(--storage-raid)); }
  .segment.hdd { background: linear-gradient(180deg, #94a3b8, var(--storage-hdd)); }

  .value {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--signal-cyan);
    min-width: 50px;
    text-align: right;
  }

  .legend {
    display: flex;
    gap: var(--space-4);
    margin-top: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px solid var(--border-dim);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-mono);
    font-size: 0.625rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    color: var(--text-dim);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }

  .dot.nvme { background: var(--storage-nvme); }
  .dot.ssd { background: var(--storage-ssd); }
  .dot.raid { background: var(--storage-raid); }
  .dot.hdd { background: var(--storage-hdd); }

  .empty {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    color: var(--text-dim);
    text-align: center;
    padding: var(--space-6);
  }
</style>
