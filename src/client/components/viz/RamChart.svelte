<script lang="ts">
  import type { DeviceWithRelations } from '../../../shared/types';

  let { devices = [] }: { devices: DeviceWithRelations[] } = $props();

  interface RamData {
    name: string;
    current: number;
    max: number;
    percent: number;
  }

  function parseRam(str: string): number {
    if (!str) return 0;
    const match = str.match(/^(\d+)\s*(GB|TB|MB)?$/i);
    if (!match) return 0;
    const value = parseInt(match[1], 10);
    const unit = (match[2] || 'GB').toUpperCase();
    if (unit === 'TB') return value * 1024;
    if (unit === 'MB') return value / 1024;
    return value;
  }

  let ramData = $derived(devices
    .filter(d => d.specifications?.ram)
    .map(d => {
      const current = parseRam(d.specifications?.ram?.current || '');
      const max = parseRam(d.specifications?.ram?.max_supported || '');
      return {
        name: d.name,
        current,
        max,
        percent: max > 0 ? (current / max) * 100 : 0,
      };
    })
    .sort((a, b) => a.percent - b.percent));
</script>

<div class="chart">
  {#each ramData as device, i}
    <div class="row" style="animation-delay: {i * 50}ms">
      <div class="label" title={device.name}>
        {device.name.length > 12 ? device.name.slice(0, 12) + '...' : device.name}
      </div>
      <div class="bar-container">
        <div class="bar-bg">
          <div
            class="bar-fill"
            class:full={device.percent >= 100}
            class:expandable={device.percent < 100}
            style="width: {Math.min(device.percent, 100)}%"
          ></div>
        </div>
        <div class="values">
          <span class="current">{device.current}GB</span>
          <span class="sep">/</span>
          <span class="max">{device.max}GB</span>
        </div>
      </div>
    </div>
  {/each}

  {#if ramData.length === 0}
    <div class="empty">NO DATA</div>
  {:else}
    <div class="legend">
      <span class="legend-item">
        <span class="indicator expandable"></span>
        EXPANDABLE
      </span>
      <span class="legend-item">
        <span class="indicator full"></span>
        MAXED
      </span>
    </div>
  {/if}
</div>

<style>
  .chart {
    display: flex;
    flex-direction: column;
    gap: var(--tui-space-3);
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--tui-space-3);
    opacity: 0;
    animation: fadeIn 0.3s var(--ease-out-quad) forwards;
  }

  @keyframes fadeIn {
    to { opacity: 1; }
  }

  .label {
    width: 90px;
    font-family: var(--tui-font-mono);
    font-size: 0.6875rem;
    color: var(--tui-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bar-container {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--tui-space-3);
  }

  .bar-bg {
    flex: 1;
    height: 10px;
    background: var(--tui-panel-deep);
    border-radius: var(--tui-radius-sm);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: var(--tui-radius-sm);
    transition: width var(--duration-slow) var(--ease-out-expo);
  }

  .bar-fill.expandable {
    background: linear-gradient(90deg, rgba(91, 255, 142, 0.2), var(--tui-success));
    box-shadow: 0 0 8px rgba(0, 210, 106, 0.3);
  }

  .bar-fill.full {
    background: var(--tui-text-dim);
  }

  .values {
    display: flex;
    align-items: baseline;
    gap: 2px;
    font-family: var(--tui-font-mono);
    min-width: 85px;
    justify-content: flex-end;
  }

  .current {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--tui-fg);
  }

  .sep {
    font-size: 0.625rem;
    color: var(--tui-text-dim);
  }

  .max {
    font-size: 0.6875rem;
    color: var(--tui-text-dim);
  }

  .legend {
    display: flex;
    gap: var(--tui-space-4);
    margin-top: var(--tui-space-3);
    padding-top: var(--tui-space-3);
    border-top: 1px solid var(--tui-border);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--tui-font-mono);
    font-size: 0.625rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    color: var(--tui-text-dim);
  }

  .indicator {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }

  .indicator.expandable {
    background: var(--tui-success);
  }

  .indicator.full {
    background: var(--tui-text-dim);
  }

  .empty {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    color: var(--tui-text-dim);
    text-align: center;
    padding: var(--tui-space-6);
  }
</style>
