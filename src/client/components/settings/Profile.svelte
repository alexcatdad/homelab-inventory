<script lang="ts">
  import { useQuery } from 'convex-svelte';
  import { api } from '../../../../convex/_generated/api';

  const userQuery = useQuery(api.auth.currentUser, {});

  let user = $derived(userQuery.data);
  let isLoading = $derived(userQuery.isLoading);

  // Format the creation time as a date
  let signupDate = $derived(
    user?._creationTime
      ? new Date(user._creationTime).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null
  );

  let signupTime = $derived(
    user?._creationTime
      ? new Date(user._creationTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : null
  );
</script>

<mc-panel>
  <div class="section-header">
    <div class="section-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
    <div class="section-title">
      <h2>PROFILE</h2>
      <p>Your account information</p>
    </div>
  </div>

  {#if isLoading}
    <div class="loading">
      <span class="spinner"></span>
      Loading profile...
    </div>
  {:else if user}
    <div class="profile-content">
      <!-- Avatar and Name -->
      <div class="profile-header">
        <div class="avatar-wrapper">
          {#if user.image}
            <img src={user.image} alt="Profile" class="avatar" />
          {:else}
            <div class="avatar-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          {/if}
          <div class="avatar-badge">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>
        </div>
        <div class="profile-name">
          <h3>{user.name || 'Unknown User'}</h3>
          <span class="auth-provider">GitHub Account</span>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">EMAIL</span>
          <span class="info-value">{user.email || 'Not provided'}</span>
        </div>

        <div class="info-item">
          <span class="info-label">MEMBER SINCE</span>
          <span class="info-value">
            {#if signupDate}
              {signupDate}
              <span class="info-sub">{signupTime}</span>
            {:else}
              Unknown
            {/if}
          </span>
        </div>

        <div class="info-item">
          <span class="info-label">USER ID</span>
          <span class="info-value mono">{user._id}</span>
        </div>
      </div>
    </div>
  {:else}
    <div class="error">Unable to load profile</div>
  {/if}
</mc-panel>

<style>
  .section-header {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
  }

  .section-icon {
    width: 40px;
    height: 40px;
    color: var(--signal-blue);
    flex-shrink: 0;
  }

  .section-icon svg {
    width: 100%;
    height: 100%;
  }

  .section-title h2 {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text-bright);
    margin: 0 0 var(--space-1) 0;
  }

  .section-title p {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 0;
  }

  .loading {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--border-panel);
    border-top-color: var(--signal-blue);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .profile-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  /* Profile Header */
  .profile-header {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .avatar-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  .avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 2px solid var(--signal-blue);
    box-shadow: 0 0 20px var(--signal-blue-glow);
  }

  .avatar-placeholder {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 2px solid var(--border-panel);
    background: var(--panel-deep);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-dim);
  }

  .avatar-placeholder svg {
    width: 36px;
    height: 36px;
  }

  .avatar-badge {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 24px;
    height: 24px;
    background: var(--panel);
    border: 2px solid var(--panel-deep);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
  }

  .avatar-badge svg {
    width: 14px;
    height: 14px;
  }

  .profile-name h3 {
    font-family: var(--font-mono);
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-bright);
    margin: 0 0 var(--space-1) 0;
  }

  .auth-provider {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.1em;
    color: var(--text-dim);
    text-transform: uppercase;
  }

  /* Info Grid */
  .info-grid {
    display: grid;
    gap: var(--space-4);
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-3);
    background: var(--panel-deep);
    border: 1px solid var(--border-dim);
    border-radius: var(--radius-md);
  }

  .info-label {
    font-family: var(--font-mono);
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: var(--text-dim);
  }

  .info-value {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--text-secondary);
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  .info-value.mono {
    font-size: 0.6875rem;
    color: var(--text-muted);
    word-break: break-all;
  }

  .info-sub {
    font-size: 0.6875rem;
    color: var(--text-dim);
  }

  .error {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--signal-red);
  }
</style>
