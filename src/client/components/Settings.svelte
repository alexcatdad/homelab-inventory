<script lang="ts">
  import Profile from './settings/Profile.svelte';
  import ImportExport from './settings/ImportExport.svelte';
</script>

<div class="settings">
  <!-- Page Header -->
  <div class="page-header">
    <div class="page-title">
      <span class="title-prefix">// </span>
      <h1>SETTINGS</h1>
    </div>
    <p class="page-subtitle">System configuration and data management</p>
  </div>

  <!-- Settings Sections -->
  <div class="settings-sections">
    <Profile />
    <ImportExport />
  </div>
</div>

<style>
  .settings {
    display: flex;
    flex-direction: column;
    gap: var(--tui-space-6);
  }

  .page-header {
    display: flex;
    flex-direction: column;
    gap: var(--tui-space-2);
  }

  .page-title {
    display: flex;
    align-items: center;
    gap: var(--tui-space-1);
  }

  .title-prefix {
    font-family: var(--tui-font-mono);
    font-size: 1.25rem;
    color: var(--tui-info);
  }

  .page-title h1 {
    font-family: var(--tui-font-mono);
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: var(--tui-text-bright);
  }

  .page-subtitle {
    font-family: var(--tui-font-mono);
    font-size: 0.75rem;
    color: var(--tui-text-muted);
    letter-spacing: 0.05em;
    padding-left: 1.75rem;
  }

  .settings-sections {
    display: flex;
    flex-direction: column;
    gap: var(--tui-space-6);
    max-width: 800px;
  }
</style>
