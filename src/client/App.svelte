<script lang="ts">
  import { setupConvex } from 'convex-svelte';
  import { currentView } from './lib/stores';
  import Dashboard from './components/Dashboard.svelte';
  import DeviceGrid from './components/DeviceGrid.svelte';
  import DeviceDetail from './components/DeviceDetail.svelte';
  import DeviceForm from './components/DeviceForm.svelte';
  import DeleteConfirm from './components/DeleteConfirm.svelte';
  import ChatPanel from './components/chat/ChatPanel.svelte';
  import TopologyView from './components/TopologyView.svelte';
  import Header from './components/Header.svelte';

  // Initialize Convex client
  setupConvex(import.meta.env.VITE_CONVEX_URL);

  let view = $state('dashboard');

  // Subscribe to view store
  $effect(() => {
    const unsub = currentView.subscribe(v => view = v);
    return () => unsub();
  });
</script>

<div class="app">
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

  <main class="main">
    <div class="content fade-in">
      {#if view === 'dashboard'}
        <Dashboard />
      {:else if view === 'devices'}
        <DeviceGrid />
      {:else if view === 'topology'}
        <TopologyView />
      {/if}
    </div>
  </main>

  <DeviceDetail />
  <DeviceForm />
  <DeleteConfirm />
  <ChatPanel />
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main {
    flex: 1;
    padding: var(--space-6);
    max-width: 1600px;
    margin: 0 auto;
    width: 100%;
  }

  .content {
    opacity: 0;
    animation: fadeIn 0.4s var(--ease-out-expo) forwards;
  }

  @keyframes fadeIn {
    to { opacity: 1; }
  }

  /* Loading State */
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    gap: var(--space-4);
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
    border-top-color: var(--signal-blue);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .spinner-glow {
    position: absolute;
    inset: -4px;
    border: 2px solid transparent;
    border-top-color: var(--signal-blue);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    filter: blur(8px);
    opacity: 0.5;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-text {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: var(--signal-blue);
    animation: blink 1.5s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .loading-sub {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  /* Error State */
  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    gap: var(--space-4);
  }

  .error-icon {
    width: 48px;
    height: 48px;
    color: var(--signal-red);
  }

  .error-icon svg {
    width: 100%;
    height: 100%;
  }

  .error-title {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: var(--signal-red);
  }

  .error-msg {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--text-muted);
    text-align: center;
    max-width: 400px;
  }

  .error .btn {
    margin-top: var(--space-2);
    gap: var(--space-2);
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
    gap: var(--space-3);
  }

  .placeholder-icon {
    width: 64px;
    height: 64px;
    color: var(--text-dim);
    margin-bottom: var(--space-2);
  }

  .placeholder-icon svg {
    width: 100%;
    height: 100%;
  }

  .placeholder h2 {
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
  }

  .placeholder-sub {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-dim);
    letter-spacing: 0.05em;
  }

  @media (max-width: 768px) {
    .main {
      padding: var(--space-4);
    }
  }
</style>
