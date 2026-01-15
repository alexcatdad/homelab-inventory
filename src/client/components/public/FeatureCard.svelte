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
  <div class="feature-icon">{icon}</div>
  <h3>{title}</h3>
  <p>{description}</p>
</div>

<style>
  .feature-card {
    background: var(--panel);
    border: 1px solid var(--border-panel);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    text-align: center;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .feature-card:hover {
    transform: translateY(-2px);
    border-color: var(--signal-blue);
  }

  .feature-icon {
    font-size: 2rem;
    margin-bottom: var(--space-3);
  }

  h3 {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text-primary);
    margin-bottom: var(--space-2);
  }

  p {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }
</style>
