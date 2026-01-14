<script lang="ts">
  import type { ChatMessage } from '../../lib/chatStore';

  let { message }: { message: ChatMessage } = $props();

  let isUser = $derived(message.role === 'user');
</script>

<div class="message" class:user={isUser} class:assistant={!isUser}>
  <div class="message-bubble">
    <div class="message-content">
      {#if message.content}
        {message.content}
      {:else if message.isStreaming}
        <span class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </span>
      {/if}
    </div>
    {#if message.isStreaming && message.content}
      <span class="streaming-cursor"></span>
    {/if}
  </div>
</div>

<style>
  .message {
    display: flex;
    margin-bottom: var(--space-3);
  }

  .message.user {
    justify-content: flex-end;
  }

  .message.assistant {
    justify-content: flex-start;
  }

  .message-bubble {
    max-width: 85%;
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-lg);
    position: relative;
  }

  .user .message-bubble {
    background: var(--signal-blue);
    color: var(--text-bright);
    border-bottom-right-radius: var(--radius-sm);
  }

  .assistant .message-bubble {
    background: var(--panel-raised);
    border: 1px solid var(--border-dim);
    color: var(--text-primary);
    border-bottom-left-radius: var(--radius-sm);
  }

  .message-content {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .streaming-cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background: var(--signal-cyan);
    margin-left: 2px;
    animation: blink 0.8s infinite;
    vertical-align: text-bottom;
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .typing-indicator {
    display: flex;
    gap: 4px;
    padding: 4px 0;
  }

  .typing-indicator span {
    width: 6px;
    height: 6px;
    background: var(--text-muted);
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
  }

  .typing-indicator span:nth-child(1) {
    animation-delay: -0.32s;
  }

  .typing-indicator span:nth-child(2) {
    animation-delay: -0.16s;
  }

  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }
</style>
