<!-- src/client/components/public/LandingPage.svelte -->
<script lang="ts">
  import { router } from '../../lib/router';
  import FeatureCard from './FeatureCard.svelte';

  const features = [
    { icon: '📊', title: 'DASHBOARD', description: 'See your entire homelab at a glance' },
    { icon: '🔗', title: 'NETWORK TOPOLOGY', description: 'Visualize how everything connects' },
    { icon: '💾', title: 'STORAGE OVERVIEW', description: 'Track drives across all devices' },
    { icon: '🤖', title: 'AI SPEC LOOKUP', description: 'Auto-fill device specifications' },
    { icon: '🌍', title: 'MULTI-LANGUAGE', description: 'English & Romanian (more coming)' },
    { icon: '📱', title: 'RESPONSIVE', description: 'Works on desktop, tablet, mobile' },
  ];

  function goToApp() {
    router.navigate('/app');
  }
</script>

<div class="landing">
  <!-- Hero Section -->
  <header class="hero">
    <div class="hero-content">
      <h1>A homelab inventory tool you'll actually enjoy using</h1>
      <p class="subtitle">Track your gear. Visualize your network. Stop forgetting what you have.</p>
      <button class="cta-button" onclick={goToApp}>
        Get Started — Free
      </button>
    </div>
  </header>

  <!-- Features Section -->
  <section class="features">
    <h2>Features</h2>
    <div class="feature-grid">
      {#each features as feature}
        <FeatureCard {...feature} />
      {/each}
    </div>
  </section>

  <!-- Story Section -->
  <section class="story">
    <h2>Why I Built This</h2>
    <p>
      I tried existing tools but couldn't find one that clicked for me.
      So I built something simple and beautiful that I actually wanted to use.
      Maybe you'll like it too.
    </p>
  </section>

  <!-- Supporters Section -->
  <section class="supporters-cta">
    <h2>Support the Project</h2>
    <p>
      This tool is completely free. If you find it useful, consider becoming a supporter
      to help keep it running.
    </p>
    <a href="/supporters" class="supporters-link">View Supporters →</a>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <nav class="footer-links">
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="/supporters">Supporters</a>
    </nav>
    <p class="footer-credit">Made for the homelab community</p>
  </footer>
</div>

<style>
  .landing {
    min-height: 100vh;
    background: var(--void);
  }

  /* Hero */
  .hero {
    padding: var(--space-8) var(--space-6);
    text-align: center;
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hero-content {
    max-width: 600px;
  }

  .hero h1 {
    font-family: var(--font-mono);
    font-size: clamp(1.5rem, 4vw, 2.5rem);
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--text-bright);
    margin-bottom: var(--space-4);
    line-height: 1.3;
  }

  .subtitle {
    font-size: 1.125rem;
    color: var(--text-secondary);
    margin-bottom: var(--space-6);
  }

  .cta-button {
    background: var(--signal-blue);
    color: var(--void);
    border: none;
    padding: var(--space-3) var(--space-6);
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 200, 255, 0.3);
  }

  /* Features */
  .features {
    padding: var(--space-8) var(--space-6);
    max-width: 1200px;
    margin: 0 auto;
  }

  .features h2 {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    letter-spacing: 0.15em;
    color: var(--signal-blue);
    text-align: center;
    margin-bottom: var(--space-6);
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space-4);
  }

  /* Story */
  .story {
    padding: var(--space-8) var(--space-6);
    max-width: 600px;
    margin: 0 auto;
    text-align: center;
  }

  .story h2 {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    letter-spacing: 0.15em;
    color: var(--signal-blue);
    margin-bottom: var(--space-4);
  }

  .story p {
    font-size: 1rem;
    color: var(--text-secondary);
    line-height: 1.7;
  }

  /* Supporters CTA */
  .supporters-cta {
    padding: var(--space-8) var(--space-6);
    text-align: center;
    background: var(--panel);
    border-top: 1px solid var(--border-panel);
    border-bottom: 1px solid var(--border-panel);
  }

  .supporters-cta h2 {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    letter-spacing: 0.15em;
    color: var(--text-primary);
    margin-bottom: var(--space-3);
  }

  .supporters-cta p {
    color: var(--text-secondary);
    margin-bottom: var(--space-4);
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }

  .supporters-link {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    color: var(--signal-blue);
    text-decoration: none;
    letter-spacing: 0.05em;
  }

  .supporters-link:hover {
    text-decoration: underline;
  }

  /* Footer */
  .footer {
    padding: var(--space-6);
    text-align: center;
  }

  .footer-links {
    display: flex;
    justify-content: center;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
    flex-wrap: wrap;
  }

  .footer-links a {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-muted);
    text-decoration: none;
    letter-spacing: 0.05em;
  }

  .footer-links a:hover {
    color: var(--signal-blue);
  }

  .footer-credit {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-dim);
    letter-spacing: 0.05em;
  }
</style>
