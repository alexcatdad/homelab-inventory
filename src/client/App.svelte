<script lang="ts">
  import { setupConvex, useQuery, useConvexClient } from "convex-svelte";
  import { api } from "../../convex/_generated/api";
  import { currentView } from "./lib/stores";
  import {
    isAuthenticated,
    isAuthLoading,
    authInitialized as authInitializedStore,
    initializeAuth,
  } from "./lib/authStore";
  import { isGuestMode, initializeGuestMode } from "./lib/guestStore";
  import { t } from "./lib/i18n";
  import { syncLanguageFromConvex } from "./lib/i18n/languageStore";
  import { router } from './lib/router';
  import type { Route } from './lib/router';
  import Dashboard from "./components/Dashboard.svelte";
  import DemoDashboard from "./components/demo/DemoDashboard.svelte";
  import DeviceGrid from "./components/DeviceGrid.svelte";
  import DemoDeviceGrid from "./components/demo/DemoDeviceGrid.svelte";
  import DeviceDetail from "./components/DeviceDetail.svelte";
  import DemoDeviceDetail from "./components/demo/DemoDeviceDetail.svelte";
  import DeviceForm from "./components/DeviceForm.svelte";
  import DeleteConfirm from "./components/DeleteConfirm.svelte";
  import ChatPanel from "./components/chat/ChatPanel.svelte";
  import TopologyView from "./components/TopologyView.svelte";
  import DemoTopologyView from "./components/demo/DemoTopologyView.svelte";
  import Settings from "./components/Settings.svelte";
  import Header from "./components/Header.svelte";
  import DemoHeader from "./components/demo/DemoHeader.svelte";
  import LoginPage from "./components/LoginPage.svelte";
  import ErrorBoundary from "./components/ErrorBoundary.svelte";
  import LandingPage from './components/public/LandingPage.svelte';
  import SupportersPage from './components/public/SupportersPage.svelte';
  import PrivacyPage from './components/public/PrivacyPage.svelte';
  import TermsPage from './components/public/TermsPage.svelte';
  import DemoBanner from "./components/DemoBanner.svelte";

  // Initialize Convex client
  setupConvex(import.meta.env.VITE_CONVEX_URL);

  const client = useConvexClient();

  let view = $state("dashboard");
  let authenticated = $state(false);
  let loading = $state(true);
  let authReady = $state(false);
  let initStarted = $state(false);
  let languageSynced = $state(false);
  let currentRoute = $state<Route>({ page: 'landing' });
  let seedAttempted = $state(false);
  let guestMode = $state(false);

  // Sample data seeding for new users
  const hasDevicesQuery = useQuery(api.sampleData.hasDevices, () => (authenticated ? {} : "skip"));

  // Initialize auth and guest mode on mount
  $effect(() => {
    if (!initStarted) {
      initStarted = true;
      initializeGuestMode();
      initializeAuth(client).catch(console.error);
    }
  });

  // Subscribe to guest mode store
  $effect(() => {
    const unsub = isGuestMode.subscribe((v) => (guestMode = v));
    return () => unsub();
  });

  // Subscribe to auth stores
  $effect(() => {
    const unsubInit = authInitializedStore.subscribe((v) => (authReady = v));
    const unsubAuth = isAuthenticated.subscribe((v) => (authenticated = v));
    const unsubLoading = isAuthLoading.subscribe((v) => (loading = v));
    return () => {
      unsubInit();
      unsubAuth();
      unsubLoading();
    };
  });

  // Subscribe to view store
  $effect(() => {
    const unsub = currentView.subscribe((v) => (view = v));
    return () => unsub();
  });

  // Subscribe to router
  $effect(() => {
    const unsub = router.route.subscribe((r) => (currentRoute = r));
    return () => unsub();
  });

  // Query auth state only AFTER auth is initialized (use 'skip' pattern)
  const authState = useQuery(api.auth.currentUser, () => (authReady ? {} : "skip"));

  // Sync query result back to stores when available
  $effect(() => {
    if (authReady && !authState.isLoading && authState.data !== undefined) {
      // Query completed - update stores with server-confirmed state
      const isAuthed = !!authState.data;
      isAuthenticated.set(isAuthed);

      // Sync language preference when auth state is confirmed
      if (!languageSynced) {
        languageSynced = true;
        syncLanguageFromConvex(client, isAuthed).catch(console.error);
      }
    }
  });

  // Seed sample data for new users who have no devices
  $effect(() => {
    if (authenticated && !hasDevicesQuery.isLoading && hasDevicesQuery.data === false && !seedAttempted) {
      seedAttempted = true;
      client.mutation(api.sampleData.seedSampleData, {}).catch(console.error);
    }
  });
</script>

<ErrorBoundary>
{#if currentRoute.page === 'landing'}
  <div class="app">
    <!-- Background effects for landing page -->
    <div class="bg-effects" aria-hidden="true">
      <div class="particles">
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
      </div>
      <div class="data-streams">
        <div class="data-stream"></div>
        <div class="data-stream"></div>
        <div class="data-stream"></div>
      </div>
      <div class="corner-accent top-left"></div>
      <div class="corner-accent bottom-right"></div>
    </div>
    <LandingPage />
  </div>
{:else if currentRoute.page === 'supporters'}
  <div class="app">
    <!-- Background effects for supporters page -->
    <div class="bg-effects" aria-hidden="true">
      <div class="particles">
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
      </div>
      <div class="data-streams">
        <div class="data-stream"></div>
        <div class="data-stream"></div>
        <div class="data-stream"></div>
      </div>
      <div class="corner-accent top-left"></div>
      <div class="corner-accent bottom-right"></div>
    </div>
    <SupportersPage />
  </div>
{:else if currentRoute.page === 'privacy'}
  <div class="app">
    <!-- Background effects for privacy page -->
    <div class="bg-effects" aria-hidden="true">
      <div class="particles">
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
      </div>
      <div class="data-streams">
        <div class="data-stream"></div>
        <div class="data-stream"></div>
        <div class="data-stream"></div>
      </div>
      <div class="corner-accent top-left"></div>
      <div class="corner-accent bottom-right"></div>
    </div>
    <PrivacyPage />
  </div>
{:else if currentRoute.page === 'terms'}
  <div class="app">
    <!-- Background effects for terms page -->
    <div class="bg-effects" aria-hidden="true">
      <div class="particles">
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
      </div>
      <div class="data-streams">
        <div class="data-stream"></div>
        <div class="data-stream"></div>
        <div class="data-stream"></div>
      </div>
      <div class="corner-accent top-left"></div>
      <div class="corner-accent bottom-right"></div>
    </div>
    <TermsPage />
  </div>
{:else if currentRoute.page === 'demo'}
  <!-- Demo/guest mode - no auth required, uses static demo data -->
  <div class="app">
    <!-- Skip to main content link for keyboard users -->
    <a href="#main-content" class="skip-link">{$t('accessibility.skipToMain')}</a>

    <!-- Live region for screen reader announcements -->
    <div
      id="live-announcements"
      class="live-region"
      aria-live="polite"
      aria-atomic="true"
    ></div>

    <!-- Aerospace Background Effects -->
    <div class="bg-effects" aria-hidden="true">
      <div class="particles">
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
      </div>
      <div class="data-streams">
        <div class="data-stream"></div>
        <div class="data-stream"></div>
        <div class="data-stream"></div>
        <div class="data-stream"></div>
        <div class="data-stream"></div>
      </div>
      <div class="grid-pulse"></div>
      <div class="grid-pulse"></div>
      <div class="grid-pulse"></div>
      <div class="grid-pulse"></div>
      <div class="grid-pulse"></div>
      <div class="corner-accent top-left"></div>
      <div class="corner-accent bottom-right"></div>
    </div>

    <DemoHeader />

    <main id="main-content" class="main" role="main" tabindex="-1">
      <div class="content fade-in">
        <DemoBanner />
        {#if view === "dashboard"}
          <DemoDashboard />
        {:else if view === "devices"}
          <DemoDeviceGrid />
        {:else if view === "topology"}
          <DemoTopologyView />
        {:else if view === "settings"}
          <Settings />
        {/if}
      </div>
    </main>

    <DemoDeviceDetail />
  </div>
{:else if currentRoute.page === 'app'}
  <!-- Auth-gated app content -->
  {#if loading}
    <div class="app">
      <!-- Background effects for loading screen -->
      <div class="bg-effects" aria-hidden="true">
        <div class="particles">
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
        </div>
        <div class="corner-accent top-left"></div>
        <div class="corner-accent bottom-right"></div>
      </div>

      <div class="loading-screen" role="status" aria-live="polite">
        <div class="loading-indicator">
          <div class="spinner"></div>
          <div class="spinner-glow"></div>
        </div>
        <span class="loading-text">{$t('app.initializing')}</span>
      </div>
    </div>
  {:else if !authenticated}
    <div class="app">
      <!-- Background effects for login -->
      <div class="bg-effects" aria-hidden="true">
        <div class="particles">
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
        </div>
        <div class="data-streams">
          <div class="data-stream"></div>
          <div class="data-stream"></div>
          <div class="data-stream"></div>
        </div>
        <div class="corner-accent top-left"></div>
        <div class="corner-accent bottom-right"></div>
      </div>

      <LoginPage />
    </div>
  {:else}
    <div class="app">
      <!-- Skip to main content link for keyboard users -->
      <a href="#main-content" class="skip-link">{$t('accessibility.skipToMain')}</a>

      <!-- Live region for screen reader announcements -->
      <div
        id="live-announcements"
        class="live-region"
        aria-live="polite"
        aria-atomic="true"
      ></div>

      <!-- Aerospace Background Effects -->
      <div class="bg-effects" aria-hidden="true">
        <div class="particles">
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
        </div>
        <div class="data-streams">
          <div class="data-stream"></div>
          <div class="data-stream"></div>
          <div class="data-stream"></div>
          <div class="data-stream"></div>
          <div class="data-stream"></div>
        </div>
        <div class="grid-pulse"></div>
        <div class="grid-pulse"></div>
        <div class="grid-pulse"></div>
        <div class="grid-pulse"></div>
        <div class="grid-pulse"></div>
        <div class="corner-accent top-left"></div>
        <div class="corner-accent bottom-right"></div>
      </div>

      <Header />

      <main id="main-content" class="main" role="main" tabindex="-1">
        <div class="content fade-in">
          {#if view === "dashboard"}
            <Dashboard />
          {:else if view === "devices"}
            <DeviceGrid />
          {:else if view === "topology"}
            <TopologyView />
          {:else if view === "settings"}
            <Settings />
          {/if}
        </div>
      </main>

      <DeviceDetail />
      <DeviceForm />
      <DeleteConfirm />
      <ChatPanel />
    </div>
  {/if}
{/if}
</ErrorBoundary>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main {
    flex: 1;
    padding: var(--tui-space-6);
    max-width: 1600px;
    margin: 0 auto;
    width: 100%;
  }

  .content {
    opacity: 0;
    animation: fadeIn 0.4s var(--ease-out-expo) forwards;
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }

  /* Loading Screen */
  .loading-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--tui-space-4);
  }

  .loading-indicator {
    position: relative;
    width: 56px;
    height: 56px;
  }

  .spinner {
    width: 100%;
    height: 100%;
    border: 2px solid var(--panel-active);
    border-top-color: var(--tui-info);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .spinner-glow {
    position: absolute;
    inset: -4px;
    border: 2px solid transparent;
    border-top-color: var(--tui-info);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    filter: blur(8px);
    opacity: 0.5;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-text {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: var(--tui-info);
    animation: blink 1.5s ease-in-out infinite;
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  /* Error State */
  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    gap: var(--tui-space-4);
  }

  .error-icon {
    width: 48px;
    height: 48px;
    color: var(--tui-danger);
  }

  .error-icon svg {
    width: 100%;
    height: 100%;
  }

  .error-title {
    font-family: var(--tui-font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: var(--tui-danger);
  }

  .error-msg {
    font-family: var(--tui-font-mono);
    font-size: 0.8125rem;
    color: var(--tui-text-muted);
    text-align: center;
    max-width: 400px;
  }

  .error .btn {
    margin-top: var(--tui-space-2);
    gap: var(--tui-space-2);
  }

  .error .btn svg {
    width: 16px;
    height: 16px;
  }

  /* Placeholder */
  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    gap: var(--tui-space-3);
  }

  .placeholder-icon {
    width: 64px;
    height: 64px;
    color: var(--tui-text-dim);
    margin-bottom: var(--tui-space-2);
  }

  .placeholder-icon svg {
    width: 100%;
    height: 100%;
  }

  .placeholder h2 {
    font-family: var(--tui-font-mono);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--tui-text-muted);
  }

  .placeholder-sub {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    color: var(--tui-text-dim);
    letter-spacing: 0.05em;
  }

  @media (max-width: 768px) {
    .main {
      padding: var(--tui-space-4);
    }
  }
</style>
