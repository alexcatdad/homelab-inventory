<!-- Demo Topology View - displays demo network topology data -->
<script lang="ts">
  import { getDemoTopology, demoDevices } from '../../lib/demoData';
  import TopologyGraph from '../TopologyGraph.svelte';
  import { t } from '../../lib/i18n';

  // Get demo topology data
  const topology = getDemoTopology();
  const nodes = topology.nodes;
  const edges = topology.edges;

  // Demo mode - no mutations allowed
  function handleAddConnection() {
    alert($t('demo.signInToEdit'));
  }

  function handleRemoveConnection() {
    alert($t('demo.signInToEdit'));
  }

  function handleNodeClick(node: { _id: string }) {
    console.log('Clicked demo node:', node._id);
    // Could show device detail
  }
</script>

<div class="topology-view">
  <div class="topology-header">
    <div class="header-left">
      <h2>NETWORK TOPOLOGY</h2>
      <span class="demo-badge">DEMO</span>
      <span class="device-count">{nodes.length} devices</span>
    </div>
    <div class="header-actions">
      <span class="demo-indicator">
        <span class="demo-dot"></span>
        DEMO DATA
      </span>
    </div>
  </div>

  {#if nodes.length === 0}
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="5" r="3"/>
        <circle cx="5" cy="19" r="3"/>
        <circle cx="19" cy="19" r="3"/>
        <path d="M12 8v4M8.5 14.5L5.5 16.5M15.5 14.5l3 2"/>
      </svg>
      <h3>No devices in topology</h3>
      <p>Demo data will appear here.</p>
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
  {#if nodes.length > 0}
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
        <span class="stat-value">{nodes.filter(n => n.type === 'IoT').length}</span>
        <span class="stat-label">IoT</span>
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
    height: calc(100vh - 200px);
    min-height: 400px;
    background: var(--tui-panel);
    border: 1px solid var(--tui-border);
    border-radius: var(--tui-radius-lg);
    overflow: hidden;
  }

  .topology-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--tui-space-4) var(--tui-space-5);
    border-bottom: 1px solid var(--tui-border);
    background: var(--tui-panel-deep);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--tui-space-3);
  }

  .header-left h2 {
    font-family: var(--tui-font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--tui-text-bright);
    margin: 0;
  }

  .demo-badge {
    font-family: var(--tui-font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--tui-warning);
    padding: 2px 6px;
    background: rgba(255, 176, 32, 0.15);
    border: 1px solid rgba(255, 176, 32, 0.3);
    border-radius: var(--tui-radius-sm);
  }

  .device-count {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    color: var(--tui-text-muted);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--tui-space-3);
  }

  .demo-indicator {
    display: flex;
    align-items: center;
    gap: var(--tui-space-2);
    font-family: var(--tui-font-mono);
    font-size: 0.625rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: var(--tui-warning);
    padding: var(--tui-space-1) var(--tui-space-2);
    background: rgba(255, 176, 32, 0.1);
    border-radius: var(--tui-radius-sm);
  }

  .demo-dot {
    width: 6px;
    height: 6px;
    background: var(--tui-warning);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--tui-space-3);
    color: var(--tui-text-dim);
  }

  .empty-state svg {
    width: 48px;
    height: 48px;
    opacity: 0.5;
  }

  .empty-state h3 {
    font-family: var(--tui-font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--tui-text-muted);
    margin: 0;
  }

  .empty-state p {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    color: var(--tui-text-dim);
    margin: 0;
  }

  .stats-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--tui-space-4);
    padding: var(--tui-space-3) var(--tui-space-5);
    border-top: 1px solid var(--tui-border);
    background: var(--tui-panel-deep);
  }

  .stat {
    display: flex;
    align-items: baseline;
    gap: var(--tui-space-2);
  }

  .stat-value {
    font-family: var(--tui-font-mono);
    font-size: 1rem;
    font-weight: 600;
    color: var(--tui-warning);
  }

  .stat-label {
    font-family: var(--tui-font-mono);
    font-size: 0.625rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: var(--tui-text-dim);
  }

  .stat-divider {
    width: 1px;
    height: 20px;
    background: var(--tui-border);
  }

  @media (max-width: 768px) {
    .topology-header {
      flex-direction: column;
      gap: var(--tui-space-3);
      align-items: flex-start;
    }

    .stats-bar {
      flex-wrap: wrap;
      gap: var(--tui-space-3);
    }
  }

  @media (max-width: 480px) {
    .topology-view {
      height: calc(100vh - 250px);
      min-height: 300px;
    }

    .header-left {
      flex-wrap: wrap;
    }

    .header-left h2 {
      font-size: 0.75rem;
    }
  }
</style>
