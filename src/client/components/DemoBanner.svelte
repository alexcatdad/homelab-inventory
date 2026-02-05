<!-- Demo mode banner - shows when viewing the app in guest/demo mode -->
<script lang="ts">
  import { router } from '../lib/router';
  import { exitGuestMode } from '../lib/guestStore';
  import { t } from '../lib/i18n';

  function goToApp() {
    exitGuestMode();
    router.navigate('/app');
  }
</script>

<div class="demo-banner" role="status" aria-live="polite">
  <div class="banner-content">
    <div class="banner-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"/>
      </svg>
    </div>
    <div class="banner-text">
      <span class="banner-title">{$t('demo.bannerTitle')}</span>
      <span class="banner-desc">{$t('demo.bannerDesc')}</span>
    </div>
  </div>
  <button class="sign-in-btn" onclick={goToApp}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="10 17 15 12 10 7" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="15" y1="12" x2="3" y2="12" stroke-linecap="round"/>
    </svg>
    {$t('demo.signIn')}
  </button>
</div>

<style>
  .demo-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--tui-space-4);
    padding: var(--tui-space-3) var(--tui-space-4);
    background: linear-gradient(90deg, rgba(255, 176, 32, 0.15) 0%, rgba(255, 176, 32, 0.05) 100%);
    border: 1px solid rgba(255, 176, 32, 0.3);
    border-radius: var(--tui-radius-md);
    margin-bottom: var(--tui-space-4);
  }

  .banner-content {
    display: flex;
    align-items: center;
    gap: var(--tui-space-3);
  }

  .banner-icon {
    width: 24px;
    height: 24px;
    color: var(--tui-warning);
    flex-shrink: 0;
  }

  .banner-icon svg {
    width: 100%;
    height: 100%;
  }

  .banner-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .banner-title {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--tui-warning);
  }

  .banner-desc {
    font-family: var(--tui-font-mono);
    font-size: 0.6875rem;
    color: var(--tui-text-muted);
    letter-spacing: 0.02em;
  }

  .sign-in-btn {
    display: flex;
    align-items: center;
    gap: var(--tui-space-2);
    padding: var(--tui-space-2) var(--tui-space-3);
    background: var(--tui-warning);
    color: var(--tui-bg);
    border: none;
    border-radius: var(--tui-radius-sm);
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all var(--duration-base) var(--ease-out-quad);
    white-space: nowrap;
  }

  .sign-in-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 176, 32, 0.3);
  }

  .sign-in-btn svg {
    width: 16px;
    height: 16px;
  }

  @media (max-width: 640px) {
    .demo-banner {
      flex-direction: column;
      align-items: stretch;
      gap: var(--tui-space-3);
    }

    .banner-desc {
      display: none;
    }

    .sign-in-btn {
      justify-content: center;
    }
  }
</style>
