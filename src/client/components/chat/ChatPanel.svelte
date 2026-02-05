<script lang="ts">
  import { useQuery } from 'convex-svelte';
  import { api } from '../../../../convex/_generated/api';
  import { chatOpen, chatMessages, chatError, closeChat, clearChat, sendMessage } from '../../lib/chatStore';
  import { llmStatus } from '../../lib/llm/engine';
  import ChatMessage from './ChatMessage.svelte';
  import ChatInput from './ChatInput.svelte';
  import ModelLoader from './ModelLoader.svelte';

  // Convex queries for chat context
  const devicesQuery = useQuery(api.devices.list, {});
  const statsQuery = useQuery(api.stats.get, {});

  let messagesContainer: HTMLDivElement;

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') closeChat();
  }

  function handleOverlayClick() {
    closeChat();
  }

  function handleSend(message: string) {
    const devices = devicesQuery.data || [];
    const stats = statsQuery.data || null;
    sendMessage(message, devices, stats);
  }

  // Auto-scroll to bottom when new messages arrive
  $effect(() => {
    if ($chatMessages.length > 0 && messagesContainer) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 10);
    }
  });

  let showChat = $derived($llmStatus === 'ready');
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $chatOpen}
  <div class="overlay" onclick={handleOverlayClick} role="button" tabindex="-1" onkeydown={(e) => e.key === 'Enter' && handleOverlayClick()}>
    <div class="chat-panel" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1" onkeydown={(e) => e.stopPropagation()}>

      <!-- Status indicator line -->
      <div class="panel-status-line"></div>

      <!-- Header -->
      <div class="panel-header">
        <div class="header-content">
          <div class="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
          </div>
          <div class="header-text">
            <h2>AI Assistant</h2>
            <span class="status-badge" class:ready={$llmStatus === 'ready'} class:loading={$llmStatus === 'loading'}>
              {#if $llmStatus === 'ready'}
                Ready
              {:else if $llmStatus === 'loading'}
                Loading...
              {:else if $llmStatus === 'error'}
                Error
              {:else}
                Offline
              {/if}
            </span>
          </div>
        </div>
        <div class="header-actions">
          {#if $chatMessages.length > 0}
            <button class="action-button" onclick={clearChat} title="Clear chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
            </button>
          {/if}
          <button class="close-button" onclick={closeChat} title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="panel-content">
        {#if showChat}
          <!-- Chat messages -->
          <div class="messages-container" bind:this={messagesContainer}>
            {#if $chatMessages.length === 0}
              <!-- Empty state with example prompts -->
              <div class="empty-state">
                <div class="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <p>Ask me anything about your homelab inventory!</p>
                <div class="example-prompts">
                  <span class="prompt-label">Try asking:</span>
                  <button class="prompt-chip" onclick={() => handleSend('What is the total storage capacity?')}>
                    Total storage?
                  </button>
                  <button class="prompt-chip" onclick={() => handleSend('Which devices support HEVC transcoding?')}>
                    HEVC support?
                  </button>
                  <button class="prompt-chip" onclick={() => handleSend('Compare RAM across all devices')}>
                    Compare RAM
                  </button>
                </div>
              </div>
            {:else}
              {#each $chatMessages as message (message.id)}
                <ChatMessage {message} />
              {/each}
            {/if}

            {#if $chatError}
              <div class="error-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01"/>
                </svg>
                <span>{$chatError}</span>
              </div>
            {/if}
          </div>

          <!-- Input -->
          <ChatInput onSend={handleSend} />
        {:else}
          <!-- Model loader -->
          <ModelLoader />
        {/if}
      </div>

    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(8, 9, 12, 0.85);
    backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    justify-content: flex-end;
  }

  .chat-panel {
    width: 100%;
    max-width: 440px;
    background: var(--tui-panel);
    border-left: 1px solid var(--tui-border);
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    animation: slideIn 0.25s var(--ease-out-expo);
  }

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  /* Status line at top */
  .panel-status-line {
    height: 2px;
    background: linear-gradient(90deg, var(--tui-info), var(--signal-cyan));
    opacity: 0.8;
  }

  /* Header */
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--tui-space-4) var(--tui-space-5);
    background: var(--tui-panel-deep);
    border-bottom: 1px solid var(--tui-border);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: var(--tui-space-3);
  }

  .header-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--panel-hover);
    border-radius: var(--tui-radius-md);
    color: var(--tui-info);
  }

  .header-icon svg {
    width: 20px;
    height: 20px;
  }

  .header-text h2 {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
    color: var(--tui-text-bright);
    margin: 0;
  }

  .status-badge {
    font-family: var(--tui-font-mono);
    font-size: 0.625rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    padding: 2px 6px;
    border-radius: var(--tui-radius-sm);
    background: var(--panel-hover);
    color: var(--tui-text-muted);
  }

  .status-badge.ready {
    background: rgba(0, 210, 106, 0.15);
    color: var(--tui-success);
  }

  .status-badge.loading {
    background: rgba(0, 168, 255, 0.15);
    color: var(--tui-info);
  }

  .header-actions {
    display: flex;
    gap: var(--tui-space-2);
  }

  .action-button,
  .close-button {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--tui-text-muted);
    border-radius: var(--tui-radius-md);
    transition: all var(--duration-fast) var(--ease-out-quad);
  }

  .action-button:hover,
  .close-button:hover {
    background: var(--panel-hover);
    color: var(--tui-text-bright);
  }

  .action-button svg,
  .close-button svg {
    width: 16px;
    height: 16px;
  }

  /* Content */
  .panel-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: var(--tui-space-4);
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: var(--tui-space-8) var(--tui-space-4);
  }

  .empty-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto var(--tui-space-4);
    color: var(--tui-text-dim);
  }

  .empty-icon svg {
    width: 100%;
    height: 100%;
  }

  .empty-state p {
    font-family: var(--tui-font-mono);
    font-size: 0.875rem;
    color: var(--tui-text-muted);
    margin: 0 0 var(--tui-space-5);
  }

  .example-prompts {
    display: flex;
    flex-direction: column;
    gap: var(--tui-space-2);
    align-items: center;
  }

  .prompt-label {
    font-family: var(--tui-font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: var(--tui-text-dim);
    text-transform: uppercase;
  }

  .prompt-chip {
    font-family: var(--tui-font-mono);
    font-size: 0.8125rem;
    padding: var(--tui-space-2) var(--tui-space-3);
    background: var(--panel-hover);
    border: 1px solid var(--tui-border);
    border-radius: var(--tui-radius-md);
    color: var(--tui-text-muted);
    transition: all var(--duration-fast) var(--ease-out-quad);
  }

  .prompt-chip:hover {
    background: var(--tui-info);
    border-color: var(--tui-info);
    color: var(--tui-text-bright);
    transform: translateY(-1px);
  }

  /* Error message */
  .error-message {
    display: flex;
    align-items: center;
    gap: var(--tui-space-2);
    padding: var(--tui-space-3);
    background: rgba(255, 71, 87, 0.1);
    border: 1px solid rgba(255, 71, 87, 0.3);
    border-radius: var(--tui-radius-md);
    margin-top: var(--tui-space-3);
  }

  .error-message svg {
    width: 16px;
    height: 16px;
    color: var(--tui-danger);
    flex-shrink: 0;
  }

  .error-message span {
    font-family: var(--tui-font-mono);
    font-size: 0.8125rem;
    color: var(--tui-danger);
  }
</style>
