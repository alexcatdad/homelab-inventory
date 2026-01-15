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
    padding: var(--space-6);
    min-height: 100vh;
  }

  .back-link {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--signal-blue);
    text-decoration: none;
    margin-bottom: var(--space-6);
    letter-spacing: 0.05em;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  .page-header {
    text-align: center;
    margin-bottom: var(--space-6);
  }

  .page-header h1 {
    font-family: var(--font-mono);
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text-bright);
    margin-bottom: var(--space-2);
  }

  .subtitle {
    color: var(--text-muted);
    font-size: 0.9375rem;
  }

  .become-supporter {
    background: var(--panel);
    border: 1px solid var(--border-panel);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    text-align: center;
    margin-bottom: var(--space-6);
  }

  .become-supporter p {
    color: var(--text-secondary);
    margin-bottom: var(--space-4);
  }

  .support-options {
    display: flex;
    gap: var(--space-3);
    justify-content: center;
    flex-wrap: wrap;
  }

  .support-button {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: transform 0.2s ease;
  }

  .support-button:hover {
    transform: translateY(-1px);
  }

  .support-button.monthly {
    background: var(--signal-blue);
    color: var(--void);
  }

  .support-button.one-time {
    background: transparent;
    border: 1px solid var(--signal-blue);
    color: var(--signal-blue);
  }

  .supporters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-4);
  }

  .supporter-card {
    background: var(--panel);
    border: 1px solid var(--border-panel);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
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
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--text-primary);
  }

  .name {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .badge {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.05em;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
  }

  .badge.monthly {
    background: rgba(0, 200, 255, 0.1);
    color: var(--signal-blue);
  }

  .badge.one-time {
    background: rgba(168, 85, 247, 0.1);
    color: #a855f7;
  }

  .loading, .empty-state {
    text-align: center;
    padding: var(--space-6);
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.875rem;
  }
</style>
