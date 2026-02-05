<!-- Demo mode header - similar to regular header but no auth, read-only -->
<script lang="ts">
  import { searchQuery } from '../../lib/stores';
  import { demoView, type DemoView } from '../../lib/router';
  import { demoStats } from '../../lib/demoData';
  import { t, locale } from '../../lib/i18n';
  import LanguageSwitcher from '../LanguageSwitcher.svelte';

  let search = $state('');
  let currentLocale = $state('en');
  let currentDemoView = $state<DemoView>('dashboard');

  $effect(() => {
    const unsubSearch = searchQuery.subscribe(v => search = v);
    const unsubLocale = locale.subscribe(v => currentLocale = v || 'en');
    const unsubView = demoView.subscribe(v => currentDemoView = v);
    return () => {
      unsubSearch();
      unsubLocale();
      unsubView();
    };
  });

  function setView(v: string) {
    demoView.set(v as DemoView);
  }

  function updateSearch(e: Event) {
    searchQuery.set((e.target as HTMLInputElement).value);
  }

  const views = [
    { id: 'dashboard', labelKey: 'nav.dashboard', icon: 'grid' },
    { id: 'devices', labelKey: 'nav.devices', icon: 'cpu' },
    { id: 'topology', labelKey: 'nav.topology', icon: 'network' },
  ] as const;

  // Current time for the "control room" feel
  let time = $state(new Date().toLocaleTimeString(currentLocale, { hour12: false }));
  $effect(() => {
    const interval = setInterval(() => {
      time = new Date().toLocaleTimeString(currentLocale, { hour12: false });
    }, 1000);
    return () => clearInterval(interval);
  });
</script>

<header class="header">
  <div class="header-content">
    <!-- Logo Section -->
    <div class="logo-section">
      <div class="logo">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round"/>
            <circle cx="8" cy="6" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="16" cy="12" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="12" cy="18" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
        </div>
        <div class="logo-text">
          <span class="logo-title">{$t('header.title')}</span>
          <span class="logo-sub">{$t('header.subtitle')}</span>
        </div>
      </div>
      <mc-status status="warning">DEMO</mc-status>
    </div>

    <!-- Navigation -->
    <nav class="nav" role="navigation" aria-label={$t('accessibility.mainNavigation')}>
      {#each views as v}
        <button
          class="nav-item"
          class:active={currentDemoView === v.id}
          onclick={() => setView(v.id)}
          aria-pressed={currentDemoView === v.id}
          aria-label={$t(v.labelKey)}
        >
          <span class="nav-indicator" aria-hidden="true"></span>
          <span class="nav-label">{$t(v.labelKey)}</span>
        </button>
      {/each}
    </nav>

    <!-- Right Section: Stats + Search + Time -->
    <div class="header-right">
      <!-- Quick Stats (demo data) -->
      <div class="quick-stats">
        <div class="stat-chip">
          <span class="stat-value">{demoStats.total_devices}</span>
          <span class="stat-label">{$t('header.units')}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-chip">
          <span class="stat-value">{demoStats.total_storage_formatted}</span>
          <span class="stat-label">{$t('header.storage')}</span>
        </div>
      </div>

      <!-- Search -->
      <div class="search" role="search">
        <label for="device-search" class="sr-only">{$t('header.searchLabel')}</label>
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7"/>
          <path d="m21 21-4.35-4.35" stroke-linecap="round"/>
        </svg>
        <input
          id="device-search"
          type="search"
          placeholder={$t('header.searchPlaceholder')}
          value={search}
          oninput={updateSearch}
          aria-describedby="search-description"
        />
        <span id="search-description" class="sr-only">{$t('header.searchDescription')}</span>
      </div>

      <!-- Time Display -->
      <div class="time-display">
        <span class="time">{time}</span>
        <span class="time-label">{$t('header.sysTime')}</span>
      </div>

      <!-- Language Switcher -->
      <LanguageSwitcher />
    </div>
  </div>

  <!-- Bottom accent line -->
  <div class="header-accent"></div>
</header>

<style>
  .header {
    background: linear-gradient(180deg, var(--tui-panel) 0%, var(--tui-panel-deep) 100%);
    border-bottom: 1px solid var(--tui-border);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-content {
    max-width: 1600px;
    margin: 0 auto;
    padding: var(--tui-space-3) var(--tui-space-6);
    display: flex;
    align-items: center;
    gap: var(--tui-space-8);
  }

  .header-accent {
    height: 2px;
    background: linear-gradient(90deg,
      transparent 0%,
      var(--tui-warning) 20%,
      var(--tui-warning) 80%,
      transparent 100%
    );
    opacity: 0.4;
  }

  /* Logo Section */
  .logo-section {
    display: flex;
    align-items: center;
    gap: var(--tui-space-4);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: var(--tui-space-3);
  }

  .logo-icon {
    width: 32px;
    height: 32px;
    color: var(--tui-warning);
    filter: drop-shadow(0 0 8px rgba(255, 176, 32, 0.4));
  }

  .logo-icon svg {
    width: 100%;
    height: 100%;
  }

  .logo-text {
    display: flex;
    flex-direction: column;
  }

  .logo-title {
    font-family: var(--tui-font-mono);
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: 0.1em;
    color: var(--tui-text-bright);
    line-height: 1.1;
  }

  .logo-sub {
    font-family: var(--tui-font-mono);
    font-size: 0.5625rem;
    letter-spacing: 0.2em;
    color: var(--tui-text-muted);
    line-height: 1.2;
  }

  /* Navigation */
  .nav {
    display: flex;
    gap: var(--tui-space-1);
    background: var(--tui-panel-deep);
    padding: var(--tui-space-1);
    border-radius: var(--tui-radius-md);
    border: 1px solid var(--tui-border);
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: var(--tui-space-2);
    padding: var(--tui-space-2) var(--tui-space-4);
    border-radius: var(--tui-radius-sm);
    color: var(--tui-text-muted);
    transition: all var(--duration-base) var(--ease-out-quad);
    position: relative;
  }

  .nav-indicator {
    width: 4px;
    height: 4px;
    background: currentColor;
    border-radius: 50%;
    opacity: 0.4;
    transition: all var(--duration-base) var(--ease-out-quad);
  }

  .nav-item:hover {
    color: var(--tui-text-muted);
    background: var(--panel-hover);
  }

  .nav-item:hover .nav-indicator {
    opacity: 0.7;
  }

  .nav-item.active {
    color: var(--tui-warning);
    background: rgba(255, 176, 32, 0.1);
  }

  .nav-item.active .nav-indicator {
    opacity: 1;
    box-shadow: 0 0 6px currentColor;
  }

  .nav-label {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.08em;
  }

  /* Header Right */
  .header-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: var(--tui-space-5);
  }

  /* Quick Stats */
  .quick-stats {
    display: flex;
    align-items: center;
    gap: var(--tui-space-3);
    padding: var(--tui-space-2) var(--tui-space-3);
    background: var(--tui-panel-deep);
    border: 1px solid var(--tui-border);
    border-radius: var(--tui-radius-md);
  }

  .stat-chip {
    display: flex;
    align-items: baseline;
    gap: var(--tui-space-2);
  }

  .stat-value {
    font-family: var(--tui-font-mono);
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--tui-warning);
  }

  .stat-label {
    font-family: var(--tui-font-mono);
    font-size: 0.5625rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    color: var(--tui-text-dim);
  }

  .stat-divider {
    width: 1px;
    height: 20px;
    background: var(--tui-border);
  }

  /* Search */
  .search {
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: var(--tui-space-3);
    top: 50%;
    transform: translateY(-50%);
    width: 14px;
    height: 14px;
    color: var(--tui-text-dim);
    pointer-events: none;
  }

  .search input {
    width: 200px;
    padding-left: var(--tui-space-8);
    background: var(--tui-panel-deep);
    font-size: 0.8125rem;
  }

  .search input:focus {
    width: 280px;
  }

  /* Time Display */
  .time-display {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .time {
    font-family: var(--tui-font-mono);
    font-size: 1rem;
    font-weight: 500;
    color: var(--tui-text-bright);
    letter-spacing: 0.05em;
    font-variant-numeric: tabular-nums;
  }

  .time-label {
    font-family: var(--tui-font-mono);
    font-size: 0.5625rem;
    letter-spacing: 0.15em;
    color: var(--tui-text-dim);
  }

  /* Responsive */
  @media (max-width: 1200px) {
    .quick-stats {
      display: none;
    }
  }

  @media (max-width: 900px) {
    .header-content {
      flex-wrap: wrap;
      gap: var(--tui-space-4);
    }

    .time-display {
      display: none;
    }

    .search input {
      width: 160px;
    }

    .search input:focus {
      width: 200px;
    }
  }

  @media (max-width: 640px) {
    .logo-text {
      display: none;
    }

    .nav-label {
      display: none;
    }

    .header-right {
      flex: 1;
    }

    .search {
      flex: 1;
    }

    .search input {
      width: 100%;
    }

    .search input:focus {
      width: 100%;
    }

    .nav-item {
      padding: var(--tui-space-2);
      min-width: 44px;
      min-height: 44px;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .header-content {
      padding: var(--tui-space-2) var(--tui-space-3);
      gap: var(--tui-space-2);
    }

    .logo-section {
      gap: var(--tui-space-2);
    }

    .logo {
      gap: var(--tui-space-2);
    }

    .logo-icon {
      width: 28px;
      height: 28px;
    }

    .nav {
      padding: 2px;
      gap: 2px;
    }

    .nav-item {
      padding: var(--tui-space-1) var(--tui-space-2);
      min-width: 40px;
      min-height: 40px;
    }

    .nav-indicator {
      width: 3px;
      height: 3px;
    }

    .header-right {
      gap: var(--tui-space-2);
    }

    .search-icon {
      width: 12px;
      height: 12px;
      left: var(--tui-space-2);
    }

    .search input {
      padding-left: var(--tui-space-6);
      font-size: 16px;
      min-height: 40px;
    }
  }

  @media (max-width: 375px) {
    .header-content {
      padding: var(--tui-space-1) var(--tui-space-2);
      gap: var(--tui-space-1);
    }

    .logo-icon {
      width: 24px;
      height: 24px;
    }

    .nav {
      display: none;
    }

    .header-right {
      gap: var(--tui-space-1);
    }

    mc-status {
      display: none;
    }
  }

  @media (max-height: 500px) and (orientation: landscape) {
    .header-content {
      padding: var(--tui-space-1) var(--tui-space-4);
    }

    .header-accent {
      height: 1px;
    }
  }
</style>
