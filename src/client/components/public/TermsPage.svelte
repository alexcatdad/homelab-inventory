<!-- src/client/components/public/TermsPage.svelte -->
<script lang="ts">
  import { router } from '../../lib/router';
</script>

<div class="legal-page">
  <a href="/" class="back-link" onclick={(e) => { e.preventDefault(); router.navigate('/'); }}>
    ← Back to Home
  </a>

  <h1>Terms of Service</h1>

  <section>
    <h2>The basics</h2>
    <p>Don't spam. Don't hack. Don't be a jerk.</p>
  </section>

  <section>
    <h2>No guarantees</h2>
    <p>
      This is a passion project. Things might break. We'll do our best, but no promises.
    </p>
  </section>

  <section>
    <h2>No refunds</h2>
    <p>
      Supporter payments are donations to help keep the project alive.
      No refunds, but you can cancel anytime.
    </p>
  </section>

  <section>
    <h2>We're all figuring this out</h2>
    <p>
      We're not lawyers, just homelab nerds sharing a tool. Be cool and we'll be cool.
    </p>
  </section>
</div>

<style>
  .legal-page {
    max-width: 700px;
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

  h1 {
    font-family: var(--font-mono);
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text-bright);
    margin-bottom: var(--space-6);
  }

  section {
    margin-bottom: var(--space-6);
  }

  h2 {
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--signal-blue);
    margin-bottom: var(--space-2);
  }

  p {
    color: var(--text-secondary);
    line-height: 1.7;
  }
</style>
