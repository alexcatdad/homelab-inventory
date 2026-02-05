<script lang="ts">
  import type { Device } from '../lib/stores';
  import { selectedDevice } from '../lib/stores';
  import { formatBytes } from '../../shared/types';

  let { device }: { device: Device } = $props();

  const typeClasses: Record<string, string> = {
    Server: 'badge-server',
    Desktop: 'badge-desktop',
    Laptop: 'badge-laptop',
    Component: 'badge-component',
    IoT: 'badge-iot',
    Network: 'badge-network',
  };

  let totalStorage = $derived(device.storage?.reduce((sum, s) => sum + (s.capacity_bytes || 0), 0) || 0);
  let gpuCount = $derived(device.gpus?.length || 0);
  let availableSlots = $derived(device.pcie_slots?.filter(s => s.status === 'Available').length || 0);
  let totalSlots = $derived(device.pcie_slots?.length || 0);
  let isUpgradeable = $derived(device.upgrade_analysis?.cpu_max && device.upgrade_analysis.cpu_max !== 'Not Upgradeable');

  function openDetail() {
    selectedDevice.set(device);
  }
</script>

<button class="device-card" class:upgradeable={isUpgradeable} onclick={openDetail}>
  <!-- Status indicator line -->
  <div class="card-status-line"></div>

  <!-- Header row -->
  <div class="card-header">
    <span class="badge {typeClasses[device.type] || ''}">{device.type}</span>
    {#if isUpgradeable}
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
    <p class="device-model">{device.model}</p>
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
    {#if totalSlots > 0}
      <div class="footer-metric">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="8" width="18" height="8" rx="1"/>
          <path d="M7 8V6M12 8V6M17 8V6"/>
        </svg>
        <span>{availableSlots}/{totalSlots}</span>
      </div>
    {/if}
    {#if device.specifications?.motherboard?.sata_ports}
      <div class="footer-metric">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="4" y="8" width="16" height="8" rx="1"/>
          <path d="M7 11h2M11 11h2M15 11h2"/>
        </svg>
        <span>{device.specifications.motherboard.sata_ports} SATA</span>
      </div>
    {/if}
    {#if device.specifications?.motherboard?.nvme_slots}
      <div class="footer-metric nvme">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="9" width="18" height="6" rx="1"/>
          <path d="M6 12h3M10 12h3M14 12h4"/>
        </svg>
        <span>{device.specifications.motherboard.nvme_slots} NVMe</span>
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

  /* Corner brackets */
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
    border-color: var(--tui-info);
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 168, 255, 0.1);
  }

  .device-card:hover::before,
  .device-card:hover::after {
    border-color: var(--tui-info);
  }

  .device-card.upgradeable {
    border-color: rgba(255, 176, 32, 0.3);
  }

  .device-card.upgradeable::before,
  .device-card.upgradeable::after {
    border-color: rgba(255, 176, 32, 0.5);
  }

  .device-card.upgradeable:hover {
    border-color: var(--signal-amber);
  }

  .device-card.upgradeable:hover::before,
  .device-card.upgradeable:hover::after {
    border-color: var(--signal-amber);
  }

  /* Status indicator line at top */
  .card-status-line {
    height: 2px;
    background: linear-gradient(90deg, var(--tui-info), var(--signal-cyan));
    opacity: 0.6;
    transition: opacity var(--duration-base) var(--ease-out-quad);
  }

  .device-card.upgradeable .card-status-line {
    background: linear-gradient(90deg, var(--signal-amber), var(--signal-amber-dim));
  }

  .device-card:hover .card-status-line {
    opacity: 1;
  }

  /* Header */
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
    color: var(--signal-amber);
    font-family: var(--tui-font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.08em;
  }

  .upgrade-badge svg {
    width: 10px;
    height: 10px;
  }

  /* Identity */
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

  /* Specs grid */
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

  /* Footer */
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

  .footer-metric.nvme {
    color: var(--signal-cyan, #00d4ff);
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
    color: var(--tui-info);
  }

  .device-card.upgradeable:hover .view-indicator {
    color: var(--signal-amber);
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

  /* ═══════════════════════════════════════════════════════════════════════════
     RESPONSIVE STYLES
     ═══════════════════════════════════════════════════════════════════════════ */

  /* Tablet (768px) */
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

  /* Mobile (640px) */
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

    /* Always show view indicator on mobile */
    .view-indicator {
      opacity: 1;
      transform: translateX(0);
      color: var(--tui-info);
    }

    .device-card.upgradeable .view-indicator {
      color: var(--signal-amber);
    }

    .view-indicator span {
      font-size: 0.5625rem;
    }

    .view-indicator svg {
      width: 12px;
      height: 12px;
    }
  }

  /* Small Mobile (480px) */
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

    /* Stack footer metrics into grid on very small screens */
    .footer-metric span {
      font-size: 0.5625rem;
    }

    /* Hide "VIEW" text on small screens, keep arrow */
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

  /* Very small mobile (375px) */
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
