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
    background: var(--panel);
    border: 1px solid var(--border-panel);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    max-width: 400px;
    text-align: center;
  }

  h2 {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    color: var(--text-bright);
    margin-bottom: var(--space-3);
  }

  p {
    color: var(--text-secondary);
    margin-bottom: var(--space-3);
  }

  .price {
    font-family: var(--font-mono);
    font-size: 1.5rem;
    color: var(--signal-blue);
    font-weight: 600;
  }

  .close-button {
    margin-top: var(--space-4);
    padding: var(--space-2) var(--space-4);
    background: transparent;
    border: 1px solid var(--border-panel);
    color: var(--text-secondary);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-family: var(--font-mono);
  }

  .close-button:hover {
    border-color: var(--signal-blue);
    color: var(--signal-blue);
  }
</style>
