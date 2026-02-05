<!-- src/client/components/public/FeatureCard.svelte -->
<script lang="ts">
  interface Props {
    icon: string;
    title: string;
    description: string;
  }

  let { icon, title, description }: Props = $props();
</script>

<div class="feature-card">
  <div class="feature-icon" aria-hidden="true">{icon}</div>
  <h3>{title}</h3>
  <p>{description}</p>
</div>

<style>
  .feature-card {
    background: var(--tui-panel);
    border: 1px solid var(--tui-border);
    border-radius: var(--tui-radius-lg);
    padding: var(--tui-space-5);
    text-align: center;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .feature-card:hover {
    transform: translateY(-2px);
    border-color: var(--tui-info);
  }

  .feature-icon {
    font-size: 2rem;
    margin-bottom: var(--tui-space-3);
  }

  h3 {
    font-family: var(--tui-font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--tui-fg);
    margin-bottom: var(--tui-space-2);
  }

  p {
    font-size: 0.8125rem;
    color: var(--tui-text-muted);
    line-height: 1.5;
  }
</style>
