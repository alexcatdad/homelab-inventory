<script lang="ts">
  import { chatGenerating } from '../../lib/chatStore';

  interface Props {
    onSend: (message: string) => void;
  }

  let { onSend }: Props = $props();

  let inputValue = $state('');
  let inputElement: HTMLTextAreaElement;

  let isDisabled = $derived($chatGenerating);

  function handleSubmit() {
    const trimmed = inputValue.trim();
    if (!trimmed || isDisabled) return;

    onSend(trimmed);
    inputValue = '';

    // Reset textarea height
    if (inputElement) {
      inputElement.style.height = 'auto';
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput() {
    // Auto-resize textarea
    if (inputElement) {
      inputElement.style.height = 'auto';
      inputElement.style.height = Math.min(inputElement.scrollHeight, 120) + 'px';
    }
  }
</script>

<div class="chat-input-container">
  <textarea
    bind:this={inputElement}
    bind:value={inputValue}
    onkeydown={handleKeydown}
    oninput={handleInput}
    placeholder="Ask about your inventory..."
    disabled={isDisabled}
    rows="1"
    class="chat-input"
  ></textarea>
  <button
    class="send-button"
    onclick={handleSubmit}
    disabled={isDisabled || !inputValue.trim()}
    title="Send message"
  >
    {#if isDisabled}
      <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32">
          <animate attributeName="stroke-dashoffset" dur="1s" values="32;0" repeatCount="indefinite"/>
        </circle>
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
      </svg>
    {/if}
  </button>
</div>

<style>
  .chat-input-container {
    display: flex;
    gap: var(--space-2);
    padding: var(--space-4);
    background: var(--panel-deep);
    border-top: 1px solid var(--border-dim);
  }

  .chat-input {
    flex: 1;
    background: var(--panel);
    border: 1px solid var(--border-dim);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    color: var(--text-primary);
    resize: none;
    min-height: 40px;
    max-height: 120px;
    line-height: 1.4;
    transition: border-color var(--duration-fast) var(--ease-out-quad);
  }

  .chat-input:focus {
    outline: none;
    border-color: var(--signal-blue);
  }

  .chat-input::placeholder {
    color: var(--text-dim);
  }

  .chat-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .send-button {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--signal-blue);
    border-radius: var(--radius-md);
    color: var(--text-bright);
    flex-shrink: 0;
    transition: all var(--duration-fast) var(--ease-out-quad);
  }

  .send-button:hover:not(:disabled) {
    background: var(--signal-cyan);
    transform: scale(1.05);
  }

  .send-button:disabled {
    background: var(--panel-hover);
    color: var(--text-dim);
    cursor: not-allowed;
  }

  .send-button svg {
    width: 18px;
    height: 18px;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
