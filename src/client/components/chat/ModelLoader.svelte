<script lang="ts">
  import { llmStatus, llmProgress, llmError, initializeLLM, resetLLM, MODEL_SIZE, isWebGPUSupported } from '../../lib/llm/engine';

  let webGPUSupported = $state(true);

  $effect(() => {
    webGPUSupported = isWebGPUSupported();
  });

  function handleRetry() {
    resetLLM();
    initializeLLM();
  }

  function handleStart() {
    initializeLLM();
  }

  let progressPercent = $derived(Math.round($llmProgress.progress * 100));
</script>

<div class="model-loader">
  {#if !webGPUSupported}
    <!-- WebGPU not supported -->
    <div class="loader-content error">
      <div class="loader-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
      </div>
      <h3>WebGPU Not Supported</h3>
      <p>Your browser doesn't support WebGPU, which is required for the AI assistant.</p>
      <p class="hint">Please use Chrome, Edge, or another WebGPU-enabled browser.</p>
    </div>

  {:else if $llmStatus === 'idle'}
    <!-- Ready to download -->
    <div class="loader-content">
      <div class="loader-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>
      <h3>Download AI Model</h3>
      <p>The AI assistant requires a one-time download of the language model.</p>
      <p class="size-info">Download size: <strong>{MODEL_SIZE}</strong></p>
      <button class="start-button" onclick={handleStart}>
        Download & Start
      </button>
    </div>

  {:else if $llmStatus === 'loading'}
    <!-- Loading/downloading -->
    <div class="loader-content">
      <div class="loader-icon spinning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="10"/>
        </svg>
      </div>
      <h3>Loading AI Model</h3>
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: {progressPercent}%"></div>
        </div>
        <span class="progress-text">{progressPercent}%</span>
      </div>
      <p class="status-text">{$llmProgress.text}</p>
    </div>

  {:else if $llmStatus === 'error'}
    <!-- Error state -->
    <div class="loader-content error">
      <div class="loader-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M15 9l-6 6M9 9l6 6"/>
        </svg>
      </div>
      <h3>Failed to Load</h3>
      <p class="error-message">{$llmError}</p>
      <button class="retry-button" onclick={handleRetry}>
        Try Again
      </button>
    </div>
  {/if}
</div>

<style>
  .model-loader {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: var(--space-6);
  }

  .loader-content {
    text-align: center;
    max-width: 300px;
  }

  .loader-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto var(--space-4);
    color: var(--signal-blue);
  }

  .loader-icon svg {
    width: 100%;
    height: 100%;
  }

  .loader-icon.spinning svg {
    animation: spin 1.5s linear infinite;
  }

  .error .loader-icon {
    color: var(--signal-red);
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  h3 {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-bright);
    margin: 0 0 var(--space-3);
  }

  p {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--text-secondary);
    margin: 0 0 var(--space-2);
    line-height: 1.5;
  }

  .hint {
    color: var(--text-muted);
    font-size: 0.75rem;
  }

  .size-info {
    color: var(--text-muted);
    margin-bottom: var(--space-4);
  }

  .size-info strong {
    color: var(--signal-cyan);
  }

  .progress-container {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }

  .progress-bar {
    flex: 1;
    height: 8px;
    background: var(--panel);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--signal-blue), var(--signal-cyan));
    border-radius: var(--radius-sm);
    transition: width 0.3s ease-out;
  }

  .progress-text {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--signal-blue);
    min-width: 40px;
    text-align: right;
  }

  .status-text {
    font-size: 0.75rem;
    color: var(--text-dim);
    margin: 0;
  }

  .error-message {
    color: var(--signal-red);
    margin-bottom: var(--space-4);
  }

  .start-button,
  .retry-button {
    padding: var(--space-3) var(--space-5);
    background: var(--signal-blue);
    color: var(--text-bright);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: var(--radius-md);
    transition: all var(--duration-fast) var(--ease-out-quad);
  }

  .start-button:hover,
  .retry-button:hover {
    background: var(--signal-cyan);
    transform: translateY(-2px);
  }

  .retry-button {
    background: var(--panel-hover);
    border: 1px solid var(--signal-red);
    color: var(--signal-red);
  }

  .retry-button:hover {
    background: var(--signal-red);
    color: var(--text-bright);
  }
</style>
