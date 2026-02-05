<!-- src/client/components/public/PaymentModal.svelte -->
<script lang="ts">
  interface Props {
    type: 'monthly' | 'one-time';
    onClose: () => void;
  }

  let { type, onClose }: Props = $props();

  // TODO: Implement Stripe Checkout redirect
  // 1. Call Convex action to create Stripe Checkout session
  // 2. Redirect to Stripe Checkout URL
</script>

<div class="modal-overlay" onclick={onClose} role="dialog" aria-modal="true" aria-labelledby="payment-title">
  <div class="modal-content" onclick={(e) => e.stopPropagation()}>
    <h2 id="payment-title">{type === 'monthly' ? 'Monthly Support' : 'One-Time Donation'}</h2>
    <p>
      Stripe payment integration coming soon!
    </p>
    <p class="price">
      {type === 'monthly' ? '$5/month' : '$5 one-time'}
    </p>
    <button type="button" class="close-button" onclick={onClose}>Close</button>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: var(--tui-panel);
    border: 1px solid var(--tui-border);
    border-radius: var(--tui-radius-lg);
    padding: var(--tui-space-6);
    max-width: 400px;
    text-align: center;
  }

  h2 {
    font-family: var(--tui-font-mono);
    font-size: 1.25rem;
    color: var(--tui-text-bright);
    margin-bottom: var(--tui-space-3);
  }

  p {
    color: var(--tui-text-muted);
    margin-bottom: var(--tui-space-3);
  }

  .price {
    font-family: var(--tui-font-mono);
    font-size: 1.5rem;
    color: var(--tui-info);
    font-weight: 600;
  }

  .close-button {
    margin-top: var(--tui-space-4);
    padding: var(--tui-space-2) var(--tui-space-4);
    background: transparent;
    border: 1px solid var(--tui-border);
    color: var(--tui-text-muted);
    border-radius: var(--tui-radius-md);
    cursor: pointer;
    font-family: var(--tui-font-mono);
  }

  .close-button:hover {
    border-color: var(--tui-info);
    color: var(--tui-info);
  }
</style>
