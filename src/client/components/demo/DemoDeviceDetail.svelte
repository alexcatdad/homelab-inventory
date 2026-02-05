<!-- Demo Device Detail - read-only view of demo device -->
<script lang="ts">
  import { selectedDevice } from '../../lib/stores';
  import { t } from '../../lib/i18n';

  let device = $state<any>(null);
  let isOpen = $state(false);

  $effect(() => {
    const unsub = selectedDevice.subscribe((d) => {
      device = d;
      isOpen = !!d;
    });
    return () => unsub();
  });

  function closeDetail() {
    selectedDevice.set(null);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeDetail();
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      closeDetail();
    }
  }

  // Calculate total storage
  function calculateTotalStorage(storage?: Array<{ capacity: string }>): string {
    if (!storage || storage.length === 0) return '0 GB';
    let total = 0;
    for (const s of storage) {
      const match = s.capacity.match(/(\d+)(TB|GB|MB)/i);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].toUpperCase();
        if (unit === 'TB') total += value * 1024;
        else if (unit === 'GB') total += value;
        else if (unit === 'MB') total += value / 1024;
      }
    }
    if (total >= 1024) {
      return `${(total / 1024).toFixed(1)} TB`;
    }
    return `${total.toFixed(0)} GB`;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && device}
  <div class="detail-backdrop" onclick={handleBackdropClick} role="presentation">
    <aside class="detail-panel" role="dialog" aria-modal="true" aria-labelledby="device-detail-title">
      <!-- Header -->
      <header class="detail-header">
        <div class="header-content">
          <span class="badge badge-{device.type?.toLowerCase()}">{device.type}</span>
          <h2 id="device-detail-title">{device.name}</h2>
          <p class="device-model">{device.model || 'Unknown Model'}</p>
        </div>
        <button class="close-btn" onclick={closeDetail} aria-label={$t('common.close')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <!-- Content -->
      <div class="detail-content">
        <!-- Demo Mode Notice -->
        <div class="demo-notice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"/>
          </svg>
          <span>{$t('demo.readOnly')}</span>
        </div>

        <!-- Processor Section -->
        {#if device.specifications?.cpu}
          <section class="detail-section">
            <h3 class="section-title">{$t('deviceDetail.processor')}</h3>
            <div class="spec-grid">
              <div class="spec-row">
                <span class="spec-label">{$t('deviceDetail.model')}</span>
                <span class="spec-value">{device.specifications.cpu.model}</span>
              </div>
              {#if device.specifications.cpu.cores}
                <div class="spec-row">
                  <span class="spec-label">{$t('deviceDetail.cores')}</span>
                  <span class="spec-value">{device.specifications.cpu.cores}</span>
                </div>
              {/if}
              {#if device.specifications.cpu.threads}
                <div class="spec-row">
                  <span class="spec-label">{$t('deviceDetail.threads')}</span>
                  <span class="spec-value">{device.specifications.cpu.threads}</span>
                </div>
              {/if}
              {#if device.specifications.cpu.tdp_watts}
                <div class="spec-row">
                  <span class="spec-label">{$t('deviceDetail.tdp')}</span>
                  <span class="spec-value">{device.specifications.cpu.tdp_watts}W</span>
                </div>
              {/if}
            </div>
          </section>
        {/if}

        <!-- Memory Section -->
        {#if device.specifications?.ram}
          <section class="detail-section">
            <h3 class="section-title">{$t('deviceDetail.memory')}</h3>
            <div class="spec-grid">
              <div class="spec-row">
                <span class="spec-label">{$t('deviceDetail.type')}</span>
                <span class="spec-value">{device.specifications.ram.type}</span>
              </div>
              <div class="spec-row">
                <span class="spec-label">Current</span>
                <span class="spec-value">{device.specifications.ram.current}</span>
              </div>
              <div class="spec-row">
                <span class="spec-label">Max</span>
                <span class="spec-value">{device.specifications.ram.max_supported}</span>
              </div>
              {#if device.specifications.ram.slots_used !== undefined}
                <div class="spec-row">
                  <span class="spec-label">Slots</span>
                  <span class="spec-value">{device.specifications.ram.slots_used}/{device.specifications.ram.slots_total || '?'}</span>
                </div>
              {/if}
            </div>
          </section>
        {/if}

        <!-- Motherboard Section -->
        {#if device.specifications?.motherboard}
          <section class="detail-section">
            <h3 class="section-title">{$t('deviceDetail.motherboard')}</h3>
            <div class="spec-grid">
              <div class="spec-row">
                <span class="spec-label">{$t('deviceDetail.model')}</span>
                <span class="spec-value">{device.specifications.motherboard.model}</span>
              </div>
              {#if device.specifications.motherboard.chipset}
                <div class="spec-row">
                  <span class="spec-label">{$t('deviceDetail.chipset')}</span>
                  <span class="spec-value">{device.specifications.motherboard.chipset}</span>
                </div>
              {/if}
              {#if device.specifications.motherboard.form_factor}
                <div class="spec-row">
                  <span class="spec-label">Form Factor</span>
                  <span class="spec-value">{device.specifications.motherboard.form_factor}</span>
                </div>
              {/if}
            </div>
          </section>
        {/if}

        <!-- Graphics Section -->
        {#if device.gpus && device.gpus.length > 0}
          <section class="detail-section">
            <h3 class="section-title">{$t('deviceDetail.graphics')}</h3>
            <div class="spec-grid">
              {#each device.gpus as gpu, i}
                <div class="spec-row">
                  <span class="spec-label">GPU {device.gpus.length > 1 ? i + 1 : ''}</span>
                  <span class="spec-value">{gpu.model}{gpu.vram ? ` (${gpu.vram})` : ''}</span>
                </div>
              {/each}
            </div>
          </section>
        {/if}

        <!-- Storage Section -->
        {#if device.storage && device.storage.length > 0}
          <section class="detail-section">
            <h3 class="section-title">{$t('deviceDetail.storage')}</h3>
            <div class="storage-list">
              {#each device.storage as drive}
                <div class="storage-item">
                  <span class="storage-type">{drive.type}</span>
                  <span class="storage-capacity">{drive.capacity}</span>
                  {#if drive.details}
                    <span class="storage-details">{drive.details}</span>
                  {/if}
                </div>
              {/each}
            </div>
            <div class="storage-total">
              <span>{$t('deviceDetail.totalCapacity')}</span>
              <span>{calculateTotalStorage(device.storage)}</span>
            </div>
          </section>
        {/if}

        <!-- Network Info Section -->
        {#if device.network_info}
          <section class="detail-section">
            <h3 class="section-title">Network</h3>
            <div class="spec-grid">
              {#if device.network_info.ip_address}
                <div class="spec-row">
                  <span class="spec-label">IP Address</span>
                  <span class="spec-value">{device.network_info.ip_address}</span>
                </div>
              {/if}
              {#if device.network_info.mac_address}
                <div class="spec-row">
                  <span class="spec-label">MAC Address</span>
                  <span class="spec-value">{device.network_info.mac_address}</span>
                </div>
              {/if}
            </div>
          </section>
        {/if}

        <!-- Location & Notes -->
        {#if device.location || device.notes}
          <section class="detail-section">
            <h3 class="section-title">Info</h3>
            <div class="spec-grid">
              {#if device.location}
                <div class="spec-row">
                  <span class="spec-label">Location</span>
                  <span class="spec-value">{device.location}</span>
                </div>
              {/if}
              {#if device.notes}
                <div class="spec-row notes">
                  <span class="spec-label">Notes</span>
                  <span class="spec-value">{device.notes}</span>
                </div>
              {/if}
            </div>
          </section>
        {/if}
      </div>
    </aside>
  </div>
{/if}

<style>
  .detail-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 200;
    display: flex;
    justify-content: flex-end;
  }

  .detail-panel {
    width: 100%;
    max-width: 480px;
    height: 100%;
    background: var(--tui-panel);
    border-left: 1px solid var(--tui-border);
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s var(--ease-out-expo);
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .detail-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: var(--tui-space-6);
    border-bottom: 1px solid var(--tui-border);
    background: var(--tui-panel-deep);
  }

  .header-content {
    display: flex;
    flex-direction: column;
    gap: var(--tui-space-2);
  }

  .header-content h2 {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--tui-text-bright);
    margin: 0;
  }

  .device-model {
    font-family: var(--tui-font-mono);
    font-size: 0.8125rem;
    color: var(--tui-text-muted);
    margin: 0;
  }

  .close-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid var(--tui-border);
    border-radius: var(--tui-radius-md);
    color: var(--tui-text-muted);
    cursor: pointer;
    transition: all var(--duration-base) var(--ease-out-quad);
    flex-shrink: 0;
  }

  .close-btn:hover {
    background: var(--panel-hover);
    border-color: var(--tui-danger);
    color: var(--tui-danger);
  }

  .close-btn svg {
    width: 18px;
    height: 18px;
  }

  .detail-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--tui-space-4);
    display: flex;
    flex-direction: column;
    gap: var(--tui-space-4);
  }

  .demo-notice {
    display: flex;
    align-items: center;
    gap: var(--tui-space-2);
    padding: var(--tui-space-2) var(--tui-space-3);
    background: rgba(255, 176, 32, 0.1);
    border: 1px solid rgba(255, 176, 32, 0.3);
    border-radius: var(--tui-radius-sm);
    color: var(--tui-warning);
  }

  .demo-notice svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .demo-notice span {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.05em;
  }

  .detail-section {
    background: var(--tui-panel-deep);
    border: 1px solid var(--tui-border);
    border-radius: var(--tui-radius-md);
    overflow: hidden;
  }

  .section-title {
    font-family: var(--tui-font-mono);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--tui-warning);
    padding: var(--tui-space-3) var(--tui-space-4);
    background: var(--tui-panel);
    border-bottom: 1px solid var(--tui-border);
    margin: 0;
  }

  .spec-grid {
    padding: var(--tui-space-3) var(--tui-space-4);
    display: flex;
    flex-direction: column;
    gap: var(--tui-space-2);
  }

  .spec-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--tui-space-3);
  }

  .spec-row.notes {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--tui-space-1);
  }

  .spec-label {
    font-family: var(--tui-font-mono);
    font-size: 0.625rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: var(--tui-text-dim);
    flex-shrink: 0;
  }

  .spec-value {
    font-family: var(--tui-font-mono);
    font-size: 0.8125rem;
    color: var(--tui-text-muted);
    text-align: right;
  }

  .spec-row.notes .spec-value {
    text-align: left;
    font-size: 0.75rem;
    line-height: 1.5;
  }

  .storage-list {
    padding: var(--tui-space-3) var(--tui-space-4);
    display: flex;
    flex-direction: column;
    gap: var(--tui-space-2);
  }

  .storage-item {
    display: flex;
    align-items: center;
    gap: var(--tui-space-3);
    padding: var(--tui-space-2);
    background: var(--tui-panel);
    border-radius: var(--tui-radius-sm);
  }

  .storage-type {
    font-family: var(--tui-font-mono);
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--tui-cyan);
    padding: 2px 6px;
    background: rgba(0, 229, 204, 0.15);
    border-radius: var(--tui-radius-sm);
  }

  .storage-capacity {
    font-family: var(--tui-font-mono);
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--tui-text-bright);
  }

  .storage-details {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    color: var(--tui-text-muted);
    margin-left: auto;
  }

  .storage-total {
    display: flex;
    justify-content: space-between;
    padding: var(--tui-space-3) var(--tui-space-4);
    border-top: 1px solid var(--tui-border);
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    color: var(--tui-text-dim);
  }

  .storage-total span:last-child {
    color: var(--tui-info);
    font-weight: 600;
  }

  @media (max-width: 640px) {
    .detail-panel {
      max-width: 100%;
    }

    .detail-header {
      padding: var(--tui-space-4);
    }

    .detail-content {
      padding: var(--tui-space-3);
    }

    .header-content h2 {
      font-size: 1.125rem;
    }
  }
</style>
