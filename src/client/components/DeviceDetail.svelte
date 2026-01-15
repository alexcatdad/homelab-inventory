<script lang="ts">
  import { selectedDevice, openEditForm, openDeleteConfirm, type Device } from '../lib/stores';
  import { formatBytes } from '../../shared/types';

  let device: Device | null = $state(null);

  $effect(() => {
    const unsub = selectedDevice.subscribe(v => device = v);
    return unsub;
  });

  function close() {
    selectedDevice.set(null);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  function handleOverlayClick() {
    close();
  }

  let totalStorage = $derived(device?.storage?.reduce((sum, s) => sum + (s.capacity_bytes || 0), 0) || 0);
  let ramCurrent = $derived(parseInt(device?.specifications?.ram?.current || '0') || 0);
  let ramMax = $derived(parseInt(device?.specifications?.ram?.max_supported || '1') || 1);
  let ramPercent = $derived(Math.round((ramCurrent / ramMax) * 100));
</script>

<svelte:window onkeydown={handleKeydown} />

{#if device}
  <div class="overlay" onclick={handleOverlayClick} role="button" tabindex="-1" onkeydown={(e) => e.key === 'Enter' && handleOverlayClick()}>
    <div class="detail-panel" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1" onkeydown={(e) => e.stopPropagation()}>

      <!-- Header -->
      <div class="panel-header">
        <div class="header-top">
          <span class="badge badge-{device.type.toLowerCase()}">{device.type}</span>
          <div class="header-actions">
            <button class="action-btn edit-btn" onclick={() => { const d = device; close(); openEditForm(d!); }} title="Edit device">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="action-btn delete-btn" onclick={() => { const d = device; close(); openDeleteConfirm(d!); }} title="Delete device">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
            <button class="close-btn" onclick={close}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="header-info">
          <h2>{device.name}</h2>
          <p class="model">{device.model}</p>
        </div>
        <div class="header-accent"></div>
      </div>

      <!-- Content -->
      <div class="panel-content">

        <!-- CPU Section -->
        {#if device.specifications?.cpu}
          <section class="spec-section">
            <div class="section-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="4" y="4" width="16" height="16" rx="2"/>
                <rect x="9" y="9" width="6" height="6"/>
                <path d="M4 9h2M4 15h2M18 9h2M18 15h2M9 4v2M15 4v2M9 18v2M15 18v2"/>
              </svg>
              <span>PROCESSOR</span>
            </div>
            <div class="spec-grid">
              <div class="spec-item full">
                <span class="spec-label">MODEL</span>
                <span class="spec-value">{device.specifications.cpu.model}</span>
              </div>
              {#if device.specifications.cpu.cores}
                <div class="spec-item">
                  <span class="spec-label">CORES</span>
                  <span class="spec-value data">{device.specifications.cpu.cores}</span>
                </div>
              {/if}
              {#if device.specifications.cpu.threads}
                <div class="spec-item">
                  <span class="spec-label">THREADS</span>
                  <span class="spec-value data">{device.specifications.cpu.threads}</span>
                </div>
              {/if}
              {#if device.specifications.cpu.tdp_watts}
                <div class="spec-item">
                  <span class="spec-label">TDP</span>
                  <span class="spec-value data">{device.specifications.cpu.tdp_watts}W</span>
                </div>
              {/if}
              {#if device.specifications.cpu.video_codecs}
                <div class="spec-item full">
                  <span class="spec-label">HW TRANSCODE</span>
                  <span class="spec-value codec">{device.specifications.cpu.video_codecs}</span>
                </div>
              {/if}
            </div>
          </section>
        {/if}

        <!-- RAM Section -->
        {#if device.specifications?.ram}
          <section class="spec-section">
            <div class="section-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="6" width="18" height="12" rx="1"/>
                <path d="M7 6V4M12 6V4M17 6V4M7 18v2M12 18v2M17 18v2"/>
              </svg>
              <span>MEMORY</span>
            </div>
            <div class="ram-display">
              <div class="ram-bar">
                <div class="ram-fill" style="width: {ramPercent}%"></div>
                <div class="ram-labels">
                  <span class="ram-current">{device.specifications.ram.current}</span>
                  <span class="ram-max">/ {device.specifications.ram.max_supported}</span>
                </div>
              </div>
              <div class="ram-percent">{ramPercent}%</div>
            </div>
            <div class="spec-item inline">
              <span class="spec-label">TYPE</span>
              <span class="spec-value">{device.specifications.ram.type}</span>
            </div>
          </section>
        {/if}

        <!-- Motherboard Section -->
        {#if device.specifications?.motherboard}
          <section class="spec-section">
            <div class="section-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <rect x="7" y="7" width="4" height="4"/>
                <rect x="13" y="7" width="4" height="4"/>
                <rect x="7" y="13" width="4" height="4"/>
                <rect x="13" y="13" width="4" height="4"/>
              </svg>
              <span>MOTHERBOARD</span>
            </div>
            <div class="spec-grid">
              <div class="spec-item full">
                <span class="spec-label">MODEL</span>
                <span class="spec-value">{device.specifications.motherboard.model}</span>
              </div>
              {#if device.specifications.motherboard.chipset}
                <div class="spec-item">
                  <span class="spec-label">CHIPSET</span>
                  <span class="spec-value">{device.specifications.motherboard.chipset}</span>
                </div>
              {/if}
              {#if device.specifications.motherboard.sata_ports}
                <div class="spec-item">
                  <span class="spec-label">SATA PORTS</span>
                  <span class="spec-value data">{device.specifications.motherboard.sata_ports}</span>
                </div>
              {/if}
              {#if device.specifications.motherboard.nvme_slots}
                <div class="spec-item">
                  <span class="spec-label">NVMe SLOTS</span>
                  <span class="spec-value data nvme">{device.specifications.motherboard.nvme_slots}</span>
                </div>
              {/if}
            </div>
          </section>
        {/if}

        <!-- GPUs Section -->
        {#if device.gpus && device.gpus.length > 0}
          <section class="spec-section">
            <div class="section-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="6" width="20" height="12" rx="2"/>
                <path d="M6 10v4M10 10v4M14 10v4M18 10v4"/>
              </svg>
              <span>GRAPHICS</span>
              <span class="section-count">{device.gpus.length}</span>
            </div>
            <ul class="item-list">
              {#each device.gpus as gpu}
                <li>
                  <span class="item-bullet"></span>
                  <span class="item-name">{gpu.model}</span>
                  {#if gpu.vram}
                    <span class="item-meta">{gpu.vram}</span>
                  {/if}
                </li>
              {/each}
            </ul>
          </section>
        {/if}

        <!-- Storage Section -->
        {#if device.storage && device.storage.length > 0}
          <section class="spec-section">
            <div class="section-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="4" y="4" width="16" height="6" rx="1"/>
                <rect x="4" y="14" width="16" height="6" rx="1"/>
                <circle cx="8" cy="7" r="1" fill="currentColor"/>
                <circle cx="8" cy="17" r="1" fill="currentColor"/>
              </svg>
              <span>STORAGE</span>
              <span class="section-count">{device.storage.length}</span>
            </div>
            <ul class="storage-list">
              {#each device.storage as drive}
                <li>
                  <span class="storage-type">{drive.type}</span>
                  <span class="storage-capacity">{drive.capacity}</span>
                  {#if drive.mount_point}
                    <span class="storage-mount">{drive.mount_point}</span>
                  {/if}
                </li>
              {/each}
            </ul>
            <div class="storage-total">
              <span class="total-label">TOTAL CAPACITY</span>
              <span class="total-value">{formatBytes(totalStorage)}</span>
            </div>
          </section>
        {/if}

        <!-- PCIe Slots Section -->
        {#if device.pcie_slots && device.pcie_slots.length > 0}
          <section class="spec-section">
            <div class="section-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="8" width="18" height="8" rx="1"/>
                <path d="M7 8V6M12 8V6M17 8V6"/>
              </svg>
              <span>EXPANSION SLOTS</span>
              <span class="section-count">{device.pcie_slots.length}</span>
            </div>
            <ul class="slot-list">
              {#each device.pcie_slots as slot}
                <li>
                  <span class="slot-status" class:occupied={slot.status === 'Occupied'}>
                    {#if slot.status === 'Available'}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="8"/>
                      </svg>
                    {:else}
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="8"/>
                      </svg>
                    {/if}
                  </span>
                  <span class="slot-desc">{slot.description}</span>
                  {#if slot.current_card}
                    <span class="slot-card">{slot.current_card}</span>
                  {/if}
                </li>
              {/each}
            </ul>
          </section>
        {/if}

        <!-- Upgrade Analysis Section -->
        {#if device.upgrade_analysis}
          <section class="spec-section upgrade-section">
            <div class="section-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
              <span>UPGRADE ANALYSIS</span>
            </div>
            {#if device.upgrade_analysis.cpu_max}
              <div class="upgrade-item">
                <span class="upgrade-label">MAX CPU SUPPORT</span>
                <span class="upgrade-value">{device.upgrade_analysis.cpu_max}</span>
              </div>
            {/if}
            {#if device.upgrade_analysis.notes}
              <div class="upgrade-notes">
                {device.upgrade_analysis.notes}
              </div>
            {/if}
          </section>
        {/if}

      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(8, 9, 12, 0.85);
    backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    justify-content: flex-end;
  }

  .detail-panel {
    width: 100%;
    max-width: 520px;
    background: var(--panel);
    border-left: 1px solid var(--border-panel);
    height: 100%;
    overflow-y: auto;
    animation: slideIn 0.25s var(--ease-out-expo);
    position: relative;
  }

  .detail-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 2px;
    height: 100%;
    background: linear-gradient(180deg, var(--signal-blue), transparent);
    opacity: 0.5;
  }

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  /* Header */
  .panel-header {
    padding: var(--space-6);
    background: var(--panel-deep);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .action-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    border-radius: var(--radius-md);
    transition: all var(--duration-fast) var(--ease-out-quad);
  }

  .action-btn:hover {
    background: var(--panel-hover);
  }

  .action-btn svg {
    width: 16px;
    height: 16px;
  }

  .edit-btn:hover {
    color: var(--signal-blue);
  }

  .delete-btn:hover {
    color: #ff6b6b;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    border-radius: var(--radius-md);
    transition: all var(--duration-fast) var(--ease-out-quad);
  }

  .close-btn:hover {
    background: var(--panel-hover);
    color: var(--text-bright);
  }

  .close-btn svg {
    width: 18px;
    height: 18px;
  }

  .header-info h2 {
    font-family: var(--font-display);
    font-size: 1.375rem;
    font-weight: 600;
    color: var(--text-bright);
    margin: 0;
    line-height: 1.2;
  }

  .model {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--text-muted);
    margin: var(--space-1) 0 0;
  }

  .header-accent {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      var(--signal-blue) 0%,
      var(--border-panel) 50%,
      transparent 100%
    );
  }

  /* Content */
  .panel-content {
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  /* Section styling */
  .spec-section {
    padding: var(--space-4);
    background: var(--panel-deep);
    border: 1px solid var(--border-dim);
    border-radius: var(--radius-lg);
    position: relative;
  }

  /* Corner brackets */
  .spec-section::before,
  .spec-section::after {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    border-color: var(--border-technical);
    border-style: solid;
  }

  .spec-section::before {
    top: -1px;
    left: -1px;
    border-width: 1px 0 0 1px;
  }

  .spec-section::after {
    bottom: -1px;
    right: -1px;
    border-width: 0 1px 1px 0;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
    color: var(--text-secondary);
  }

  .section-header svg {
    width: 16px;
    height: 16px;
    color: var(--signal-blue);
  }

  .section-header span {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.12em;
  }

  .section-count {
    margin-left: auto;
    padding: 2px 6px;
    background: var(--panel-hover);
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    font-size: 0.625rem;
    letter-spacing: 0.05em;
  }

  /* Spec grid */
  .spec-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }

  .spec-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .spec-item.full {
    grid-column: 1 / -1;
  }

  .spec-item.inline {
    flex-direction: row;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  .spec-label {
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    color: var(--text-dim);
  }

  .spec-value {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--text-primary);
  }

  .spec-value.data {
    color: var(--signal-blue);
    font-weight: 600;
  }

  .spec-value.nvme {
    color: var(--signal-cyan, #00d4ff);
  }

  .spec-value.codec {
    font-size: 0.75rem;
    color: var(--signal-green, #00ff88);
  }

  /* RAM display */
  .ram-display {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }

  .ram-bar {
    flex: 1;
    height: 28px;
    background: var(--panel);
    border-radius: var(--radius-md);
    overflow: hidden;
    position: relative;
  }

  .ram-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--signal-green-dim), var(--signal-green));
    border-radius: var(--radius-md);
    transition: width var(--duration-slow) var(--ease-out-expo);
  }

  .ram-labels {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }

  .ram-current {
    color: var(--text-bright);
    font-weight: 600;
  }

  .ram-max {
    color: var(--text-muted);
  }

  .ram-percent {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--signal-green);
    min-width: 48px;
    text-align: right;
  }

  /* Item lists */
  .item-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .item-list li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 0.8125rem;
  }

  .item-bullet {
    width: 6px;
    height: 6px;
    background: var(--signal-blue);
    border-radius: 50%;
    flex-shrink: 0;
  }

  .item-name {
    color: var(--text-primary);
    font-family: var(--font-mono);
  }

  .item-meta {
    margin-left: auto;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }

  /* Storage list */
  .storage-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .storage-list li {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
  }

  .storage-type {
    min-width: 60px;
    color: var(--text-muted);
    font-size: 0.75rem;
  }

  .storage-capacity {
    color: var(--signal-cyan);
    font-weight: 500;
  }

  .storage-mount {
    margin-left: auto;
    color: var(--text-dim);
    font-size: 0.75rem;
  }

  .storage-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px solid var(--border-dim);
  }

  .total-label {
    font-family: var(--font-mono);
    font-size: 0.625rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    color: var(--text-dim);
  }

  .total-value {
    font-family: var(--font-mono);
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-bright);
  }

  /* Slot list */
  .slot-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .slot-list li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 0.8125rem;
  }

  .slot-status {
    width: 14px;
    height: 14px;
    color: var(--signal-green);
    flex-shrink: 0;
  }

  .slot-status svg {
    width: 100%;
    height: 100%;
  }

  .slot-status.occupied {
    color: var(--text-muted);
  }

  .slot-desc {
    color: var(--text-secondary);
    font-family: var(--font-mono);
  }

  .slot-card {
    margin-left: auto;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    padding: 2px 6px;
    background: var(--panel-hover);
    border-radius: var(--radius-sm);
  }

  /* Upgrade section */
  .upgrade-section {
    background: linear-gradient(135deg, var(--panel-deep) 0%, rgba(255, 176, 32, 0.05) 100%);
    border-color: rgba(255, 176, 32, 0.2);
  }

  .upgrade-section::before,
  .upgrade-section::after {
    border-color: var(--signal-amber);
  }

  .upgrade-section .section-header svg {
    color: var(--signal-amber);
  }

  .upgrade-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-2) 0;
  }

  .upgrade-label {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .upgrade-value {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--signal-amber);
  }

  .upgrade-notes {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    font-style: italic;
    padding: var(--space-2) 0;
    line-height: 1.5;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     RESPONSIVE STYLES
     ═══════════════════════════════════════════════════════════════════════════ */

  /* Tablet (768px) */
  @media (max-width: 768px) {
    .detail-panel {
      max-width: calc(100vw - 60px);
    }

    .panel-header {
      padding: var(--space-4);
    }

    .panel-content {
      padding: var(--space-4);
      gap: var(--space-4);
    }

    .spec-section {
      padding: var(--space-3);
    }

    .action-btn,
    .close-btn {
      width: 40px;
      height: 40px;
    }

    .action-btn svg {
      width: 18px;
      height: 18px;
    }

    .close-btn svg {
      width: 20px;
      height: 20px;
    }
  }

  /* Mobile (640px) */
  @media (max-width: 640px) {
    .detail-panel {
      max-width: 100%;
      border-left: none;
    }

    .panel-header {
      padding: var(--space-3);
    }

    .header-info h2 {
      font-size: 1.125rem;
    }

    .model {
      font-size: 0.75rem;
    }

    .panel-content {
      padding: var(--space-3);
      gap: var(--space-3);
    }

    .spec-section {
      padding: var(--space-3);
    }

    .spec-section::before,
    .spec-section::after {
      display: none;
    }

    .section-header span {
      font-size: 0.625rem;
    }

    .spec-grid {
      grid-template-columns: 1fr;
      gap: var(--space-2);
    }

    .spec-value {
      font-size: 0.75rem;
    }

    /* Touch-friendly action buttons */
    .action-btn,
    .close-btn {
      width: 44px;
      height: 44px;
    }

    .ram-bar {
      height: 24px;
    }

    .ram-labels {
      font-size: 0.6875rem;
    }

    .ram-percent {
      font-size: 0.75rem;
      min-width: 40px;
    }

    .storage-list li {
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    .storage-mount {
      width: 100%;
      margin-left: 0;
    }

    .slot-list li {
      flex-wrap: wrap;
    }

    .slot-card {
      width: 100%;
      margin-left: 0;
      margin-top: var(--space-1);
    }
  }

  /* Small Mobile (480px) */
  @media (max-width: 480px) {
    .panel-header {
      padding: var(--space-2);
    }

    .header-top {
      margin-bottom: var(--space-2);
    }

    .header-info h2 {
      font-size: 1rem;
    }

    .panel-content {
      padding: var(--space-2);
      gap: var(--space-2);
    }

    .spec-section {
      padding: var(--space-2);
    }

    .section-header {
      margin-bottom: var(--space-2);
    }

    .section-header svg {
      width: 14px;
      height: 14px;
    }

    .ram-display {
      flex-direction: column;
      align-items: stretch;
      gap: var(--space-2);
    }

    .ram-percent {
      text-align: center;
    }

    .upgrade-item {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-1);
    }
  }

  /* Landscape mobile */
  @media (max-height: 500px) and (orientation: landscape) {
    .panel-header {
      padding: var(--space-2) var(--space-3);
      position: relative;
    }

    .header-top {
      margin-bottom: var(--space-2);
    }

    .panel-content {
      padding: var(--space-2) var(--space-3);
    }

    .spec-section {
      padding: var(--space-2);
    }
  }
</style>
