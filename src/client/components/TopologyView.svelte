<script lang="ts">
  import { onMount } from 'svelte';
  import TopologyGraph from './TopologyGraph.svelte';
  import type { TopologyNode, TopologyEdge, TopologyResponse } from '../../shared/types';
  import { selectedDevice } from '../lib/stores';

  let nodes = $state<TopologyNode[]>([]);
  let edges = $state<TopologyEdge[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function fetchTopology() {
    loading = true;
    error = null;
    try {
      const res = await fetch('/api/topology');
      if (!res.ok) throw new Error('Failed to fetch topology');
      const data: TopologyResponse = await res.json();
      nodes = data.nodes;
      edges = data.edges;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }

  async function handleAddConnection(fromId: number, toId: number) {
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_device_id: fromId, to_device_id: toId }),
      });
      if (!res.ok) throw new Error('Failed to add connection');
      await fetchTopology();
    } catch (e) {
      console.error('Failed to add connection:', e);
    }
  }

  async function handleRemoveConnection(id: number) {
    try {
      const res = await fetch(`/api/connections/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove connection');
      await fetchTopology();
    } catch (e) {
      console.error('Failed to remove connection:', e);
    }
  }

  function handleNodeClick(node: TopologyNode) {
    // Open device detail panel
    selectedDevice.set(node.id);
  }

  // Fetch on mount
  onMount(() => {
    fetchTopology();
  });
</script>

<div class="topology-view">
  <div class="topology-header">
    <div class="header-left">
      <h2>NETWORK TOPOLOGY</h2>
      <span class="wip-badge">WIP</span>
      <span class="device-count">{nodes.length} devices</span>
    </div>
    <div class="header-actions">
      <button class="btn btn-secondary" onclick={fetchTopology} disabled={loading}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 4v6h6M23 20v-6h-6"/>
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
        </svg>
        Refresh
      </button>
    </div>
  </div>

  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Loading topology...</span>
    </div>
  {:else if error}
    <div class="error-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4M12 16h.01"/>
      </svg>
      <span>{error}</span>
      <button class="btn btn-secondary" onclick={fetchTopology}>Retry</button>
    </div>
  {:else if nodes.length === 0}
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="5" r="3"/>
        <circle cx="5" cy="19" r="3"/>
        <circle cx="19" cy="19" r="3"/>
        <path d="M12 8v4M8.5 14.5L5.5 16.5M15.5 14.5l3 2"/>
      </svg>
      <h3>No devices in topology</h3>
      <p>Add devices to your inventory and connect them to see the network topology.</p>
    </div>
  {:else}
    <TopologyGraph
      {nodes}
      {edges}
      onAddConnection={handleAddConnection}
      onRemoveConnection={handleRemoveConnection}
      onNodeClick={handleNodeClick}
    />
  {/if}

  <!-- Connection stats -->
  {#if !loading && nodes.length > 0}
    <div class="stats-bar">
      <div class="stat">
        <span class="stat-value">{nodes.filter(n => n.type === 'Network').length}</span>
        <span class="stat-label">Network</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat">
        <span class="stat-value">{nodes.filter(n => n.type === 'Server').length}</span>
        <span class="stat-label">Servers</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat">
        <span class="stat-value">{edges.length}</span>
        <span class="stat-label">Connections</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .topology-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    height: calc(100vh - 200px);
    min-height: 500px;
  }

  .topology-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
  }

  h2 {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text-bright);
    margin: 0;
  }

  .wip-badge {
    padding: 2px 8px;
    background: var(--signal-amber);
    color: var(--panel-deep);
    font-family: var(--font-mono);
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    border-radius: var(--radius-sm);
  }

  .device-count {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .header-actions {
    display: flex;
    gap: var(--space-2);
  }

  .btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 500;
    transition: all var(--duration-fast) var(--ease-out-quad);
  }

  .btn svg {
    width: 14px;
    height: 14px;
  }

  .btn-secondary {
    background: var(--panel-hover);
    border: 1px solid var(--border-dim);
    color: var(--text-secondary);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--panel-active);
    border-color: var(--signal-blue);
    color: var(--signal-blue);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading-state,
  .error-state,
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    color: var(--text-muted);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 2px solid var(--panel-active);
    border-top-color: var(--signal-blue);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-state svg,
  .empty-state svg {
    width: 48px;
    height: 48px;
    color: var(--text-dim);
  }

  .error-state svg {
    color: var(--signal-red);
  }

  .empty-state h3 {
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 0;
  }

  .empty-state p {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--text-dim);
    text-align: center;
    max-width: 300px;
    margin: 0;
  }

  .stats-bar {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-4);
    background: var(--panel);
    border: 1px solid var(--border-dim);
    border-radius: var(--radius-md);
  }

  .stat {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  .stat-value {
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 600;
    color: var(--signal-blue);
  }

  .stat-label {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    text-transform: uppercase;
  }

  .stat-divider {
    width: 1px;
    height: 20px;
    background: var(--border-dim);
  }
</style>
