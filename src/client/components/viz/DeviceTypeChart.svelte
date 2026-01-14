<script lang="ts">
  import type { StatsResponse } from '../../../shared/types';

  let { stats = null }: { stats: StatsResponse | null } = $props();

  const typeColors: Record<string, string> = {
    Server: 'var(--type-server)',
    Desktop: 'var(--type-desktop)',
    Laptop: 'var(--type-laptop)',
    Component: 'var(--type-component)',
    IoT: 'var(--type-iot)',
    Network: 'var(--type-network)',
  };

  let typeEntries = $derived(stats ? Object.entries(stats.devices_by_type) : []);
  let total = $derived(stats?.total_devices || 0);
</script>

<div class="chart">
  {#each typeEntries as [type, count], i}
    <div class="row" style="animation-delay: {i * 50}ms">
      <div class="type-info">
        <span class="type-indicator" style="background: {typeColors[type] || 'var(--text-muted)'}"></span>
        <span class="type-name">{type}</span>
      </div>
      <div class="bar-container">
        <div
          class="bar"
          style="width: {total > 0 ? (count / total) * 100 : 0}%; background: {typeColors[type] || 'var(--text-muted)'}"
        ></div>
      </div>
      <span class="count">{count}</span>
    </div>
  {/each}

  {#if typeEntries.length === 0}
    <div class="empty">NO DATA</div>
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

  .type-info {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100px;
  }

  .type-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    animation: pulse-dot 2s ease-in-out infinite;
  }

  .type-name {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-secondary);
    letter-spacing: 0.02em;
  }

  .bar-container {
    flex: 1;
    height: 20px;
    background: var(--panel-deep);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .bar {
    height: 100%;
    border-radius: var(--radius-sm);
    transition: width var(--duration-slow) var(--ease-out-expo);
    opacity: 0.75;
  }

  .bar:hover {
    opacity: 1;
  }

  .count {
    font-family: var(--font-mono);
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-bright);
    min-width: 28px;
    text-align: right;
  }

  .empty {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    color: var(--text-dim);
    text-align: center;
    padding: var(--space-6);
  }
</style>
