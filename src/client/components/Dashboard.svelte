<script lang="ts">
  import { useQuery } from 'convex-svelte';
  import { api } from '../../../convex/_generated/api';
  import { currentView } from '../lib/stores';
  import { t } from '../lib/i18n';
  import StorageChart from './viz/StorageChart.svelte';
  import RamChart from './viz/RamChart.svelte';
  import DeviceTypeChart from './viz/DeviceTypeChart.svelte';
  import SampleDataBanner from './SampleDataBanner.svelte';

  // Convex queries - automatically reactive and real-time
  const statsQuery = useQuery(api.stats.get, {});
  const devicesQuery = useQuery(api.devices.list, {});

  // Derive data from queries
  let statsData = $derived(statsQuery.data);
  let deviceList = $derived(devicesQuery.data || []);
  let isLoading = $derived(statsQuery.isLoading || devicesQuery.isLoading);

  function goToDevices() {
    currentView.set('devices');
  }

  // Parse RAM values for progress calculation
  let ramCurrent = $derived(parseInt(statsData?.total_ram_current || '0'));
  let ramPotential = $derived(parseInt(statsData?.total_ram_potential || '1') || 1);
  let ramPercent = $derived(Math.round((ramCurrent / ramPotential) * 100));
</script>

<div class="dashboard">
  <SampleDataBanner />

  <!-- Page Header -->
  <div class="page-header">
    <div class="page-title">
      <span class="title-prefix">// </span>
      <h1>{$t('dashboard.title')}</h1>
    </div>
    <p class="page-subtitle">{$t('dashboard.subtitle')}</p>
  </div>

  <!-- Primary Metrics Row -->
  <mc-section label={$t('dashboard.primaryMetrics')}>
    <div class="metrics-grid">
      <!-- Total Devices -->
      <div class="metric-card">
        <div class="metric-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8M12 17v4"/>
          </svg>
        </div>
        <div class="metric-content">
          <div class="metric-value">{statsData?.total_devices || 0}</div>
          <div class="metric-label">{$t('dashboard.totalUnits')}</div>
        </div>
        <div class="metric-badge">{$t('dashboard.all')}</div>
      </div>

      <!-- Total Storage -->
      <div class="metric-card">
        <div class="metric-icon storage">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="4" y="4" width="16" height="6" rx="1"/>
            <rect x="4" y="14" width="16" height="6" rx="1"/>
            <circle cx="8" cy="7" r="1" fill="currentColor"/>
            <circle cx="8" cy="17" r="1" fill="currentColor"/>
          </svg>
        </div>
        <div class="metric-content">
          <div class="metric-value">{statsData?.total_storage_formatted || '0 B'}</div>
          <div class="metric-label">{$t('dashboard.totalStorage')}</div>
        </div>
        <div class="metric-badge storage">{$t('dashboard.sto')}</div>
      </div>

      <!-- RAM Utilization -->
      <div class="metric-card ram">
        <div class="metric-icon ram">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="6" width="18" height="12" rx="1"/>
            <path d="M7 6V4M12 6V4M17 6V4M7 18v2M12 18v2M17 18v2"/>
          </svg>
        </div>
        <div class="metric-content">
          <div class="metric-value-group">
            <span class="metric-value">{statsData?.total_ram_current || '0GB'}</span>
            <span class="metric-value-sub">/ {statsData?.total_ram_potential || '0GB'}</span>
          </div>
          <div class="metric-label">{$t('dashboard.memoryCapacity')}</div>
          <div class="metric-progress">
            <div class="metric-progress-fill" style="width: {ramPercent}%"></div>
          </div>
        </div>
        <div class="metric-badge ram">{ramPercent}%</div>
      </div>

      <!-- Upgradeable -->
      <div class="metric-card upgradeable">
        <div class="metric-icon upgradeable">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </div>
        <div class="metric-content">
          <div class="metric-value">{statsData?.upgradeable_devices || 0}</div>
          <div class="metric-label">{$t('dashboard.upgradeReady')}</div>
        </div>
        <div class="metric-badge upgradeable">{$t('dashboard.upg')}</div>
      </div>
    </div>
  </mc-section>

  <!-- Analytics Section -->
  <mc-section label={$t('dashboard.analytics')}>
    <mc-grid columns="3" class="analytics-grid">
      <!-- Storage Distribution -->
      <mc-panel>
        <div class="card-header">
          <h3>{$t('dashboard.storageDistribution')}</h3>
          <mc-badge variant="custom" color="cyan" no-dot>{$t('dashboard.byDevice')}</mc-badge>
        </div>
        <div class="card-content">
          <StorageChart devices={deviceList} />
        </div>
      </mc-panel>

      <!-- RAM Utilization -->
      <mc-panel>
        <div class="card-header">
          <h3>{$t('dashboard.memoryUtilization')}</h3>
          <mc-badge variant="custom" color="green" no-dot>{$t('dashboard.expandable')}</mc-badge>
        </div>
        <div class="card-content">
          <RamChart devices={deviceList} />
        </div>
      </mc-panel>

      <!-- Device Types -->
      <mc-panel>
        <div class="card-header">
          <h3>{$t('dashboard.deviceClassification')}</h3>
          <mc-badge variant="custom" color="blue" no-dot>{$t('dashboard.byType')}</mc-badge>
        </div>
        <div class="card-content">
          <DeviceTypeChart stats={statsData} />
        </div>
      </mc-panel>
    </mc-grid>
  </mc-section>

  <!-- Quick Actions -->
  <div class="quick-actions">
    <mc-button variant="ghost" size="lg" role="button" tabindex="0" onclick={goToDevices} onkeydown={(e) => e.key === 'Enter' && goToDevices()}>
      <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
      {$t('dashboard.viewAllDevices')} →
    </mc-button>
  </div>
</div>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  /* Page Header */
  .page-header {
    margin-bottom: var(--space-2);
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

  .page-subtitle {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--text-muted);
    letter-spacing: 0.02em;
    margin-top: var(--space-1);
    margin-left: calc(var(--space-2) + 1.5rem);
  }

  /* Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);
  }

  .metric-card {
    background: var(--panel);
    border: 1px solid var(--border-panel);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    display: flex;
    gap: var(--space-4);
    position: relative;
    overflow: hidden;
    transition: all var(--duration-base) var(--ease-out-quad);
  }

  /* Corner brackets */
  .metric-card::before,
  .metric-card::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    border-color: var(--border-technical);
    border-style: solid;
    pointer-events: none;
    transition: border-color var(--duration-base) var(--ease-out-quad);
  }

  .metric-card::before {
    top: -1px;
    left: -1px;
    border-width: 2px 0 0 2px;
  }

  .metric-card::after {
    bottom: -1px;
    right: -1px;
    border-width: 0 2px 2px 0;
  }

  .metric-card:hover {
    border-color: var(--border-technical);
    transform: translateY(-2px);
  }

  .metric-card:hover::before,
  .metric-card:hover::after {
    border-color: var(--signal-blue);
  }

  .metric-card.upgradeable {
    background: linear-gradient(135deg, var(--panel) 0%, rgba(255, 176, 32, 0.05) 100%);
    border-color: rgba(255, 176, 32, 0.3);
  }

  .metric-card.upgradeable::before,
  .metric-card.upgradeable::after {
    border-color: var(--signal-amber);
  }

  .metric-icon {
    width: 40px;
    height: 40px;
    color: var(--signal-blue);
    opacity: 0.8;
    flex-shrink: 0;
  }

  .metric-icon.storage { color: var(--signal-cyan); }
  .metric-icon.ram { color: var(--signal-green); }
  .metric-icon.upgradeable { color: var(--signal-amber); }

  .metric-icon svg {
    width: 100%;
    height: 100%;
  }

  .metric-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
  }

  .metric-value {
    font-family: var(--font-mono);
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-bright);
    line-height: 1.1;
    letter-spacing: -0.02em;
  }

  .metric-value-group {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
  }

  .metric-value-sub {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 400;
    color: var(--text-muted);
  }

  .metric-label {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    margin-top: var(--space-1);
  }

  .metric-progress {
    height: 3px;
    background: var(--panel-deep);
    border-radius: 2px;
    margin-top: var(--space-2);
    overflow: hidden;
  }

  .metric-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--signal-green-dim), var(--signal-green));
    border-radius: 2px;
    transition: width var(--duration-slow) var(--ease-out-expo);
  }

  .metric-badge {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    padding: 2px 6px;
    background: rgba(0, 168, 255, 0.15);
    color: var(--signal-blue);
    border-radius: var(--radius-sm);
  }

  .metric-badge.storage {
    background: rgba(0, 229, 204, 0.15);
    color: var(--signal-cyan);
  }

  .metric-badge.ram {
    background: rgba(0, 210, 106, 0.15);
    color: var(--signal-green);
  }

  .metric-badge.upgradeable {
    background: rgba(255, 176, 32, 0.15);
    color: var(--signal-amber);
  }

  /* Analytics Grid */
  .analytics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--border-dim);
    background: var(--panel-deep);
  }

  .card-header h3 {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--text-secondary);
    margin: 0;
  }

  .card-content {
    padding: var(--space-5);
  }

  /* Quick Actions */
  .quick-actions {
    display: flex;
    justify-content: center;
    padding-top: var(--space-4);
  }

  /* Responsive */
  @media (max-width: 1200px) {
    .analytics-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 1024px) {
    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .metrics-grid {
      grid-template-columns: 1fr;
    }

    .analytics-grid {
      grid-template-columns: 1fr;
    }

    .page-header h1 {
      font-size: 1.375rem;
    }

    .title-prefix {
      font-size: 1.25rem;
    }

    .metric-value {
      font-size: 1.5rem;
    }

    .dashboard {
      gap: var(--space-5);
    }

    .card-header {
      padding: var(--space-3) var(--space-4);
    }

    .card-content {
      padding: var(--space-3);
    }
  }

  /* Mobile (640px) */
  @media (max-width: 640px) {
    .dashboard {
      gap: var(--space-4);
    }

    .metrics-grid {
      gap: var(--space-3);
    }

    .metric-card {
      padding: var(--space-3);
      gap: var(--space-3);
    }

    .metric-card::before,
    .metric-card::after {
      width: 12px;
      height: 12px;
    }

    .metric-icon {
      width: 32px;
      height: 32px;
    }

    .metric-value {
      font-size: 1.375rem;
    }

    .metric-value-sub {
      font-size: 0.75rem;
    }

    .metric-label {
      font-size: 0.625rem;
    }

    .metric-badge {
      font-size: 0.5rem;
      padding: 2px 4px;
    }

    .page-subtitle {
      font-size: 0.75rem;
      margin-left: var(--space-2);
    }

    .card-header h3 {
      font-size: 0.6875rem;
    }
  }

  /* Small Mobile (480px) */
  @media (max-width: 480px) {
    .dashboard {
      gap: var(--space-3);
    }

    .page-header {
      margin-bottom: var(--space-1);
    }

    .page-title {
      gap: var(--space-1);
    }

    .page-header h1 {
      font-size: 1.25rem;
    }

    .title-prefix {
      font-size: 1.125rem;
    }

    .page-subtitle {
      display: none; /* Hide subtitle on very small screens */
    }

    .metrics-grid {
      gap: var(--space-2);
    }

    .metric-card {
      padding: var(--space-2);
      gap: var(--space-2);
    }

    .metric-card::before,
    .metric-card::after {
      display: none;
    }

    .metric-icon {
      width: 28px;
      height: 28px;
    }

    .metric-value {
      font-size: 1.25rem;
    }

    .metric-value-sub {
      font-size: 0.6875rem;
    }

    .metric-label {
      font-size: 0.5625rem;
    }

    .metric-badge {
      top: var(--space-1);
      right: var(--space-1);
    }

    .card-header {
      padding: var(--space-2) var(--space-3);
    }

    .card-content {
      padding: var(--space-2);
    }

    .quick-actions {
      padding-top: var(--space-2);
    }
  }

  /* Very small mobile (375px) */
  @media (max-width: 375px) {
    .page-header h1 {
      font-size: 1.125rem;
    }

    .title-prefix {
      font-size: 1rem;
    }

    .metric-card {
      flex-direction: column;
      align-items: flex-start;
    }

    .metric-icon {
      width: 24px;
      height: 24px;
    }

    .metric-value {
      font-size: 1.125rem;
    }
  }

  /* Landscape mobile */
  @media (max-height: 500px) and (orientation: landscape) {
    .dashboard {
      gap: var(--space-3);
    }

    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-2);
    }

    .metric-card {
      padding: var(--space-2);
    }

    .metric-value {
      font-size: 1.25rem;
    }
  }
</style>
