<!-- src/client/components/public/PrivacyPage.svelte -->
<script lang="ts">
  import { router } from '../../lib/router';
</script>

<div class="legal-page">
  <a href="/" class="back-link" onclick={(e) => { e.preventDefault(); router.navigate('/'); }}>
    ← Back to Home
  </a>

  <h1>Privacy Policy</h1>

  <section>
    <h2>Your data, your stuff</h2>
    <p>
      We use GitHub OAuth for sign-in, so we never see or store your password.
      We don't manage accounts — GitHub does.
    </p>
    <p>
      The only data we store is what you put into the app: your devices, specs, and network info.
      None of this is uniquely identifiable to you — it's just your gear.
    </p>
  </section>

  <section>
    <h2>Deleting your data</h2>
    <p>Request it, and it's gone automatically.</p>
  </section>

  <section>
    <h2>Exporting your data</h2>
    <p>Available anytime. Exports run on a schedule, so give it a moment.</p>
  </section>

  <section>
    <h2>Infrastructure</h2>
    <p>We use Convex for our backend. Your data lives there.</p>
  </section>

  <section>
    <h2>The bottom line</h2>
    <p>We don't sell your data. We don't share it. It's yours.</p>
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
    margin-bottom: var(--space-2);
  }
</style>
