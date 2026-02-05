<script lang="ts">
  import { onMount } from 'svelte';
  import type { TopologyNode, TopologyEdge, DeviceType } from '../../shared/types';

  interface Props {
    nodes: TopologyNode[];
    edges: TopologyEdge[];
    onAddConnection?: (fromId: number, toId: number) => void;
    onRemoveConnection?: (id: number) => void;
    onNodeClick?: (node: TopologyNode) => void;
  }

  let { nodes, edges, onAddConnection, onRemoveConnection, onNodeClick }: Props = $props();

  let svgElement: SVGSVGElement;
  let width = $state(800);
  let height = $state(600);
  let initialized = $state(false);

  // Node positions stored as plain object to avoid reactivity issues
  let positions: Record<number, { x: number; y: number }> = {};

  // Connection mode state
  let connectingFrom = $state<number | null>(null);
  let mousePos = $state({ x: 0, y: 0 });

  // Device type colors
  const typeColors: Record<DeviceType, string> = {
    'Network': '#00a8ff',
    'Server': '#00d26a',
    'Desktop': '#9b59b6',
    'Laptop': '#f39c12',
    'Component': '#95a5a6',
    'IoT': '#e74c3c',
  };

  // Initialize positions for nodes (called once)
  function initPositions() {
    if (initialized || nodes.length === 0) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    // Find network device for center
    const networkNode = nodes.find(n => n.type === 'Network');
    const otherNodes = nodes.filter(n => n.type !== 'Network');

    if (networkNode) {
      positions[networkNode.id] = { x: centerX, y: centerY };
    }

    otherNodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / otherNodes.length - Math.PI / 2;
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    initialized = true;
  }

  // Get position for a node
  function getPos(nodeId: number): { x: number; y: number } {
    return positions[nodeId] ?? { x: width / 2, y: height / 2 };
  }

  // Handle node drag
  function handleDragStart(e: MouseEvent, nodeId: number) {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...getPos(nodeId) };

    function onMouseMove(e: MouseEvent) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      positions[nodeId] = {
        x: startPos.x + dx,
        y: startPos.y + dy,
      };
      // Force re-render
      positions = { ...positions };
    }

    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // Handle connection mode
  function startConnect(e: MouseEvent, nodeId: number) {
    e.stopPropagation();
    connectingFrom = nodeId;
  }

  function finishConnect(e: MouseEvent, nodeId: number) {
    e.stopPropagation();
    if (connectingFrom && connectingFrom !== nodeId && onAddConnection) {
      onAddConnection(connectingFrom, nodeId);
    }
    connectingFrom = null;
  }

  function cancelConnect() {
    connectingFrom = null;
  }

  function handleSvgMouseMove(e: MouseEvent) {
    if (connectingFrom && svgElement) {
      const rect = svgElement.getBoundingClientRect();
      mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  }

  // Update dimensions on resize
  function updateDimensions() {
    if (svgElement?.parentElement) {
      const newWidth = svgElement.parentElement.clientWidth;
      const newHeight = svgElement.parentElement.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        width = newWidth;
        height = newHeight;
      }
    }
  }

  onMount(() => {
    updateDimensions();
    // Small delay to ensure proper dimensions
    setTimeout(() => {
      updateDimensions();
      initPositions();
    }, 50);

    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  });

  // Init positions when nodes arrive (only once)
  $effect(() => {
    if (nodes.length > 0 && width > 0 && !initialized) {
      initPositions();
    }
  });
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && cancelConnect()} />

<div class="topology-container">
  <svg
    bind:this={svgElement}
    viewBox="0 0 {width} {height}"
    onmousemove={handleSvgMouseMove}
    onclick={() => cancelConnect()}
    role="img"
    aria-label="Network topology graph"
  >
    <!-- Grid pattern -->
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--tui-border)" stroke-width="0.5" opacity="0.3"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)"/>

    <!-- Edges -->
    <g class="edges">
      {#each edges as edge (edge.source + '-' + edge.target)}
        {@const sourcePos = getPos(edge.source)}
        {@const targetPos = getPos(edge.target)}
        <line
          x1={sourcePos.x}
          y1={sourcePos.y}
          x2={targetPos.x}
          y2={targetPos.y}
          class="edge"
          class:wifi={edge.type === 'wifi'}
        />
      {/each}
    </g>

    <!-- Connection preview line -->
    {#if connectingFrom}
      {@const fromPos = getPos(connectingFrom)}
      <line
        x1={fromPos.x}
        y1={fromPos.y}
        x2={mousePos.x}
        y2={mousePos.y}
        class="edge preview"
      />
    {/if}

    <!-- Nodes -->
    <g class="nodes">
      {#each nodes as node (node.id)}
        {@const pos = getPos(node.id)}
        <g
          class="node"
          class:network={node.type === 'Network'}
          class:connecting={connectingFrom === node.id}
          transform="translate({pos.x}, {pos.y})"
          onmousedown={(e) => handleDragStart(e, node.id)}
          onclick={(e) => { e.stopPropagation(); onNodeClick?.(node); }}
          role="button"
          tabindex="0"
          aria-label={node.name}
        >
          <!-- Node circle -->
          <circle
            r={node.type === 'Network' ? 35 : 28}
            fill="var(--tui-panel)"
            stroke={typeColors[node.type]}
            stroke-width="2"
            class="node-circle"
          />

          <!-- Type icon -->
          <text
            class="node-icon"
            text-anchor="middle"
            dominant-baseline="central"
            fill={typeColors[node.type]}
          >
            {#if node.type === 'Network'}
              ⬡
            {:else if node.type === 'Server'}
              ▣
            {:else if node.type === 'Desktop'}
              ▢
            {:else if node.type === 'Laptop'}
              ▱
            {:else}
              ●
            {/if}
          </text>

          <!-- Node label -->
          <text
            y={node.type === 'Network' ? 50 : 42}
            class="node-label"
            text-anchor="middle"
          >
            {node.name}
          </text>

          <!-- Connect button -->
          <g
            class="connect-btn"
            transform="translate(20, -20)"
            onclick={(e) => connectingFrom ? finishConnect(e, node.id) : startConnect(e, node.id)}
            role="button"
            tabindex="0"
            aria-label="Connect"
          >
            <circle r="10" fill="var(--panel-hover)" stroke="var(--tui-border)" stroke-width="1"/>
            <text text-anchor="middle" dominant-baseline="central" fill="var(--tui-text-muted)" font-size="12">+</text>
          </g>
        </g>
      {/each}
    </g>
  </svg>

  <!-- Legend -->
  <div class="legend">
    <span class="legend-title">DEVICE TYPES</span>
    {#each Object.entries(typeColors) as [type, color]}
      <span class="legend-item">
        <span class="legend-dot" style="background: {color}"></span>
        {type}
      </span>
    {/each}
  </div>

  <!-- Instructions -->
  {#if connectingFrom}
    <div class="instruction">
      Click another device to connect, or press ESC to cancel
    </div>
  {:else}
    <div class="instruction">
      Drag to move • Click + to connect devices
    </div>
  {/if}
</div>

<style>
  .topology-container {
    width: 100%;
    height: 100%;
    min-height: 500px;
    position: relative;
    background: var(--tui-panel-deep);
    border-radius: var(--tui-radius-lg);
    border: 1px solid var(--tui-border);
    overflow: hidden;
  }

  svg {
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  svg:active {
    cursor: grabbing;
  }

  .edge {
    stroke: var(--tui-info);
    stroke-width: 2;
    opacity: 0.6;
  }

  .edge.wifi {
    stroke-dasharray: 5, 5;
    stroke: var(--signal-cyan);
  }

  .edge.preview {
    stroke: var(--tui-success);
    stroke-dasharray: 8, 4;
    opacity: 0.8;
  }

  .node {
    cursor: pointer;
  }

  .node:hover .node-circle {
    filter: drop-shadow(0 0 8px currentColor);
  }

  .node.network .node-circle {
    stroke-width: 3;
  }

  .node.connecting .node-circle {
    stroke: var(--tui-success);
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .node-icon {
    font-size: 18px;
    pointer-events: none;
  }

  .node.network .node-icon {
    font-size: 22px;
  }

  .node-label {
    font-family: var(--tui-font-mono);
    font-size: 11px;
    font-weight: 500;
    fill: var(--tui-text-muted);
    pointer-events: none;
  }

  .connect-btn {
    opacity: 0;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .node:hover .connect-btn {
    opacity: 1;
  }

  .connect-btn:hover circle {
    fill: var(--tui-info);
  }

  .connect-btn:hover text {
    fill: var(--tui-text-bright);
  }

  .legend {
    position: absolute;
    top: var(--tui-space-4);
    left: var(--tui-space-4);
    display: flex;
    flex-direction: column;
    gap: var(--tui-space-2);
    padding: var(--tui-space-3);
    background: var(--tui-panel);
    border: 1px solid var(--tui-border);
    border-radius: var(--tui-radius-md);
  }

  .legend-title {
    font-family: var(--tui-font-mono);
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--tui-text-dim);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: var(--tui-space-2);
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    color: var(--tui-text-muted);
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .instruction {
    position: absolute;
    bottom: var(--tui-space-4);
    left: 50%;
    transform: translateX(-50%);
    padding: var(--tui-space-2) var(--tui-space-4);
    background: var(--tui-panel);
    border: 1px solid var(--tui-border);
    border-radius: var(--tui-radius-md);
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    color: var(--tui-text-muted);
  }
</style>
