<!-- Demo Device Grid - uses static demo data, read-only -->
<script lang="ts">
  import { typeFilter, searchQuery } from '../../lib/stores';
  import { filterDemoDevices } from '../../lib/demoData';
  import { t } from '../../lib/i18n';
  import DemoDeviceCard from './DemoDeviceCard.svelte';

  let currentTypeFilter: string | null = $state(null);
  let currentSearch = $state('');

  $effect(() => {
    const unsubType = typeFilter.subscribe(v => currentTypeFilter = v);
    const unsubSearch = searchQuery.subscribe(v => currentSearch = v);
    return () => {
      unsubType();
      unsubSearch();
    };
  });

  // Filter demo devices based on current filters
  let filteredDevices = $derived(filterDemoDevices({
    type: currentTypeFilter || undefined,
    search: currentSearch || undefined,
  }));

  function setTypeFilter(e: Event) {
    const value = (e.target as HTMLSelectElement).value;
    typeFilter.set(value || null);
  }

  function showDemoMessage() {
    // Could show a toast, but for now just don't do anything
    alert($t('demo.signInToEdit'));
  }

  const deviceTypes = ['Server', 'Desktop', 'Laptop', 'Component', 'IoT', 'Network'];
</script>

<div class="page">
  <!-- Page Header -->
  <div class="page-header">
    <div class="page-title">
      <span class="title-prefix">// </span>
      <h1>{$t('devices.title')}</h1>
    </div>

    <div class="header-controls">
      <div class="filter-group">
        <label class="filter-label">{$t('devices.type')}</label>
        <select onchange={setTypeFilter} value={currentTypeFilter || ''}>
          <option value="">{$t('devices.allTypes')}</option>
          {#each deviceTypes as type}
            <option value={type}>{$t(`devices.types.${type}`)}</option>
          {/each}
        </select>
      </div>

      <button class="tui-btn tui-btn-primary demo-disabled" onclick={showDemoMessage}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        {$t('devices.addDevice')}
      </button>
    </div>
  </div>

  <!-- Results Bar -->
  <div class="results-bar">
    <div class="results-count">
      <span class="count-value">{filteredDevices.length}</span>
      <span class="count-label">{$t('devices.unitsFound', { count: filteredDevices.length })}</span>
    </div>
    {#if currentTypeFilter || currentSearch}
      <button class="tui-btn tui-btn-ghost clear-filters" onclick={() => { typeFilter.set(null); searchQuery.set(''); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        {$t('devices.clearFilters')}
      </button>
    {/if}
  </div>

  <!-- Device Grid -->
  <div class="device-grid">
    {#each filteredDevices as device, i (device._id)}
      <div class="grid-item" style="animation-delay: {Math.min(i * 50, 300)}ms">
        <DemoDeviceCard {device} />
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
      <p class="empty-title">{$t('devices.noDevicesFound')}</p>
      <p class="empty-sub">{$t('devices.noDevicesHint')}</p>
    </div>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--tui-space-5);
  }

  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--tui-space-4);
  }

  .page-title {
    display: flex;
    align-items: baseline;
    gap: var(--tui-space-2);
  }

  .title-prefix {
    font-family: var(--tui-font-mono);
    font-size: 1.5rem;
    color: var(--tui-warning);
    font-weight: 300;
  }

  .page-header h1 {
    font-family: var(--font-display);
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--tui-text-bright);
  }

  .header-controls {
    display: flex;
    align-items: flex-end;
    gap: var(--tui-space-4);
  }

  .demo-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .demo-disabled:hover {
    transform: none;
    box-shadow: none;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--tui-space-1);
  }

  .filter-label {
    font-family: var(--tui-font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: var(--tui-text-dim);
  }

  .filter-group select {
    min-width: 160px;
    padding: var(--tui-space-2) var(--tui-space-3);
    padding-right: var(--tui-space-8);
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235c6578' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
  }

  .results-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--tui-space-3) var(--tui-space-4);
    background: var(--tui-panel);
    border: 1px solid var(--tui-border);
    border-radius: var(--tui-radius-md);
  }

  .results-count {
    display: flex;
    align-items: baseline;
    gap: var(--tui-space-2);
  }

  .count-value {
    font-family: var(--tui-font-mono);
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--tui-warning);
  }

  .count-label {
    font-family: var(--tui-font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    color: var(--tui-text-muted);
  }

  .clear-filters {
    font-size: 0.6875rem;
    padding: var(--tui-space-1) var(--tui-space-2);
  }

  .clear-filters svg {
    width: 12px;
    height: 12px;
  }

  .device-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--tui-space-4);
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

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--tui-space-12);
    gap: var(--tui-space-3);
  }

  .empty-icon {
    width: 48px;
    height: 48px;
    color: var(--tui-text-dim);
    margin-bottom: var(--tui-space-2);
  }

  .empty-icon svg {
    width: 100%;
    height: 100%;
  }

  .empty-title {
    font-family: var(--tui-font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--tui-text-muted);
  }

  .empty-sub {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    color: var(--tui-text-dim);
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

    .header-controls {
      width: 100%;
      flex-wrap: wrap;
    }

    .filter-group {
      flex: 1;
      min-width: 120px;
    }

    .filter-group select {
      width: 100%;
      min-width: unset;
    }
  }

  @media (max-width: 640px) {
    .page {
      gap: var(--tui-space-3);
    }

    .page-header {
      gap: var(--tui-space-3);
    }

    .header-controls {
      gap: var(--tui-space-3);
    }

    .results-bar {
      padding: var(--tui-space-2) var(--tui-space-3);
      flex-wrap: wrap;
      gap: var(--tui-space-2);
    }

    .count-value {
      font-size: 1rem;
    }

    .count-label {
      font-size: 0.625rem;
    }

    .clear-filters {
      min-height: 36px;
      padding: var(--tui-space-2);
    }

    .device-grid {
      gap: var(--tui-space-3);
    }

    .empty-state {
      padding: var(--tui-space-8);
    }

    .empty-icon {
      width: 40px;
      height: 40px;
    }

    .empty-title {
      font-size: 0.8125rem;
    }

    .empty-sub {
      font-size: 0.6875rem;
    }
  }

  @media (max-width: 480px) {
    .page {
      gap: var(--tui-space-2);
    }

    .page-header {
      gap: var(--tui-space-2);
    }

    .page-title {
      gap: var(--tui-space-1);
    }

    .page-header h1 {
      font-size: 1.25rem;
    }

    .title-prefix {
      font-size: 1.125rem;
    }

    .header-controls {
      flex-direction: column;
      gap: var(--tui-space-2);
    }

    .filter-group {
      width: 100%;
    }

    .filter-group select {
      min-height: 44px;
      font-size: 16px;
    }

    .header-controls .tui-btn-primary {
      width: 100%;
    }

    .results-bar {
      padding: var(--tui-space-2);
    }

    .device-grid {
      gap: var(--tui-space-2);
    }

    .empty-state {
      padding: var(--tui-space-6);
    }
  }

  @media (max-width: 375px) {
    .page-header h1 {
      font-size: 1.125rem;
    }

    .title-prefix {
      font-size: 1rem;
    }

    .header-controls .tui-btn-primary {
      font-size: 0.6875rem;
    }
  }

  @media (max-height: 500px) and (orientation: landscape) {
    .page {
      gap: var(--tui-space-2);
    }

    .page-header {
      flex-direction: row;
      align-items: center;
    }

    .header-controls {
      flex-direction: row;
    }

    .device-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--tui-space-2);
    }

    .empty-state {
      padding: var(--tui-space-4);
    }
  }
</style>
