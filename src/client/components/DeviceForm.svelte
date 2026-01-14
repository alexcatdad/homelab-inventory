<script lang="ts">
  import { useConvexClient } from 'convex-svelte';
  import { api } from '../../../convex/_generated/api';
  import { deviceFormOpen, editingDevice, formSaving, formError, closeForm, type Device } from '../lib/stores';
  import { lookupSpecs, specLookupLoading, specLookupError, type ConvexSpecsOps } from '../lib/llm/specLookup';
  import { llmStatus, initializeLLM } from '../lib/llm/engine';
  import type { DeviceType, RAMType, Specifications } from '../../shared/types';

  const client = useConvexClient();

  let isOpen = $state(false);
  let device: Device | null = $state(null);
  let saving = $state(false);
  let error: string | null = $state(null);
  let lookingUpSpecs = $state(false);
  let lookupStatus: 'idle' | 'loading' | 'ready' | 'error' = $state('idle');

  // Form fields - Basic
  let name = $state('');
  let model = $state('');
  let type = $state<DeviceType>('Desktop');
  let quantity = $state(1);
  let location = $state('');
  let notes = $state('');

  // Form fields - Specs
  let cpuModel = $state('');
  let cpuCores = $state<number | undefined>(undefined);
  let cpuThreads = $state<number | undefined>(undefined);
  let cpuSocket = $state('');
  let cpuTdp = $state<number | undefined>(undefined);

  let ramType = $state<RAMType>('DDR4');
  let ramCurrent = $state('');
  let ramMax = $state('');

  let mbModel = $state('');
  let mbChipset = $state('');
  let mbFormFactor = $state('');

  const deviceTypes: DeviceType[] = ['Server', 'Desktop', 'Laptop', 'Component', 'IoT', 'Network'];
  const ramTypes: RAMType[] = ['DDR3', 'DDR4', 'DDR5', 'LPDDR4', 'LPDDR5', 'Unified Memory'];

  // Preload LLM when form opens
  $effect(() => {
    const unsub = deviceFormOpen.subscribe(v => {
      if (v && lookupStatus !== 'ready' && lookupStatus !== 'loading') {
        // Start loading LLM in background when form opens
        initializeLLM();
      }
    });
    return unsub;
  });

  $effect(() => {
    const unsub1 = deviceFormOpen.subscribe(v => isOpen = v);
    const unsub2 = editingDevice.subscribe(v => {
      device = v;
      if (v) {
        // Populate form when editing
        name = v.name;
        model = v.model || '';
        type = v.type;
        quantity = v.quantity || 1;
        location = v.location || '';
        notes = v.notes || '';
        // Specs
        cpuModel = v.specifications?.cpu?.model || '';
        cpuCores = v.specifications?.cpu?.cores;
        cpuThreads = v.specifications?.cpu?.threads;
        cpuSocket = v.specifications?.cpu?.socket || '';
        cpuTdp = v.specifications?.cpu?.tdp_watts;
        ramType = v.specifications?.ram?.type || 'DDR4';
        ramCurrent = v.specifications?.ram?.current || '';
        ramMax = v.specifications?.ram?.max_supported || '';
        mbModel = v.specifications?.motherboard?.model || '';
        mbChipset = v.specifications?.motherboard?.chipset || '';
        mbFormFactor = v.specifications?.motherboard?.form_factor || '';
      } else {
        resetForm();
      }
    });
    const unsub3 = formSaving.subscribe(v => saving = v);
    const unsub4 = formError.subscribe(v => error = v);
    const unsub5 = specLookupLoading.subscribe(v => lookingUpSpecs = v);
    const unsub6 = llmStatus.subscribe(v => lookupStatus = v);
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
    };
  });

  function resetForm() {
    name = '';
    model = '';
    type = 'Desktop';
    quantity = 1;
    location = '';
    notes = '';
    cpuModel = '';
    cpuCores = undefined;
    cpuThreads = undefined;
    cpuSocket = '';
    cpuTdp = undefined;
    ramType = 'DDR4';
    ramCurrent = '';
    ramMax = '';
    mbModel = '';
    mbChipset = '';
    mbFormFactor = '';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') closeForm();
  }

  function handleOverlayClick() {
    if (!saving && !lookingUpSpecs) closeForm();
  }

  // Auto-lookup specs when model field loses focus
  async function handleModelBlur() {
    if (!model.trim() || lookingUpSpecs || saving) return;

    // Don't lookup if we already have specs filled in
    if (cpuModel || ramCurrent || mbModel) return;

    specLookupLoading.set(true);
    specLookupError.set(null);

    // Create Convex operations adapter for specLookup
    const convexOps: ConvexSpecsOps = {
      checkCache: async (modelQuery: string) => {
        const result = await client.action(api.specs.checkCache, { model: modelQuery });
        return {
          cached: result.cached,
          specs: result.specs,
          source_url: result.source_url,
        };
      },
      saveCache: async (modelQuery: string, specs: Specifications) => {
        await client.mutation(api.specs.setCache, { model: modelQuery, specs });
      },
      proxySearch: async (query: string) => {
        return await client.action(api.specs.proxySearch, { query });
      },
    };

    try {
      const result = await lookupSpecs(model, type, convexOps);

      if (result.success && result.specs) {
        // Fill in specs from lookup
        if (result.specs.cpu) {
          cpuModel = result.specs.cpu.model || cpuModel;
          cpuCores = result.specs.cpu.cores ?? cpuCores;
          cpuThreads = result.specs.cpu.threads ?? cpuThreads;
          cpuSocket = result.specs.cpu.socket || cpuSocket;
          cpuTdp = result.specs.cpu.tdp_watts ?? cpuTdp;
        }
        if (result.specs.ram) {
          ramType = result.specs.ram.type || ramType;
          ramCurrent = result.specs.ram.current || ramCurrent;
          ramMax = result.specs.ram.max_supported || ramMax;
        }
        if (result.specs.motherboard) {
          mbModel = result.specs.motherboard.model || mbModel;
          mbChipset = result.specs.motherboard.chipset || mbChipset;
          mbFormFactor = result.specs.motherboard.form_factor || mbFormFactor;
        }
      }
    } catch (e) {
      // Silently fail - user can fill specs manually
      console.error('Spec lookup failed:', e);
    } finally {
      specLookupLoading.set(false);
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!name.trim()) {
      formError.set('Name is required');
      return;
    }

    formSaving.set(true);
    formError.set(null);

    // Build specs object
    const specifications: any = {};

    if (cpuModel || cpuCores || cpuThreads) {
      specifications.cpu = {
        model: cpuModel || undefined,
        cores: cpuCores || undefined,
        threads: cpuThreads || undefined,
        socket: cpuSocket || undefined,
        tdp_watts: cpuTdp || undefined,
      };
    }

    if (ramType || ramCurrent || ramMax) {
      specifications.ram = {
        current: ramCurrent || undefined,
        max_supported: ramMax || undefined,
        type: ramType || undefined,
      };
    }

    if (mbModel || mbChipset || mbFormFactor) {
      specifications.motherboard = {
        model: mbModel || undefined,
        chipset: mbChipset || undefined,
        form_factor: mbFormFactor || undefined,
      };
    }

    try {
      const deviceData = {
        name: name.trim(),
        model: model.trim() || undefined,
        type,
        quantity,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
      };

      if (device) {
        // Update existing device
        await client.mutation(api.devices.update, { id: device._id, ...deviceData });
      } else {
        // Create new device
        await client.mutation(api.devices.create, deviceData);
      }

      closeForm();
    } catch (e) {
      formError.set(e instanceof Error ? e.message : 'Failed to save device');
    } finally {
      formSaving.set(false);
    }
  }

  let isEditing = $derived(device !== null);
  let title = $derived(isEditing ? 'Edit Device' : 'Add Device');
  let isDisabled = $derived(saving || lookingUpSpecs);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div class="overlay" onclick={handleOverlayClick} role="button" tabindex="-1" onkeydown={(e) => e.key === 'Enter' && handleOverlayClick()}>
    <div class="form-panel" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1" onkeydown={(e) => e.stopPropagation()}>

      <!-- Header -->
      <div class="panel-header">
        <div class="header-top">
          <span class="badge">{isEditing ? 'EDIT' : 'NEW'}</span>
          <button class="close-btn" onclick={closeForm} disabled={isDisabled} aria-label="Close form">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="header-info">
          <h2>{title}</h2>
        </div>
        <div class="header-accent"></div>
      </div>

      <!-- Form Content -->
      <form class="panel-content" onsubmit={handleSubmit}>

        {#if error}
          <div class="error-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16h.01"/>
            </svg>
            <span>{error}</span>
          </div>
        {/if}

        <!-- Basic Info Section -->
        <section class="form-section">
          <div class="section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
            </svg>
            <span>DEVICE INFO</span>
          </div>

          <div class="form-group">
            <label for="name" class="form-label">NAME *</label>
            <input
              id="name"
              type="text"
              class="form-input"
              bind:value={name}
              placeholder="Device name"
              disabled={isDisabled}
              required
            />
          </div>

          <div class="form-group">
            <label for="model" class="form-label">MODEL</label>
            <div class="input-with-status">
              <input
                id="model"
                type="text"
                class="form-input"
                bind:value={model}
                placeholder="Enter model to auto-lookup specs"
                disabled={isDisabled}
                onblur={handleModelBlur}
              />
              {#if lookingUpSpecs}
                <div class="lookup-status finding">
                  <span class="lookup-spinner"></span>
                  <span>Finding specs...</span>
                </div>
              {:else if lookupStatus === 'loading'}
                <div class="lookup-status loading">
                  <span class="lookup-spinner"></span>
                  <span>Loading AI model...</span>
                </div>
              {:else if lookupStatus === 'ready'}
                <div class="lookup-status ready">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  <span>AI ready for spec lookup</span>
                </div>
              {/if}
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="type" class="form-label">TYPE *</label>
              <div class="select-wrapper">
                <select
                  id="type"
                  class="form-select"
                  bind:value={type}
                  disabled={isDisabled}
                >
                  {#each deviceTypes as t}
                    <option value={t}>{t}</option>
                  {/each}
                </select>
                <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>

            <div class="form-group">
              <label for="quantity" class="form-label">QTY</label>
              <input
                id="quantity"
                type="number"
                class="form-input"
                bind:value={quantity}
                min="1"
                disabled={isDisabled}
              />
            </div>
          </div>

          <div class="form-group">
            <label for="location" class="form-label">LOCATION</label>
            <input
              id="location"
              type="text"
              class="form-input"
              bind:value={location}
              placeholder="Physical location"
              disabled={isDisabled}
            />
          </div>
        </section>

        <!-- CPU Section -->
        <section class="form-section">
          <div class="section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <rect x="9" y="9" width="6" height="6"/>
              <path d="M4 9h2M4 15h2M18 9h2M18 15h2M9 4v2M15 4v2M9 18v2M15 18v2"/>
            </svg>
            <span>PROCESSOR</span>
          </div>

          <div class="form-group">
            <label for="cpuModel" class="form-label">CPU MODEL</label>
            <input
              id="cpuModel"
              type="text"
              class="form-input"
              bind:value={cpuModel}
              placeholder="e.g. Intel Core i7-12700K"
              disabled={isDisabled}
            />
          </div>

          <div class="form-row-3">
            <div class="form-group">
              <label for="cpuCores" class="form-label">CORES</label>
              <input
                id="cpuCores"
                type="number"
                class="form-input"
                bind:value={cpuCores}
                min="1"
                placeholder="8"
                disabled={isDisabled}
              />
            </div>
            <div class="form-group">
              <label for="cpuThreads" class="form-label">THREADS</label>
              <input
                id="cpuThreads"
                type="number"
                class="form-input"
                bind:value={cpuThreads}
                min="1"
                placeholder="16"
                disabled={isDisabled}
              />
            </div>
            <div class="form-group">
              <label for="cpuTdp" class="form-label">TDP (W)</label>
              <input
                id="cpuTdp"
                type="number"
                class="form-input"
                bind:value={cpuTdp}
                min="1"
                placeholder="125"
                disabled={isDisabled}
              />
            </div>
          </div>

          <div class="form-group">
            <label for="cpuSocket" class="form-label">SOCKET</label>
            <input
              id="cpuSocket"
              type="text"
              class="form-input"
              bind:value={cpuSocket}
              placeholder="e.g. LGA1700"
              disabled={isDisabled}
            />
          </div>
        </section>

        <!-- RAM Section -->
        <section class="form-section">
          <div class="section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="6" width="18" height="12" rx="1"/>
              <path d="M7 6V4M12 6V4M17 6V4M7 18v2M12 18v2M17 18v2"/>
            </svg>
            <span>MEMORY</span>
          </div>

          <div class="form-row-3">
            <div class="form-group">
              <label for="ramType" class="form-label">TYPE</label>
              <div class="select-wrapper">
                <select
                  id="ramType"
                  class="form-select"
                  bind:value={ramType}
                  disabled={isDisabled}
                >
                  {#each ramTypes as rt}
                    <option value={rt}>{rt}</option>
                  {/each}
                </select>
                <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>
            <div class="form-group">
              <label for="ramCurrent" class="form-label">CURRENT</label>
              <input
                id="ramCurrent"
                type="text"
                class="form-input"
                bind:value={ramCurrent}
                placeholder="32GB"
                disabled={isDisabled}
              />
            </div>
            <div class="form-group">
              <label for="ramMax" class="form-label">MAX</label>
              <input
                id="ramMax"
                type="text"
                class="form-input"
                bind:value={ramMax}
                placeholder="128GB"
                disabled={isDisabled}
              />
            </div>
          </div>
        </section>

        <!-- Motherboard Section -->
        <section class="form-section">
          <div class="section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <rect x="7" y="7" width="4" height="4"/>
              <rect x="13" y="7" width="4" height="4"/>
              <rect x="7" y="13" width="4" height="4"/>
              <rect x="13" y="13" width="4" height="4"/>
            </svg>
            <span>MOTHERBOARD</span>
          </div>

          <div class="form-group">
            <label for="mbModel" class="form-label">MODEL</label>
            <input
              id="mbModel"
              type="text"
              class="form-input"
              bind:value={mbModel}
              placeholder="e.g. ASUS ROG STRIX B550-F"
              disabled={isDisabled}
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="mbChipset" class="form-label">CHIPSET</label>
              <input
                id="mbChipset"
                type="text"
                class="form-input"
                bind:value={mbChipset}
                placeholder="e.g. B550"
                disabled={isDisabled}
              />
            </div>
            <div class="form-group">
              <label for="mbFormFactor" class="form-label">FORM FACTOR</label>
              <input
                id="mbFormFactor"
                type="text"
                class="form-input"
                bind:value={mbFormFactor}
                placeholder="ATX"
                disabled={isDisabled}
              />
            </div>
          </div>
        </section>

        <!-- Notes Section -->
        <section class="form-section">
          <div class="section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
            <span>NOTES</span>
          </div>

          <div class="form-group">
            <textarea
              id="notes"
              class="form-textarea"
              bind:value={notes}
              placeholder="Additional notes about this device"
              rows="3"
              disabled={isDisabled}
            ></textarea>
          </div>
        </section>

        <div class="form-actions">
          <button type="button" class="btn-cancel" onclick={closeForm} disabled={isDisabled}>
            Cancel
          </button>
          <button type="submit" class="btn-save" disabled={isDisabled}>
            {#if saving}
              <span class="spinner"></span>
              Saving...
            {:else}
              {isEditing ? 'Save Changes' : 'Create Device'}
            {/if}
          </button>
        </div>

      </form>
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

  .form-panel {
    width: 100%;
    max-width: 520px;
    background: var(--panel);
    border-left: 1px solid var(--border-panel);
    height: 100%;
    overflow-y: auto;
    animation: slideIn 0.25s var(--ease-out-expo);
    position: relative;
  }

  .form-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 2px;
    height: 100%;
    background: linear-gradient(180deg, var(--signal-cyan), transparent);
    opacity: 0.5;
  }

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  /* Header */
  .panel-header {
    padding: var(--space-6);
    background: var(--panel-deep);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
  }

  .badge {
    font-family: var(--font-mono);
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: var(--signal-cyan);
    padding: 4px 8px;
    background: rgba(0, 212, 255, 0.1);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: var(--radius-sm);
  }

  .close-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    border-radius: var(--radius-md);
    transition: all var(--duration-fast) var(--ease-out-quad);
  }

  .close-btn:hover:not(:disabled) {
    background: var(--panel-hover);
    color: var(--text-bright);
  }

  .close-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .close-btn svg {
    width: 18px;
    height: 18px;
  }

  .header-info h2 {
    font-family: var(--font-display);
    font-size: 1.375rem;
    font-weight: 600;
    color: var(--text-bright);
    margin: 0;
  }

  .header-accent {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      var(--signal-cyan) 0%,
      var(--border-panel) 50%,
      transparent 100%
    );
  }

  /* Form Content */
  .panel-content {
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  /* Form sections */
  .form-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-4);
    background: var(--panel-deep);
    border: 1px solid var(--border-dim);
    border-radius: var(--radius-lg);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text-secondary);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--border-dim);
    margin-bottom: var(--space-2);
  }

  .section-header svg {
    width: 16px;
    height: 16px;
    color: var(--signal-blue);
  }

  .section-header span {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.12em;
  }

  /* Error message */
  .error-message {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    background: rgba(255, 77, 77, 0.1);
    border: 1px solid rgba(255, 77, 77, 0.3);
    border-radius: var(--radius-md);
    color: #ff6b6b;
    font-size: 0.875rem;
  }

  .error-message svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  /* Form groups */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  .form-row-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--space-3);
  }

  .form-label {
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: var(--text-muted);
  }

  .form-input,
  .form-select,
  .form-textarea {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--text-primary);
    background: var(--panel);
    border: 1px solid var(--border-dim);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    transition: all var(--duration-fast) var(--ease-out-quad);
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--signal-blue);
    box-shadow: 0 0 0 2px rgba(77, 154, 255, 0.15);
  }

  .form-input:disabled,
  .form-select:disabled,
  .form-textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .form-input::placeholder,
  .form-textarea::placeholder {
    color: var(--text-dim);
  }

  .form-textarea {
    resize: vertical;
    min-height: 80px;
  }

  /* Input with status */
  .input-with-status {
    position: relative;
  }

  .lookup-status {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-2);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
  }

  .lookup-status.finding {
    color: var(--signal-cyan);
  }

  .lookup-status.loading {
    color: var(--text-muted);
  }

  .lookup-status.ready {
    color: var(--signal-green);
  }

  .lookup-status svg {
    width: 12px;
    height: 12px;
  }

  .lookup-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  /* Select wrapper */
  .select-wrapper {
    position: relative;
  }

  .form-select {
    width: 100%;
    appearance: none;
    cursor: pointer;
    padding-right: var(--space-8);
  }

  .select-arrow {
    position: absolute;
    right: var(--space-3);
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    color: var(--text-muted);
    pointer-events: none;
  }

  /* Form actions */
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--border-dim);
  }

  .btn-cancel,
  .btn-save {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    padding: var(--space-3) var(--space-5);
    border-radius: var(--radius-md);
    transition: all var(--duration-fast) var(--ease-out-quad);
    cursor: pointer;
  }

  .btn-cancel {
    color: var(--text-muted);
    background: transparent;
    border: 1px solid var(--border-dim);
  }

  .btn-cancel:hover:not(:disabled) {
    color: var(--text-primary);
    border-color: var(--border-panel);
    background: var(--panel-hover);
  }

  .btn-save {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--bg-base);
    background: var(--signal-blue);
    border: none;
  }

  .btn-save:hover:not(:disabled) {
    background: var(--signal-blue-bright, #5ba3ff);
  }

  .btn-cancel:disabled,
  .btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Spinner */
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
