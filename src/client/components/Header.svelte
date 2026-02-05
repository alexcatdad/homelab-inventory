<script lang="ts">
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '../../../convex/_generated/api';
  import { currentView, searchQuery } from '../lib/stores';
  import { openChat } from '../lib/chatStore';
  import { signOut as doSignOut } from '../lib/authStore';
  import { t, locale } from '../lib/i18n';
  import LanguageSwitcher from './LanguageSwitcher.svelte';

  const client = useConvexClient();
  let isSigningOut = $state(false);

  async function signOut() {
    isSigningOut = true;
    try {
      await doSignOut(client);
    } catch (e) {
      console.error('Sign out failed:', e);
      isSigningOut = false;
    }
    // Note: doSignOut reloads the page, so we don't reset isSigningOut
  }

  const statsQuery = useQuery(api.stats.get, {});

  let search = $state('');
  let view = $state('dashboard');
  let statsData = $derived(statsQuery.data);
  let currentLocale = $state('en');

  $effect(() => {
    const unsubSearch = searchQuery.subscribe(v => search = v);
    const unsubView = currentView.subscribe(v => view = v);
    const unsubLocale = locale.subscribe(v => currentLocale = v || 'en');
    return () => {
      unsubSearch();
      unsubView();
      unsubLocale();
    };
  });

  function setView(v: string) {
    currentView.set(v as any);
  }

  function updateSearch(e: Event) {
    searchQuery.set((e.target as HTMLInputElement).value);
  }

  // Navigation items with translation keys
  const views = [
    { id: 'dashboard', labelKey: 'nav.dashboard', icon: 'grid' },
    { id: 'devices', labelKey: 'nav.devices', icon: 'cpu' },
    { id: 'topology', labelKey: 'nav.topology', icon: 'network' },
  ] as const;

  // Current time for the "control room" feel - uses locale for formatting
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
      <mc-status status="online">{$t('common.online')}</mc-status>
    </div>

    <!-- Navigation -->
    <nav class="nav" role="navigation" aria-label={$t('accessibility.mainNavigation')}>
      {#each views as v}
        <button
          class="nav-item"
          class:active={view === v.id}
          onclick={() => setView(v.id)}
          aria-pressed={view === v.id}
          aria-label={$t(v.labelKey)}
        >
          <span class="nav-indicator" aria-hidden="true"></span>
          <span class="nav-label">{$t(v.labelKey)}</span>
        </button>
      {/each}
    </nav>

    <!-- Right Section: Stats + Search + Time -->
    <div class="header-right">
      <!-- Quick Stats -->
      {#if statsData}
        <div class="quick-stats">
          <div class="stat-chip">
            <span class="stat-value">{statsData.total_devices}</span>
            <span class="stat-label">{$t('header.units')}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-chip">
            <span class="stat-value">{statsData.total_storage_formatted}</span>
            <span class="stat-label">{$t('header.storage')}</span>
          </div>
        </div>
      {/if}

      <!-- Chat Button -->
      <button class="chat-button" onclick={openChat} aria-label={$t('header.aiAssistant')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/>
          <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none"/>
          <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/>
        </svg>
        <span class="chat-label" aria-hidden="true">AI</span>
      </button>

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

      <!-- Settings Button -->
      <button
        class="icon-button"
        class:active={view === 'settings'}
        onclick={() => setView('settings')}
        aria-label={$t('header.settings')}
        aria-pressed={view === 'settings'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>

      <!-- Sign Out Button -->
      <button
        class="icon-button sign-out"
        onclick={signOut}
        disabled={isSigningOut}
        aria-label={$t('header.signOut')}
        aria-busy={isSigningOut}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="16 17 21 12 16 7" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="21" y1="12" x2="9" y2="12" stroke-linecap="round"/>
        </svg>
      </button>
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
      var(--tui-info) 20%,
      var(--tui-info) 80%,
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
    color: var(--tui-info);
    filter: drop-shadow(0 0 8px var(--signal-blue-glow));
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
    color: var(--tui-info);
    background: rgba(0, 168, 255, 0.1);
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
    color: var(--tui-info);
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

  /* Chat Button */
  .chat-button {
    display: flex;
    align-items: center;
    gap: var(--tui-space-2);
    padding: var(--tui-space-2) var(--tui-space-3);
    background: var(--tui-panel-deep);
    border: 1px solid var(--tui-border);
    border-radius: var(--tui-radius-md);
    color: var(--tui-text-muted);
    transition: all var(--duration-base) var(--ease-out-quad);
  }

  .chat-button:hover {
    background: var(--panel-hover);
    border-color: var(--tui-info);
    color: var(--tui-info);
  }

  .chat-button svg {
    width: 18px;
    height: 18px;
  }

  .chat-label {
    font-family: var(--tui-font-mono);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
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

  /* Icon Buttons (Settings, Sign Out) */
  .icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    background: var(--tui-panel-deep);
    border: 1px solid var(--tui-border);
    border-radius: var(--tui-radius-md);
    color: var(--tui-text-muted);
    transition: all var(--duration-base) var(--ease-out-quad);
    flex-shrink: 0;
  }

  .icon-button:hover:not(:disabled) {
    background: var(--panel-hover);
    border-color: var(--tui-info);
    color: var(--tui-info);
  }

  .icon-button.active {
    background: rgba(0, 168, 255, 0.1);
    border-color: var(--tui-info);
    color: var(--tui-info);
  }

  .icon-button.sign-out:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.1);
    border-color: var(--tui-danger);
    color: var(--tui-danger);
  }

  .icon-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon-button svg {
    width: 18px;
    height: 18px;
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

    /* Touch-friendly icon buttons */
    .icon-button {
      width: 44px;
      height: 44px;
    }

    .icon-button svg {
      width: 20px;
      height: 20px;
    }

    .chat-button {
      padding: var(--tui-space-2);
      min-width: 44px;
      min-height: 44px;
      justify-content: center;
    }

    .chat-label {
      display: none;
    }

    .chat-button svg {
      width: 20px;
      height: 20px;
    }

    .nav-item {
      padding: var(--tui-space-2);
      min-width: 44px;
      min-height: 44px;
      justify-content: center;
    }
  }

  /* Mobile (480px) */
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

    .icon-button {
      width: 40px;
      height: 40px;
    }

    .chat-button {
      min-width: 40px;
      min-height: 40px;
    }

    .search-icon {
      width: 12px;
      height: 12px;
      left: var(--tui-space-2);
    }

    .search input {
      padding-left: var(--tui-space-6);
      font-size: 16px; /* Prevents iOS zoom */
      min-height: 40px;
    }
  }

  /* Very small mobile (375px) */
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
      display: none; /* Use bottom nav on very small screens */
    }

    .icon-button {
      width: 36px;
      height: 36px;
    }

    .chat-button {
      min-width: 36px;
      min-height: 36px;
    }

    .header-right {
      gap: var(--tui-space-1);
    }

    /* Status can be hidden on tiny screens */
    mc-status {
      display: none;
    }
  }

  /* Landscape mobile */
  @media (max-height: 500px) and (orientation: landscape) {
    .header-content {
      padding: var(--tui-space-1) var(--tui-space-4);
    }

    .header-accent {
      height: 1px;
    }
  }
</style>
