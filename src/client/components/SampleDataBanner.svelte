<!-- src/client/components/SampleDataBanner.svelte -->
<script lang="ts">
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '../../../convex/_generated/api';

  const client = useConvexClient();
  const hasSampleData = useQuery(api.sampleData.hasSampleData, {});

  let isClearing = $state(false);

  async function clearSamples() {
    isClearing = true;
    try {
      await client.mutation(api.sampleData.clearSampleData, {});
    } catch (e) {
      console.error('Failed to clear sample data:', e);
    } finally {
      isClearing = false;
    }
  }
</script>

{#if hasSampleData.data}
  <div class="sample-banner">
    <span class="banner-text">
      You're viewing sample data. Explore, then clear it when ready.
    </span>
    <button
      type="button"
      class="clear-button"
      onclick={clearSamples}
      disabled={isClearing}
    >
      {isClearing ? 'Clearing...' : 'Clear Sample Data'}
    </button>
  </div>
{/if}

<style>
  .sample-banner {
    background: rgba(0, 200, 255, 0.1);
    border: 1px solid var(--tui-info);
    border-radius: var(--tui-radius-md);
    padding: var(--tui-space-3) var(--tui-space-4);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--tui-space-4);
    margin-bottom: var(--tui-space-4);
    flex-wrap: wrap;
  }

  .banner-text {
    font-family: var(--tui-font-mono);
    font-size: 0.8125rem;
    color: var(--tui-info);
  }

  .clear-button {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    padding: var(--tui-space-2) var(--tui-space-3);
    background: transparent;
    border: 1px solid var(--tui-info);
    color: var(--tui-info);
    border-radius: var(--tui-radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .clear-button:hover:not(:disabled) {
    background: var(--tui-info);
    color: var(--tui-bg);
  }

  .clear-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
