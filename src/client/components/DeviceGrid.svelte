<script lang="ts">
  import { devices, typeFilter, searchQuery, openCreateForm } from '../lib/stores';
  import type { DeviceWithRelations } from '../../shared/types';
  import DeviceCard from './DeviceCard.svelte';

  let deviceList: DeviceWithRelations[] = $state([]);
  let currentTypeFilter: string | null = $state(null);
  let currentSearch = $state('');

  $effect(() => {
    const unsubDevices = devices.subscribe(v => deviceList = v);
    const unsubType = typeFilter.subscribe(v => currentTypeFilter = v);
    const unsubSearch = searchQuery.subscribe(v => currentSearch = v);
    return () => {
      unsubDevices();
      unsubType();
      unsubSearch();
    };
  });

  // Computed filtered devices
  let filteredDevices = $derived(deviceList.filter(d => {
    if (currentTypeFilter && d.type !== currentTypeFilter) return false;
    if (currentSearch) {
      const query = currentSearch.toLowerCase();
      return d.name.toLowerCase().includes(query) ||
        d.model.toLowerCase().includes(query) ||
        d.specifications?.cpu?.model?.toLowerCase().includes(query);
    }
    return true;
  }));

  function setTypeFilter(e: Event) {
    const value = (e.target as HTMLSelectElement).value;
    typeFilter.set(value || null);
  }

  const deviceTypes = ['Server', 'Desktop', 'Laptop', 'Component', 'IoT', 'Network'];
</script>

<div class="page">
  <!-- Page Header -->
  <div class="page-header">
    <div class="page-title">
      <span class="title-prefix">// </span>
      <h1>DEVICE INVENTORY</h1>
    </div>

    <div class="header-controls">
      <div class="filter-group">
        <label class="filter-label">TYPE</label>
        <select onchange={setTypeFilter} value={currentTypeFilter || ''}>
          <option value="">All Types</option>
          {#each deviceTypes as type}
            <option value={type}>{type}</option>
          {/each}
        </select>
      </div>

      <button class="add-device-btn" onclick={openCreateForm}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        ADD DEVICE
      </button>
    </div>
  </div>

  <!-- Results Bar -->
  <div class="results-bar">
    <div class="results-count">
      <span class="count-value">{filteredDevices.length}</span>
      <span class="count-label">UNIT{filteredDevices.length !== 1 ? 'S' : ''} FOUND</span>
    </div>
    {#if currentTypeFilter || currentSearch}
      <button class="clear-filters" onclick={() => { typeFilter.set(null); searchQuery.set(''); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        CLEAR FILTERS
      </button>
    {/if}
  </div>

  <!-- Device Grid -->
  <div class="device-grid">
    {#each filteredDevices as device, i (device.id)}
      <div class="grid-item" style="animation-delay: {Math.min(i * 50, 300)}ms">
        <DeviceCard {device} />
      </div>
    {/each}
  </div>

  {#if filteredDevices.length === 0}
    <div class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <path d="M8 21h8M12 17v4"/>
        </svg>
      </div>
      <p class="empty-title">NO DEVICES FOUND</p>
      <p class="empty-sub">Try adjusting your search or filters</p>
    </div>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  /* Page Header */
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--space-4);
  }

  .page-title {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  .title-prefix {
    font-family: var(--font-mono);
    font-size: 1.5rem;
    color: var(--signal-blue);
    font-weight: 300;
  }

  .page-header h1 {
    font-family: var(--font-display);
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--text-bright);
  }

  .header-controls {
    display: flex;
    align-items: flex-end;
    gap: var(--space-4);
  }

  .add-device-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--bg-base);
    background: var(--signal-blue);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out-quad);
  }

  .add-device-btn:hover {
    background: var(--signal-blue-bright, #5ba3ff);
  }

  .add-device-btn svg {
    width: 16px;
    height: 16px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .filter-label {
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: var(--text-dim);
  }

  .filter-group select {
    min-width: 160px;
    padding: var(--space-2) var(--space-3);
    padding-right: var(--space-8);
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235c6578' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
  }

  /* Results Bar */
  .results-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    background: var(--panel);
    border: 1px solid var(--border-dim);
    border-radius: var(--radius-md);
  }

  .results-count {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  .count-value {
    font-family: var(--font-mono);
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--signal-blue);
  }

  .count-label {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    color: var(--text-muted);
  }

  .clear-filters {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    border-radius: var(--radius-sm);
    transition: all var(--duration-fast) var(--ease-out-quad);
  }

  .clear-filters:hover {
    background: var(--panel-hover);
    color: var(--text-primary);
  }

  .clear-filters svg {
    width: 12px;
    height: 12px;
  }

  /* Device Grid - Clean uniform layout */
  .device-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-4);
  }

  .grid-item {
    opacity: 0;
    animation: fadeInUp 0.4s var(--ease-out-expo) forwards;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-12);
    gap: var(--space-3);
  }

  .empty-icon {
    width: 48px;
    height: 48px;
    color: var(--text-dim);
    margin-bottom: var(--space-2);
  }

  .empty-icon svg {
    width: 100%;
    height: 100%;
  }

  .empty-title {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text-muted);
  }

  .empty-sub {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-dim);
  }

  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .page-header h1 {
      font-size: 1.375rem;
    }

    .title-prefix {
      font-size: 1.25rem;
    }

    .device-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
