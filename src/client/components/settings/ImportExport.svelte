<script lang="ts">
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '../../../../convex/_generated/api';

  const client = useConvexClient();

  // Export state
  let exporting = $state(false);
  let exportError = $state<string | null>(null);

  // Import state
  let importing = $state(false);
  let importProgress = $state('');
  let importError = $state<string | null>(null);
  let selectedFile = $state<File | null>(null);
  let parsedData = $state<any>(null);
  let parseError = $state<string | null>(null);
  let duplicateHandling = $state<'skip' | 'rename' | 'replace'>('skip');
  let importResults = $state<{
    devices: { imported: number; skipped: number; renamed: number; replaced: number; errors: string[] };
    connections: { imported: number; skipped: number; errors: string[] };
    specsCache: { imported: number; skipped: number; errors: string[] };
  } | null>(null);

  // Preview data
  let preview = $derived(parsedData ? {
    deviceCount: parsedData.data?.devices?.length || 0,
    connectionCount: parsedData.data?.network_connections?.length || 0,
    specsCacheCount: parsedData.data?.specs_cache?.length || 0,
    version: parsedData.version || 'unknown',
    exportedAt: parsedData.exported_at || 'unknown',
  } : null);

  async function handleExport() {
    exporting = true;
    exportError = null;

    try {
      const exportData = await client.query(api.dataExport.exportAll, {});
      if (!exportData) {
        throw new Error('Failed to fetch export data - are you logged in?');
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `homelab-backup-${timestamp}.json`;

      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      exportError = e instanceof Error ? e.message : 'Export failed';
    } finally {
      exporting = false;
    }
  }

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      selectedFile = null;
      parsedData = null;
      parseError = null;
      return;
    }

    selectedFile = file;
    parseError = null;
    importResults = null;

    // Parse the file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        // Handle both old format (devices at root) and new format (data.devices)
        let normalizedData;
        if (json.data && json.data.devices) {
          // New format with wrapper
          normalizedData = json;
        } else if (json.devices && Array.isArray(json.devices)) {
          // Old format - wrap it
          normalizedData = {
            version: '1.0',
            exported_at: new Date().toISOString(),
            source: 'legacy-export',
            data: {
              devices: json.devices,
              network_connections: json.network_connections || [],
              specs_cache: json.specs_cache || [],
            }
          };
        } else {
          throw new Error('Invalid backup format: missing devices array');
        }

        parsedData = normalizedData;
      } catch (e) {
        parseError = e instanceof Error ? e.message : 'Failed to parse JSON file';
        parsedData = null;
      }
    };
    reader.onerror = () => {
      parseError = 'Failed to read file';
      parsedData = null;
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!parsedData) return;

    importing = true;
    importError = null;
    importResults = null;

    try {
      // Step 1: Import devices
      importProgress = 'Importing devices...';
      const deviceResult = await client.mutation(api.dataImport.importDevices, {
        devices: parsedData.data.devices,
        duplicateHandling,
      });

      // Step 2: Import connections with name mapping
      importProgress = 'Importing network connections...';
      const connectionResult = await client.mutation(api.dataImport.importConnections, {
        connections: parsedData.data.network_connections || [],
        deviceNameMap: deviceResult.deviceNameMap,
      });

      // Step 3: Import specs cache
      importProgress = 'Importing specs cache...';
      let specsCacheResult = { imported: 0, skipped: 0, errors: [] as string[] };
      if (parsedData.data.specs_cache?.length > 0) {
        specsCacheResult = await client.mutation(api.dataImport.importSpecsCache, {
          cache: parsedData.data.specs_cache,
        });
      }

      importResults = {
        devices: deviceResult,
        connections: connectionResult,
        specsCache: specsCacheResult,
      };

      // Clear file selection on success
      selectedFile = null;
      parsedData = null;

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (e) {
      importError = e instanceof Error ? e.message : 'Import failed';
    } finally {
      importing = false;
      importProgress = '';
    }
  }

  function clearImport() {
    selectedFile = null;
    parsedData = null;
    parseError = null;
    importResults = null;
    importError = null;

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }
</script>

<mc-panel>
  <div class="section-header">
    <div class="section-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    </div>
    <div class="section-title">
      <h2>DATA MANAGEMENT</h2>
      <p>Export backups and import data</p>
    </div>
  </div>

  <div class="sections">
    <!-- Export Section -->
    <div class="subsection">
      <h3>Export Backup</h3>
      <p class="description">Download a JSON backup of your entire inventory including devices, network connections, and specs cache.</p>

      <button class="action-button" onclick={handleExport} disabled={exporting}>
        {#if exporting}
          <span class="spinner"></span>
          Exporting...
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export JSON
        {/if}
      </button>

      {#if exportError}
        <div class="error-message">{exportError}</div>
      {/if}
    </div>

    <div class="divider"></div>

    <!-- Import Section -->
    <div class="subsection">
      <h3>Import Data</h3>
      <p class="description">Restore from a backup file or import data from another source.</p>

      <div class="file-input-wrapper">
        <input
          type="file"
          accept=".json"
          onchange={handleFileSelect}
          id="import-file"
        />
        <label for="import-file" class="file-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {selectedFile ? selectedFile.name : 'Choose JSON file...'}
        </label>
      </div>

      {#if parseError}
        <div class="error-message">{parseError}</div>
      {/if}

      {#if preview}
        <div class="preview-card">
          <div class="preview-header">
            <span class="preview-badge">PREVIEW</span>
            <span class="preview-version">v{preview.version}</span>
          </div>
          <div class="preview-stats">
            <div class="preview-stat">
              <span class="stat-value">{preview.deviceCount}</span>
              <span class="stat-label">Devices</span>
            </div>
            <div class="preview-stat">
              <span class="stat-value">{preview.connectionCount}</span>
              <span class="stat-label">Connections</span>
            </div>
            <div class="preview-stat">
              <span class="stat-value">{preview.specsCacheCount}</span>
              <span class="stat-label">Cached Specs</span>
            </div>
          </div>
          {#if preview.exportedAt !== 'unknown'}
            <div class="preview-date">
              Exported: {new Date(preview.exportedAt).toLocaleString()}
            </div>
          {/if}
        </div>

        <div class="import-options">
          <label class="option-label">If device name already exists:</label>
          <div class="radio-group">
            <label class="radio-option">
              <input type="radio" bind:group={duplicateHandling} value="skip" />
              <span class="radio-text">
                <strong>Skip</strong>
                <small>Keep existing, ignore imported</small>
              </span>
            </label>
            <label class="radio-option">
              <input type="radio" bind:group={duplicateHandling} value="rename" />
              <span class="radio-text">
                <strong>Rename</strong>
                <small>Add number suffix (e.g., "Device (1)")</small>
              </span>
            </label>
            <label class="radio-option">
              <input type="radio" bind:group={duplicateHandling} value="replace" />
              <span class="radio-text">
                <strong>Replace</strong>
                <small>Overwrite existing with imported</small>
              </span>
            </label>
          </div>
        </div>

        <div class="import-actions">
          <button class="action-button secondary" onclick={clearImport}>
            Cancel
          </button>
          <button class="action-button" onclick={handleImport} disabled={importing}>
            {#if importing}
              <span class="spinner"></span>
              {importProgress || 'Importing...'}
            {:else}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Import Data
            {/if}
          </button>
        </div>
      {/if}

      {#if importError}
        <div class="error-message">{importError}</div>
      {/if}

      {#if importResults}
        <div class="results-card">
          <div class="results-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Import Complete
          </div>

          <div class="results-section">
            <h4>Devices</h4>
            <div class="results-stats">
              <span class="result-stat success">{importResults.devices.imported} imported</span>
              {#if importResults.devices.renamed > 0}
                <span class="result-stat warning">{importResults.devices.renamed} renamed</span>
              {/if}
              {#if importResults.devices.replaced > 0}
                <span class="result-stat warning">{importResults.devices.replaced} replaced</span>
              {/if}
              {#if importResults.devices.skipped > 0}
                <span class="result-stat muted">{importResults.devices.skipped} skipped</span>
              {/if}
            </div>
          </div>

          <div class="results-section">
            <h4>Network Connections</h4>
            <div class="results-stats">
              <span class="result-stat success">{importResults.connections.imported} imported</span>
              {#if importResults.connections.skipped > 0}
                <span class="result-stat muted">{importResults.connections.skipped} skipped</span>
              {/if}
            </div>
          </div>

          <div class="results-section">
            <h4>Specs Cache</h4>
            <div class="results-stats">
              <span class="result-stat success">{importResults.specsCache.imported} imported</span>
              {#if importResults.specsCache.skipped > 0}
                <span class="result-stat muted">{importResults.specsCache.skipped} skipped</span>
              {/if}
            </div>
          </div>

          {#if importResults.devices.errors.length > 0 || importResults.connections.errors.length > 0}
            <details class="errors-details">
              <summary>
                Errors ({importResults.devices.errors.length + importResults.connections.errors.length})
              </summary>
              <ul class="errors-list">
                {#each importResults.devices.errors as error}
                  <li>{error}</li>
                {/each}
                {#each importResults.connections.errors as error}
                  <li>{error}</li>
                {/each}
              </ul>
            </details>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</mc-panel>

<style>
  .section-header {
    display: flex;
    align-items: flex-start;
    gap: var(--tui-space-4);
    margin-bottom: var(--tui-space-6);
  }

  .section-icon {
    width: 40px;
    height: 40px;
    color: var(--tui-info);
    flex-shrink: 0;
  }

  .section-icon svg {
    width: 100%;
    height: 100%;
  }

  .section-title h2 {
    font-family: var(--tui-font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--tui-text-bright);
    margin: 0 0 var(--tui-space-1) 0;
  }

  .section-title p {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    color: var(--tui-text-muted);
    margin: 0;
  }

  .sections {
    display: flex;
    flex-direction: column;
    gap: var(--tui-space-6);
  }

  .subsection h3 {
    font-family: var(--tui-font-mono);
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--tui-text-muted);
    margin: 0 0 var(--tui-space-2) 0;
  }

  .description {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    color: var(--tui-text-muted);
    margin: 0 0 var(--tui-space-4) 0;
    line-height: 1.5;
  }

  .divider {
    height: 1px;
    background: var(--tui-border);
  }

  /* Action Button */
  .action-button {
    display: inline-flex;
    align-items: center;
    gap: var(--tui-space-2);
    padding: var(--tui-space-3) var(--tui-space-4);
    background: var(--tui-info);
    border: 1px solid var(--tui-info);
    border-radius: var(--tui-radius-md);
    color: var(--tui-panel-deep);
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all var(--duration-base) var(--ease-out-quad);
  }

  .action-button:hover:not(:disabled) {
    background: var(--signal-blue-bright);
    box-shadow: 0 0 16px var(--signal-blue-glow);
  }

  .action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .action-button svg {
    width: 16px;
    height: 16px;
  }

  .action-button.secondary {
    background: transparent;
    border-color: var(--tui-border);
    color: var(--tui-text-muted);
  }

  .action-button.secondary:hover:not(:disabled) {
    border-color: var(--tui-text-muted);
    color: var(--tui-text-muted);
    box-shadow: none;
  }

  /* Spinner */
  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* File Input */
  .file-input-wrapper {
    margin-bottom: var(--tui-space-4);
  }

  .file-input-wrapper input[type="file"] {
    display: none;
  }

  .file-label {
    display: inline-flex;
    align-items: center;
    gap: var(--tui-space-2);
    padding: var(--tui-space-3) var(--tui-space-4);
    background: var(--tui-panel-deep);
    border: 1px dashed var(--tui-border);
    border-radius: var(--tui-radius-md);
    color: var(--tui-text-muted);
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all var(--duration-base) var(--ease-out-quad);
  }

  .file-label:hover {
    border-color: var(--tui-info);
    color: var(--tui-info);
  }

  .file-label svg {
    width: 16px;
    height: 16px;
  }

  /* Preview Card */
  .preview-card {
    background: var(--tui-panel-deep);
    border: 1px solid var(--tui-border);
    border-radius: var(--tui-radius-md);
    padding: var(--tui-space-4);
    margin-bottom: var(--tui-space-4);
  }

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--tui-space-3);
  }

  .preview-badge {
    font-family: var(--tui-font-mono);
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--tui-info);
    background: rgba(0, 168, 255, 0.1);
    padding: var(--tui-space-1) var(--tui-space-2);
    border-radius: var(--tui-radius-sm);
  }

  .preview-version {
    font-family: var(--tui-font-mono);
    font-size: 0.6875rem;
    color: var(--tui-text-dim);
  }

  .preview-stats {
    display: flex;
    gap: var(--tui-space-6);
    margin-bottom: var(--tui-space-3);
  }

  .preview-stat {
    display: flex;
    flex-direction: column;
    gap: var(--tui-space-1);
  }

  .preview-stat .stat-value {
    font-family: var(--tui-font-mono);
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--tui-text-bright);
  }

  .preview-stat .stat-label {
    font-family: var(--tui-font-mono);
    font-size: 0.625rem;
    letter-spacing: 0.1em;
    color: var(--tui-text-dim);
    text-transform: uppercase;
  }

  .preview-date {
    font-family: var(--tui-font-mono);
    font-size: 0.6875rem;
    color: var(--tui-text-dim);
  }

  /* Import Options */
  .import-options {
    margin-bottom: var(--tui-space-4);
  }

  .option-label {
    display: block;
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    color: var(--tui-text-muted);
    margin-bottom: var(--tui-space-3);
  }

  .radio-group {
    display: flex;
    flex-direction: column;
    gap: var(--tui-space-2);
  }

  .radio-option {
    display: flex;
    align-items: flex-start;
    gap: var(--tui-space-3);
    padding: var(--tui-space-3);
    background: var(--tui-panel-deep);
    border: 1px solid var(--tui-border);
    border-radius: var(--tui-radius-md);
    cursor: pointer;
    transition: all var(--duration-base) var(--ease-out-quad);
  }

  .radio-option:hover {
    border-color: var(--tui-border);
  }

  .radio-option:has(input:checked) {
    border-color: var(--tui-info);
    background: rgba(0, 168, 255, 0.05);
  }

  .radio-option input {
    margin-top: 2px;
    accent-color: var(--tui-info);
  }

  .radio-text {
    display: flex;
    flex-direction: column;
    gap: var(--tui-space-1);
  }

  .radio-text strong {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--tui-text-muted);
  }

  .radio-text small {
    font-family: var(--tui-font-mono);
    font-size: 0.6875rem;
    color: var(--tui-text-dim);
  }

  /* Import Actions */
  .import-actions {
    display: flex;
    gap: var(--tui-space-3);
    justify-content: flex-end;
  }

  /* Results Card */
  .results-card {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: var(--tui-radius-md);
    padding: var(--tui-space-4);
    margin-top: var(--tui-space-4);
  }

  .results-header {
    display: flex;
    align-items: center;
    gap: var(--tui-space-2);
    font-family: var(--tui-font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    color: rgb(34, 197, 94);
    margin-bottom: var(--tui-space-4);
  }

  .results-header svg {
    width: 20px;
    height: 20px;
  }

  .results-section {
    margin-bottom: var(--tui-space-3);
  }

  .results-section:last-of-type {
    margin-bottom: 0;
  }

  .results-section h4 {
    font-family: var(--tui-font-mono);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--tui-text-muted);
    text-transform: uppercase;
    margin: 0 0 var(--tui-space-2) 0;
  }

  .results-stats {
    display: flex;
    gap: var(--tui-space-3);
    flex-wrap: wrap;
  }

  .result-stat {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    padding: var(--tui-space-1) var(--tui-space-2);
    border-radius: var(--tui-radius-sm);
  }

  .result-stat.success {
    background: rgba(34, 197, 94, 0.2);
    color: rgb(34, 197, 94);
  }

  .result-stat.warning {
    background: rgba(234, 179, 8, 0.2);
    color: rgb(234, 179, 8);
  }

  .result-stat.muted {
    background: var(--tui-panel-deep);
    color: var(--tui-text-dim);
  }

  /* Errors */
  .error-message {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    color: var(--tui-danger);
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: var(--tui-radius-md);
    padding: var(--tui-space-3);
    margin-top: var(--tui-space-3);
  }

  .errors-details {
    margin-top: var(--tui-space-3);
  }

  .errors-details summary {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    color: var(--tui-danger);
    cursor: pointer;
  }

  .errors-list {
    font-family: var(--tui-font-mono);
    font-size: 0.6875rem;
    color: var(--tui-text-dim);
    margin: var(--tui-space-2) 0 0 var(--tui-space-4);
    padding: 0;
  }

  .errors-list li {
    margin-bottom: var(--tui-space-1);
  }
</style>
