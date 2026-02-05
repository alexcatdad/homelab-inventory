<!-- src/client/components/public/SupportersPage.svelte -->
<script lang="ts">
  import { router } from '../../lib/router';
  import { useQuery } from 'convex-svelte';
  import { api } from '../../../../convex/_generated/api';

  const supporters = useQuery(api.supporters.listActive, {});
</script>

<div class="supporters-page">
  <a href="/" class="back-link" onclick={(e) => { e.preventDefault(); router.navigate('/'); }}>
    &larr; Back to Home
  </a>

  <header class="page-header">
    <h1>Supporters</h1>
    <p class="subtitle">These cool people keep the project alive</p>
  </header>

  <section class="become-supporter" aria-labelledby="become-supporter-heading">
    <h2 id="become-supporter-heading" class="visually-hidden">Support Options</h2>
    <p>Want to support the project?</p>
    <div class="support-options">
      <a href="#monthly" class="support-button monthly" onclick={(e) => e.preventDefault()}>
        Become a Monthly Supporter
      </a>
      <a href="#one-time" class="support-button one-time" onclick={(e) => e.preventDefault()}>
        Make a One-Time Donation
      </a>
    </div>
  </section>

  <section class="supporters-list" aria-labelledby="supporters-list-heading">
    <h2 id="supporters-list-heading" class="visually-hidden">Supporters List</h2>
    {#if supporters.isLoading}
      <div class="loading">Loading supporters...</div>
    {:else if supporters.data && supporters.data.length > 0}
      <div class="supporters-grid">
        {#each supporters.data as supporter}
          <div class="supporter-card">
            {#if supporter.avatarUrl}
              <img src={supporter.avatarUrl} alt="{supporter.displayName}" class="avatar" />
            {:else}
              <div class="avatar placeholder">
                {supporter.displayName.charAt(0).toUpperCase()}
              </div>
            {/if}
            <span class="name">{supporter.displayName}</span>
            <span class="badge {supporter.type}">
              {supporter.type === 'monthly' ? 'Monthly' : 'One-time'}
            </span>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <p>Be the first supporter!</p>
      </div>
    {/if}
  </section>
</div>

<style>
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .supporters-page {
    max-width: 900px;
    margin: 0 auto;
    padding: var(--tui-space-6);
    min-height: 100vh;
  }

  .back-link {
    display: inline-block;
    font-family: var(--tui-font-mono);
    font-size: 0.8125rem;
    color: var(--tui-info);
    text-decoration: none;
    margin-bottom: var(--tui-space-6);
    letter-spacing: 0.05em;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  .page-header {
    text-align: center;
    margin-bottom: var(--tui-space-6);
  }

  .page-header h1 {
    font-family: var(--tui-font-mono);
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--tui-text-bright);
    margin-bottom: var(--tui-space-2);
  }

  .subtitle {
    color: var(--tui-text-muted);
    font-size: 0.9375rem;
  }

  .become-supporter {
    background: var(--tui-panel);
    border: 1px solid var(--tui-border);
    border-radius: var(--tui-radius-lg);
    padding: var(--tui-space-5);
    text-align: center;
    margin-bottom: var(--tui-space-6);
  }

  .become-supporter p {
    color: var(--tui-text-muted);
    margin-bottom: var(--tui-space-4);
  }

  .support-options {
    display: flex;
    gap: var(--tui-space-3);
    justify-content: center;
    flex-wrap: wrap;
  }

  .support-button {
    font-family: var(--tui-font-mono);
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    padding: var(--tui-space-2) var(--tui-space-4);
    border-radius: var(--tui-radius-md);
    text-decoration: none;
    transition: transform 0.2s ease;
  }

  .support-button:hover {
    transform: translateY(-1px);
  }

  .support-button.monthly {
    background: var(--tui-info);
    color: var(--tui-bg);
  }

  .support-button.one-time {
    background: transparent;
    border: 1px solid var(--tui-info);
    color: var(--tui-info);
  }

  .supporters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--tui-space-4);
  }

  .supporter-card {
    background: var(--tui-panel);
    border: 1px solid var(--tui-border);
    border-radius: var(--tui-radius-lg);
    padding: var(--tui-space-4);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--tui-space-2);
  }

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar.placeholder {
    background: var(--panel-active);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--tui-font-mono);
    font-weight: 600;
    color: var(--tui-fg);
  }

  .name {
    font-family: var(--tui-font-mono);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--tui-fg);
  }

  .badge {
    font-family: var(--tui-font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.05em;
    padding: var(--tui-space-1) var(--tui-space-2);
    border-radius: var(--tui-radius-sm);
  }

  .badge.monthly {
    background: rgba(0, 200, 255, 0.1);
    color: var(--tui-info);
  }

  .badge.one-time {
    background: rgba(168, 85, 247, 0.1);
    color: #a855f7;
  }

  .loading, .empty-state {
    text-align: center;
    padding: var(--tui-space-6);
    color: var(--tui-text-muted);
    font-family: var(--tui-font-mono);
    font-size: 0.875rem;
  }
</style>
