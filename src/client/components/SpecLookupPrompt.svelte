<script lang="ts">
  import { extractFromUserText, type CascadeOps } from '../lib/specLookup/cascade';
  import type { Specifications } from '../../shared/types';

  interface Props {
    modelName: string;
    onSpecsExtracted: (specs: Specifications) => void;
    onSkip: () => void;
    saveCache: (model: string, specs: Specifications) => Promise<void>;
  }

  let { modelName, onSpecsExtracted, onSkip, saveCache }: Props = $props();

  let inputText = $state('');
  let isExtracting = $state(false);
  let error = $state('');
  let shareWithCommunity = $state(true);

  async function handleExtract() {
    if (!inputText.trim()) return;

    isExtracting = true;
    error = '';

    try {
      const result = await extractFromUserText(modelName, inputText, { saveCache });

      if (result.success && result.specs) {
        onSpecsExtracted(result.specs);
      } else {
        error = result.error || 'Could not extract specs from text. Try adding more details.';
      }
    } catch (e) {
      error = 'Extraction failed. Please try again.';
    } finally {
      isExtracting = false;
    }
  }

  let canExtract = $derived(inputText.trim().length > 20 && !isExtracting);
</script>

<div class="spec-prompt">
  <div class="prompt-header">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
    <span>SPECS NOT FOUND</span>
  </div>

  <p class="prompt-text">
    No specs found for <strong>"{modelName}"</strong>. Paste specifications from a product page:
  </p>

  <textarea
    bind:value={inputText}
    placeholder="Paste specs here, e.g.:&#10;&#10;CPU: Intel Core i5-10500, 6 cores, 12 threads&#10;RAM: 16GB DDR4 (max 128GB)&#10;Chipset: Intel Q470"
    rows="5"
    disabled={isExtracting}
  ></textarea>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <label class="share-checkbox">
    <input type="checkbox" bind:checked={shareWithCommunity} disabled={isExtracting} />
    <span>Share these specs with the community</span>
  </label>

  <div class="prompt-actions">
    <button type="button" class="btn-skip" onclick={onSkip} disabled={isExtracting}>
      Skip, enter manually
    </button>
    <button type="button" class="btn-extract" onclick={handleExtract} disabled={!canExtract}>
      {#if isExtracting}
        <span class="spinner"></span>
        Extracting...
      {:else}
        Extract Specs
      {/if}
    </button>
  </div>
</div>

<style>
  .spec-prompt {
    background: var(--panel-deep);
    border: 1px solid var(--signal-blue);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    margin: var(--space-4) 0;
  }

  .prompt-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--signal-blue);
    margin-bottom: var(--space-3);
  }

  .prompt-header svg {
    width: 16px;
    height: 16px;
  }

  .prompt-header span {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.12em;
  }

  .prompt-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: var(--space-3);
  }

  .prompt-text strong {
    color: var(--text-primary);
  }

  textarea {
    width: 100%;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--text-primary);
    background: var(--panel);
    border: 1px solid var(--border-dim);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    resize: vertical;
    min-height: 100px;
  }

  textarea:focus {
    outline: none;
    border-color: var(--signal-blue);
  }

  textarea::placeholder {
    color: var(--text-dim);
  }

  textarea:disabled {
    opacity: 0.5;
  }

  .error {
    color: #ff6b6b;
    font-size: 0.8125rem;
    margin-top: var(--space-2);
  }

  .share-checkbox {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-3);
    font-size: 0.8125rem;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .share-checkbox input {
    accent-color: var(--signal-blue);
  }

  .prompt-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    margin-top: var(--space-4);
  }

  .btn-skip,
  .btn-extract {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out-quad);
  }

  .btn-skip {
    color: var(--text-muted);
    background: transparent;
    border: 1px solid var(--border-dim);
  }

  .btn-skip:hover:not(:disabled) {
    color: var(--text-primary);
    border-color: var(--border-panel);
  }

  .btn-extract {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--bg-base);
    background: var(--signal-blue);
    border: none;
  }

  .btn-extract:hover:not(:disabled) {
    background: var(--signal-blue-bright, #5ba3ff);
  }

  .btn-skip:disabled,
  .btn-extract:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
