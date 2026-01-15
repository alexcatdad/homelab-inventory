<script lang="ts">
  import { t } from '../lib/i18n';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  let hasError = $state(false);
  let errorMessage = $state('');
  let errorStack = $state('');

  // Handle uncaught errors
  function handleError(event: ErrorEvent) {
    hasError = true;
    errorMessage = event.message || 'An unexpected error occurred';
    errorStack = event.error?.stack || '';
    event.preventDefault();
  }

  // Handle unhandled promise rejections
  function handleRejection(event: PromiseRejectionEvent) {
    hasError = true;
    errorMessage = event.reason?.message || 'An unhandled promise rejection occurred';
    errorStack = event.reason?.stack || '';
    event.preventDefault();
  }

  function reset() {
    hasError = false;
    errorMessage = '';
    errorStack = '';
  }

  function reload() {
    window.location.reload();
  }

  // Set up global error handlers
  $effect(() => {
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  });
</script>

{#if hasError}
  <div class="error-boundary" role="alert" aria-live="assertive">
    <div class="error-container">
      <div class="error-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>

      <h1 class="error-title">{$t('common.error')}</h1>
      <p class="error-message">{errorMessage}</p>

      {#if import.meta.env.DEV && errorStack}
        <details class="error-details">
          <summary>Stack Trace</summary>
          <pre>{errorStack}</pre>
        </details>
      {/if}

      <div class="error-actions">
        <button class="btn btn-primary" onclick={reload}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Reload Page
        </button>
        <button class="btn btn-ghost" onclick={reset}>
          Try Again
        </button>
      </div>
    </div>
  </div>
{:else}
  {@render children?.()}
{/if}

<style>
  .error-boundary {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-6);
    background: var(--void);
  }

  .error-container {
    max-width: 480px;
    text-align: center;
    background: var(--panel);
    border: 1px solid var(--border-panel);
    border-radius: var(--radius-lg);
    padding: var(--space-8);
  }

  .error-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto var(--space-4);
    color: var(--signal-red);
    filter: drop-shadow(0 0 12px rgba(255, 71, 87, 0.4));
  }

  .error-icon svg {
    width: 100%;
    height: 100%;
  }

  .error-title {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--signal-red);
    margin-bottom: var(--space-3);
  }

  .error-message {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: var(--space-6);
    line-height: 1.6;
  }

  .error-details {
    text-align: left;
    margin-bottom: var(--space-6);
    background: var(--panel-deep);
    border: 1px solid var(--border-dim);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .error-details summary {
    padding: var(--space-3);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    border-bottom: 1px solid var(--border-dim);
  }

  .error-details pre {
    padding: var(--space-3);
    font-size: 0.75rem;
    color: var(--text-muted);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 200px;
    overflow: auto;
  }

  .error-actions {
    display: flex;
    gap: var(--space-3);
    justify-content: center;
    flex-wrap: wrap;
  }

  .error-actions .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }

  .error-actions .btn svg {
    width: 16px;
    height: 16px;
  }
</style>
