<script lang="ts">
  import { useConvexClient } from "convex-svelte";
  import { storeVerifier } from "../lib/authStore";
  import { t } from "../lib/i18n";
  import LanguageSwitcher from "./LanguageSwitcher.svelte";

  const client = useConvexClient();
  let isSigningIn = $state(false);
  let hasError = $state(false);

  async function signInWithGitHub() {
    isSigningIn = true;
    hasError = false;

    try {
      // Call the signIn action to get OAuth redirect URL
      // Using string action reference as expected by @convex-dev/auth
      // Use origin + base path for GitHub Pages compatibility
      const basePath = import.meta.env.BASE_URL || '/';
      const redirectUrl = window.location.origin + basePath;

      const result = await client.action("auth:signIn" as any, {
        provider: "github",
        params: {
          redirectTo: redirectUrl,
        },
      });

      // If we get a redirect URL, store the verifier and navigate
      if (result.redirect) {
        // Store the verifier for later use in the callback
        if (result.verifier) {
          storeVerifier(result.verifier);
        }
        window.location.href = result.redirect;
      } else if (result.tokens) {
        // Already signed in, reload to check auth state
        window.location.reload();
      }
    } catch (err) {
      console.error("Sign-in error:", err);
      hasError = true;
      isSigningIn = false;
    }
  }
</script>

<div class="login-page">
  <div class="language-corner">
    <LanguageSwitcher />
  </div>

  <div class="login-container">
    <div class="login-header">
      <div class="logo">
        <svg
          viewBox="0 0 24 24"
          width="48"
          height="48"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
          <circle cx="7" cy="10" r="1.5" fill="currentColor" />
          <circle cx="12" cy="10" r="1.5" fill="currentColor" />
          <circle cx="17" cy="10" r="1.5" fill="currentColor" />
        </svg>
      </div>
      <h1>{$t('login.title')}</h1>
      <p class="subtitle">{$t('login.subtitle')}</p>
    </div>

    <div class="login-card">
      <h2>{$t('login.welcome')}</h2>
      <p>{$t('login.signInPrompt')}</p>

      {#if hasError}
        <div class="error-message">{$t('login.signInError')}</div>
      {/if}

      <button
        class="github-button"
        onclick={signInWithGitHub}
        disabled={isSigningIn}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path
            d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
          />
        </svg>
        {isSigningIn ? $t('login.signingIn') : $t('login.continueWithGitHub')}
      </button>
    </div>

    <p class="signup-note">
      {$t('login.signupNote')}
    </p>
  </div>
</div>

<style>
  .login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-primary);
    position: relative;
  }

  .language-corner {
    position: absolute;
    top: var(--space-4);
    right: var(--space-4);
    z-index: 10;
  }

  .login-container {
    text-align: center;
    max-width: 400px;
    padding: var(--space-6);
    position: relative;
    z-index: 1;
  }

  .login-header {
    margin-bottom: var(--space-6);
  }

  .logo {
    color: var(--signal-blue);
    margin-bottom: var(--space-4);
  }

  .login-header h1 {
    font-family: var(--font-mono);
    font-size: 1.5rem;
    letter-spacing: 0.2em;
    color: var(--signal-blue);
    margin-bottom: var(--space-2);
  }

  .subtitle {
    color: var(--text-muted);
    font-size: 0.875rem;
    font-family: var(--font-mono);
    letter-spacing: 0.05em;
  }

  .login-card {
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    margin: var(--space-6) 0;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  }

  .login-card h2 {
    font-family: var(--font-mono);
    font-size: 1rem;
    letter-spacing: 0.1em;
    color: var(--text-primary);
    margin-bottom: var(--space-2);
  }

  .login-card p {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-bottom: var(--space-5);
  }

  .github-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: #24292e;
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .github-button:hover:not(:disabled) {
    background: #2f363d;
    transform: translateY(-1px);
  }

  .github-button:active:not(:disabled) {
    transform: translateY(0);
  }

  .github-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--signal-red);
    color: var(--signal-red);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    margin-bottom: var(--space-4);
    font-family: var(--font-mono);
  }

  .signup-note {
    color: var(--text-dim);
    font-size: 0.75rem;
    font-family: var(--font-mono);
    letter-spacing: 0.02em;
  }
</style>
