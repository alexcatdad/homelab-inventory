<script lang="ts">
  import { useConvexClient } from 'convex-svelte';
  import { api } from '../../../convex/_generated/api';
  import { deleteConfirmDevice, deleting, closeDeleteConfirm, clearSelectedIfMatch, type Device } from '../lib/stores';

  const client = useConvexClient();

  let device: Device | null = $state(null);
  let isDeleting = $state(false);

  $effect(() => {
    const unsub1 = deleteConfirmDevice.subscribe(v => device = v);
    const unsub2 = deleting.subscribe(v => isDeleting = v);
    return () => {
      unsub1();
      unsub2();
    };
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && !isDeleting) closeDeleteConfirm();
  }

  function handleOverlayClick() {
    if (!isDeleting) closeDeleteConfirm();
  }

  async function handleDelete() {
    if (!device) return;

    deleting.set(true);
    try {
      await client.mutation(api.devices.remove, { id: device._id });
      clearSelectedIfMatch(device._id);
      closeDeleteConfirm();
    } catch (e) {
      console.error('Failed to delete device:', e);
    } finally {
      deleting.set(false);
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if device}
  <div class="overlay" onclick={handleOverlayClick} role="button" tabindex="-1" onkeydown={(e) => e.key === 'Enter' && handleOverlayClick()}>
    <div class="confirm-dialog tui-panel" onclick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" tabindex="-1" onkeydown={(e) => e.stopPropagation()}>

      <div class="dialog-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 9v4M12 17h.01"/>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
      </div>

      <h3 class="dialog-title">Delete Device</h3>

      <p class="dialog-message">
        Are you sure you want to delete <strong>{device.name}</strong>?
        This action cannot be undone.
      </p>

      <div class="dialog-actions">
        <button class="tui-btn tui-btn-ghost" onclick={closeDeleteConfirm} disabled={isDeleting}>
          Cancel
        </button>
        <button class="tui-btn tui-btn-danger" onclick={handleDelete} disabled={isDeleting}>
          {#if isDeleting}
            <span class="spinner"></span>
            Deleting...
          {:else}
            Delete
          {/if}
        </button>
      </div>

    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(8, 9, 12, 0.9);
    backdrop-filter: blur(8px);
    z-index: 1100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--tui-space-4);
  }

  .confirm-dialog {
    padding: var(--tui-space-6);
    max-width: 400px;
    width: 100%;
    animation: scaleIn 0.2s var(--ease-out-expo);
    text-align: center;
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .dialog-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto var(--tui-space-4);
    color: #ff6b6b;
  }

  .dialog-icon svg {
    width: 100%;
    height: 100%;
  }

  .dialog-title {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--tui-text-bright);
    margin: 0 0 var(--tui-space-3);
  }

  .dialog-message {
    font-size: 0.9375rem;
    color: var(--tui-text-muted);
    margin: 0 0 var(--tui-space-6);
    line-height: 1.5;
  }

  .dialog-message strong {
    color: var(--tui-fg);
    font-weight: 500;
  }

  .dialog-actions {
    display: flex;
    gap: var(--tui-space-3);
    justify-content: center;
  }

  .dialog-actions .tui-btn {
    min-width: 100px;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
