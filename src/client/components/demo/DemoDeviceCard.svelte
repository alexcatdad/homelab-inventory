<!-- Demo Device Card - displays demo device data, opens demo detail -->
<script lang="ts">
  import type { DemoDevice } from '../../lib/demoData';
  import { selectedDevice } from '../../lib/stores';

  let { device }: { device: DemoDevice } = $props();

  const typeClasses: Record<string, string> = {
    Server: 'badge-server',
    Desktop: 'badge-desktop',
    Laptop: 'badge-laptop',
    Component: 'badge-component',
    IoT: 'badge-iot',
    Network: 'badge-network',
  };

  // Calculate total storage from demo data format
  function calculateStorageBytes(storage?: Array<{ capacity: string }>): number {
    if (!storage) return 0;
    return storage.reduce((sum, s) => {
      const match = s.capacity.match(/(\d+)(TB|GB|MB)/i);
      if (!match) return sum;
      const value = parseInt(match[1]);
      const unit = match[2].toUpperCase();
      if (unit === 'TB') return sum + value * 1024 * 1024 * 1024 * 1024;
      if (unit === 'GB') return sum + value * 1024 * 1024 * 1024;
      if (unit === 'MB') return sum + value * 1024 * 1024;
      return sum;
    }, 0);
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
  }

  let totalStorage = $derived(calculateStorageBytes(device.storage));
  let gpuCount = $derived(device.gpus?.length || 0);
  let isUpgradeable = $derived(() => {
    const ram = device.specifications?.ram;
    if (!ram) return false;
    const current = parseInt(ram.current) || 0;
    const max = parseInt(ram.max_supported) || current;
    return max > current;
  });

  function openDetail() {
    // Store the demo device as selected (for detail view)
    selectedDevice.set(device as any);
  }
</script>

<button class="device-card" class:upgradeable={isUpgradeable()} onclick={openDetail}>
  <!-- Status indicator line -->
  <div class="card-status-line"></div>

  <!-- Header row -->
  <div class="card-header">
    <span class="badge {typeClasses[device.type] || ''}">{device.type}</span>
    {#if isUpgradeable()}
      <span class="upgrade-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
        UPG
      </span>
    {/if}
  </div>

  <!-- Device identity -->
  <div class="card-identity">
    <h3 class="device-name">{device.name}</h3>
    <p class="device-model">{device.model || 'Unknown'}</p>
  </div>

  <!-- Specs grid -->
  <div class="specs-grid">
    {#if device.specifications?.cpu}
      <div class="spec-item">
        <span class="spec-label">CPU</span>
        <span class="spec-value">{device.specifications.cpu.model}</span>
      </div>
    {/if}

    {#if device.specifications?.ram}
      <div class="spec-item">
        <span class="spec-label">RAM</span>
        <div class="spec-value-group">
          <span class="spec-value">{device.specifications.ram.current}</span>
          <span class="spec-max">/ {device.specifications.ram.max_supported}</span>
        </div>
      </div>
    {/if}

    {#if totalStorage > 0}
      <div class="spec-item">
        <span class="spec-label">STORAGE</span>
        <span class="spec-value">{formatBytes(totalStorage)}</span>
      </div>
    {/if}

    {#if device.network_info?.ip_address}
      <div class="spec-item">
        <span class="spec-label">IP</span>
        <span class="spec-value">{device.network_info.ip_address}</span>
      </div>
    {/if}
  </div>

  <!-- Footer metrics -->
  <div class="card-footer">
    {#if gpuCount > 0}
      <div class="footer-metric">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="6" width="20" height="12" rx="2"/>
          <path d="M6 10v4M10 10v4M14 10v4M18 10v4"/>
        </svg>
        <span>{gpuCount} GPU</span>
      </div>
    {/if}
    {#if device.storage && device.storage.length > 0}
      <div class="footer-metric">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="4" y="4" width="16" height="6" rx="1"/>
          <rect x="4" y="14" width="16" height="6" rx="1"/>
        </svg>
        <span>{device.storage.length} drives</span>
      </div>
    {/if}
    {#if device.location}
      <div class="footer-metric location">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span>{device.location}</span>
      </div>
    {/if}

    <div class="view-indicator">
      <span>VIEW</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </div>
  </div>
</button>

<style>
  .device-card {
    background: var(--tui-panel);
    border: 1px solid var(--tui-border);
    border-radius: var(--tui-radius-lg);
    padding: 0;
    text-align: left;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    transition: all var(--duration-base) var(--ease-out-quad);
  }

  .device-card::before,
  .device-card::after {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    border-color: var(--border-technical);
    border-style: solid;
    pointer-events: none;
    transition: border-color var(--duration-base) var(--ease-out-quad);
    z-index: 2;
  }

  .device-card::before {
    top: -1px;
    left: -1px;
    border-width: 2px 0 0 2px;
  }

  .device-card::after {
    bottom: -1px;
    right: -1px;
    border-width: 0 2px 2px 0;
  }

  .device-card:hover {
    border-color: var(--tui-warning);
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 176, 32, 0.1);
  }

  .device-card:hover::before,
  .device-card:hover::after {
    border-color: var(--tui-warning);
  }

  .device-card.upgradeable {
    border-color: rgba(255, 176, 32, 0.3);
  }

  .device-card.upgradeable::before,
  .device-card.upgradeable::after {
    border-color: rgba(255, 176, 32, 0.5);
  }

  .card-status-line {
    height: 2px;
    background: linear-gradient(90deg, var(--tui-warning), rgba(255, 176, 32, 0.4));
    opacity: 0.6;
    transition: opacity var(--duration-base) var(--ease-out-quad);
  }

  .device-card:hover .card-status-line {
    opacity: 1;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--tui-space-4) var(--tui-space-4) 0;
  }

  .upgrade-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    background: rgba(255, 176, 32, 0.15);
    border: 1px solid rgba(255, 176, 32, 0.3);
    border-radius: var(--tui-radius-sm);
    color: var(--tui-warning);
    font-family: var(--tui-font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.08em;
  }

  .upgrade-badge svg {
    width: 10px;
    height: 10px;
  }

  .card-identity {
    padding: var(--tui-space-3) var(--tui-space-4);
  }

  .device-name {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
    color: var(--tui-text-bright);
    margin: 0;
    line-height: 1.3;
  }

  .device-model {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    color: var(--tui-text-muted);
    margin: var(--tui-space-1) 0 0;
    line-height: 1.3;
  }

  .specs-grid {
    padding: var(--tui-space-3) var(--tui-space-4);
    display: flex;
    flex-direction: column;
    gap: var(--tui-space-2);
    border-top: 1px solid var(--tui-border);
    border-bottom: 1px solid var(--tui-border);
    background: var(--tui-panel-deep);
  }

  .spec-item {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--tui-space-3);
  }

  .spec-label {
    font-family: var(--tui-font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--tui-text-dim);
    flex-shrink: 0;
  }

  .spec-value {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    color: var(--tui-text-muted);
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .spec-value-group {
    display: flex;
    align-items: baseline;
    gap: 2px;
  }

  .spec-max {
    font-family: var(--tui-font-mono);
    font-size: 0.625rem;
    color: var(--tui-text-dim);
  }

  .card-footer {
    display: flex;
    align-items: center;
    gap: var(--tui-space-4);
    padding: var(--tui-space-3) var(--tui-space-4);
  }

  .footer-metric {
    display: flex;
    align-items: center;
    gap: var(--tui-space-1);
    color: var(--tui-text-muted);
  }

  .footer-metric svg {
    width: 14px;
    height: 14px;
    opacity: 0.6;
  }

  .footer-metric span {
    font-family: var(--tui-font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.02em;
  }

  .footer-metric.location {
    color: var(--tui-cyan);
  }

  .view-indicator {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: var(--tui-space-1);
    color: var(--tui-text-dim);
    opacity: 0;
    transform: translateX(-8px);
    transition: all var(--duration-base) var(--ease-out-quad);
  }

  .device-card:hover .view-indicator {
    opacity: 1;
    transform: translateX(0);
    color: var(--tui-warning);
  }

  .view-indicator span {
    font-family: var(--tui-font-mono);
    font-size: 0.625rem;
    font-weight: 500;
    letter-spacing: 0.1em;
  }

  .view-indicator svg {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 768px) {
    .card-header {
      padding: var(--tui-space-3) var(--tui-space-3) 0;
    }

    .card-identity {
      padding: var(--tui-space-2) var(--tui-space-3);
    }

    .specs-grid {
      padding: var(--tui-space-2) var(--tui-space-3);
    }

    .card-footer {
      padding: var(--tui-space-2) var(--tui-space-3);
      gap: var(--tui-space-3);
      flex-wrap: wrap;
    }

    .view-indicator {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (max-width: 640px) {
    .device-card::before,
    .device-card::after {
      width: 10px;
      height: 10px;
    }

    .device-name {
      font-size: 0.9375rem;
    }

    .device-model {
      font-size: 0.6875rem;
    }

    .card-footer {
      gap: var(--tui-space-2);
      flex-wrap: wrap;
    }

    .footer-metric {
      gap: 2px;
    }

    .footer-metric svg {
      width: 12px;
      height: 12px;
    }

    .footer-metric span {
      font-size: 0.625rem;
    }

    .view-indicator {
      opacity: 1;
      transform: translateX(0);
      color: var(--tui-warning);
    }

    .view-indicator span {
      font-size: 0.5625rem;
    }

    .view-indicator svg {
      width: 12px;
      height: 12px;
    }
  }

  @media (max-width: 480px) {
    .card-header {
      padding: var(--tui-space-2) var(--tui-space-2) 0;
    }

    .card-identity {
      padding: var(--tui-space-2);
    }

    .device-name {
      font-size: 0.875rem;
    }

    .specs-grid {
      padding: var(--tui-space-2);
      gap: var(--tui-space-1);
    }

    .spec-label {
      font-size: 0.5rem;
    }

    .spec-value {
      font-size: 0.6875rem;
    }

    .card-footer {
      padding: var(--tui-space-2);
      gap: var(--tui-space-2);
    }

    .footer-metric span {
      font-size: 0.5625rem;
    }

    .view-indicator span {
      display: none;
    }

    .upgrade-badge {
      font-size: 0.5rem;
      padding: 2px 4px;
    }

    .upgrade-badge svg {
      width: 8px;
      height: 8px;
    }
  }

  @media (max-width: 375px) {
    .device-card::before,
    .device-card::after {
      display: none;
    }

    .card-footer {
      flex-wrap: wrap;
      justify-content: flex-start;
    }

    .view-indicator {
      width: 100%;
      justify-content: flex-end;
      margin-top: var(--tui-space-1);
      padding-top: var(--tui-space-1);
      border-top: 1px solid var(--tui-border);
    }

    .view-indicator span {
      display: inline;
    }
  }
</style>
