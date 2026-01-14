<script lang="ts">
  import { useConvexClient } from 'convex-svelte';
  import { currentLanguage, changeLanguage } from '../lib/i18n/languageStore';
  import { SUPPORTED_LOCALES, LOCALE_NAMES, type SupportedLocale } from '../lib/i18n';

  const client = useConvexClient();

  let isOpen = $state(false);
  let currentLang = $state<SupportedLocale>('en');

  $effect(() => {
    const unsub = currentLanguage.subscribe(v => currentLang = v);
    return unsub;
  });

  function toggleDropdown() {
    isOpen = !isOpen;
  }

  function closeDropdown() {
    isOpen = false;
  }

  async function selectLanguage(lang: SupportedLocale) {
    await changeLanguage(lang, client);
    closeDropdown();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') closeDropdown();
  }

  // Flag icons using Unicode regional indicators
  const FLAGS: Record<SupportedLocale, string> = {
    en: 'EN',
    ro: 'RO',
  };
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="language-switcher">
  <button
    class="lang-button"
    onclick={toggleDropdown}
    title="Change language"
    aria-haspopup="true"
    aria-expanded={isOpen}
  >
    <span class="lang-code">{FLAGS[currentLang]}</span>
    <svg class="chevron" class:open={isOpen} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  </button>

  {#if isOpen}
    <div class="dropdown" role="menu">
      {#each SUPPORTED_LOCALES as lang}
        <button
          class="dropdown-item"
          class:active={lang === currentLang}
          onclick={() => selectLanguage(lang)}
          role="menuitem"
        >
          <span class="item-code">{FLAGS[lang]}</span>
          <span class="item-name">{LOCALE_NAMES[lang]}</span>
          {#if lang === currentLang}
            <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          {/if}
        </button>
      {/each}
    </div>
    <button class="backdrop" onclick={closeDropdown} aria-hidden="true"></button>
  {/if}
</div>

<style>
  .language-switcher {
    position: relative;
  }

  .lang-button {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    background: var(--panel-deep);
    border: 1px solid var(--border-dim);
    border-radius: var(--radius-md);
    color: var(--text-muted);
    transition: all var(--duration-base) var(--ease-out-quad);
    cursor: pointer;
  }

  .lang-button:hover {
    background: var(--panel-hover);
    border-color: var(--signal-blue);
    color: var(--signal-blue);
  }

  .lang-code {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .chevron {
    width: 12px;
    height: 12px;
    transition: transform var(--duration-fast) var(--ease-out-quad);
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .dropdown {
    position: absolute;
    top: calc(100% + var(--space-2));
    right: 0;
    min-width: 140px;
    background: var(--panel);
    border: 1px solid var(--border-panel);
    border-radius: var(--radius-md);
    padding: var(--space-1);
    z-index: 200;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    animation: dropdownIn 0.15s var(--ease-out-expo);
  }

  @keyframes dropdownIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out-quad);
  }

  .dropdown-item:hover {
    background: var(--panel-hover);
    color: var(--text-primary);
  }

  .dropdown-item.active {
    background: rgba(0, 168, 255, 0.1);
    color: var(--signal-blue);
  }

  .item-code {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 600;
    min-width: 24px;
  }

  .item-name {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    flex: 1;
    text-align: left;
  }

  .check-icon {
    width: 14px;
    height: 14px;
    color: var(--signal-blue);
  }

  .backdrop {
    position: fixed;
    inset: 0;
    background: transparent;
    z-index: 199;
    cursor: default;
    border: none;
  }
</style>
