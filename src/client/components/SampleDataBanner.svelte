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
    border: 1px solid var(--signal-blue);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
    flex-wrap: wrap;
  }

  .banner-text {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--signal-blue);
  }

  .clear-button {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    padding: var(--space-2) var(--space-3);
    background: transparent;
    border: 1px solid var(--signal-blue);
    color: var(--signal-blue);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .clear-button:hover:not(:disabled) {
    background: var(--signal-blue);
    color: var(--void);
  }

  .clear-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
