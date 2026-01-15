# Hosted SaaS MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Launch Homelab Inventory as a hosted SaaS with landing page, supporter system, sample data onboarding, and legal pages.

**Architecture:** Add URL-based routing to serve public pages (landing, supporters, legal) without authentication. Extend Convex schema for supporter data. Integrate Stripe for payments. Seed sample data on first login.

**Tech Stack:** Svelte 5, Convex, Stripe, TypeScript

---

## Task 1: Add Client-Side URL Router

**Files:**
- Create: `src/client/lib/router.ts`
- Modify: `src/client/App.svelte`
- Modify: `src/client/lib/stores.ts`

**Step 1: Create router store**

```typescript
// src/client/lib/router.ts
import { writable, derived } from 'svelte/store';

export type Route =
  | { page: 'landing' }
  | { page: 'supporters' }
  | { page: 'privacy' }
  | { page: 'terms' }
  | { page: 'app' };  // The main authenticated app

function parseRoute(path: string): Route {
  switch (path) {
    case '/':
      return { page: 'landing' };
    case '/supporters':
      return { page: 'supporters' };
    case '/privacy':
      return { page: 'privacy' };
    case '/terms':
      return { page: 'terms' };
    case '/app':
    default:
      return { page: 'app' };
  }
}

function createRouter() {
  const path = writable(window.location.pathname);

  // Listen for popstate (browser back/forward)
  window.addEventListener('popstate', () => {
    path.set(window.location.pathname);
  });

  return {
    subscribe: path.subscribe,
    navigate: (newPath: string) => {
      window.history.pushState({}, '', newPath);
      path.set(newPath);
    },
    route: derived(path, parseRoute)
  };
}

export const router = createRouter();
```

**Step 2: Run dev server to verify no syntax errors**

Run: `bun run dev`
Expected: Server starts without errors

**Step 3: Commit**

```bash
git add src/client/lib/router.ts
git commit -m "feat: add client-side URL router for public pages"
```

---

## Task 2: Create Landing Page Component

**Files:**
- Create: `src/client/components/public/LandingPage.svelte`
- Create: `src/client/components/public/FeatureCard.svelte`

**Step 1: Create FeatureCard component**

```svelte
<!-- src/client/components/public/FeatureCard.svelte -->
<script lang="ts">
  interface Props {
    icon: string;
    title: string;
    description: string;
  }

  let { icon, title, description }: Props = $props();
</script>

<div class="feature-card">
  <div class="feature-icon">{icon}</div>
  <h3>{title}</h3>
  <p>{description}</p>
</div>

<style>
  .feature-card {
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    text-align: center;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .feature-card:hover {
    transform: translateY(-2px);
    border-color: var(--signal-blue);
  }

  .feature-icon {
    font-size: 2rem;
    margin-bottom: var(--space-3);
  }

  h3 {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text-primary);
    margin-bottom: var(--space-2);
  }

  p {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }
</style>
```

**Step 2: Create LandingPage component**

```svelte
<!-- src/client/components/public/LandingPage.svelte -->
<script lang="ts">
  import { router } from '../../lib/router';
  import FeatureCard from './FeatureCard.svelte';

  const features = [
    { icon: '📊', title: 'DASHBOARD', description: 'See your entire homelab at a glance' },
    { icon: '🔗', title: 'NETWORK TOPOLOGY', description: 'Visualize how everything connects' },
    { icon: '💾', title: 'STORAGE OVERVIEW', description: 'Track drives across all devices' },
    { icon: '🤖', title: 'AI SPEC LOOKUP', description: 'Auto-fill device specifications' },
    { icon: '🌍', title: 'MULTI-LANGUAGE', description: 'English & Romanian (more coming)' },
    { icon: '📱', title: 'RESPONSIVE', description: 'Works on desktop, tablet, mobile' },
  ];

  function goToApp() {
    router.navigate('/app');
  }
</script>

<div class="landing">
  <!-- Hero Section -->
  <header class="hero">
    <div class="hero-content">
      <h1>A homelab inventory tool you'll actually enjoy using</h1>
      <p class="subtitle">Track your gear. Visualize your network. Stop forgetting what you have.</p>
      <button class="cta-button" onclick={goToApp}>
        Get Started — Free
      </button>
    </div>
  </header>

  <!-- Features Section -->
  <section class="features">
    <h2>Features</h2>
    <div class="feature-grid">
      {#each features as feature}
        <FeatureCard {...feature} />
      {/each}
    </div>
  </section>

  <!-- Story Section -->
  <section class="story">
    <h2>Why I Built This</h2>
    <p>
      I tried existing tools but couldn't find one that clicked for me.
      So I built something simple and beautiful that I actually wanted to use.
      Maybe you'll like it too.
    </p>
  </section>

  <!-- Supporters Section -->
  <section class="supporters-cta">
    <h2>Support the Project</h2>
    <p>
      This tool is completely free. If you find it useful, consider becoming a supporter
      to help keep it running.
    </p>
    <a href="/supporters" class="supporters-link">View Supporters →</a>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <nav class="footer-links">
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="/supporters">Supporters</a>
    </nav>
    <p class="footer-credit">Made for the homelab community</p>
  </footer>
</div>

<style>
  .landing {
    min-height: 100vh;
    background: var(--bg-primary);
  }

  /* Hero */
  .hero {
    padding: var(--space-8) var(--space-6);
    text-align: center;
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hero-content {
    max-width: 600px;
  }

  .hero h1 {
    font-family: var(--font-mono);
    font-size: clamp(1.5rem, 4vw, 2.5rem);
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--text-bright);
    margin-bottom: var(--space-4);
    line-height: 1.3;
  }

  .subtitle {
    font-size: 1.125rem;
    color: var(--text-secondary);
    margin-bottom: var(--space-6);
  }

  .cta-button {
    background: var(--signal-blue);
    color: var(--bg-primary);
    border: none;
    padding: var(--space-3) var(--space-6);
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 200, 255, 0.3);
  }

  /* Features */
  .features {
    padding: var(--space-8) var(--space-6);
    max-width: 1200px;
    margin: 0 auto;
  }

  .features h2 {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    letter-spacing: 0.15em;
    color: var(--signal-blue);
    text-align: center;
    margin-bottom: var(--space-6);
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space-4);
  }

  /* Story */
  .story {
    padding: var(--space-8) var(--space-6);
    max-width: 600px;
    margin: 0 auto;
    text-align: center;
  }

  .story h2 {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    letter-spacing: 0.15em;
    color: var(--signal-blue);
    margin-bottom: var(--space-4);
  }

  .story p {
    font-size: 1rem;
    color: var(--text-secondary);
    line-height: 1.7;
  }

  /* Supporters CTA */
  .supporters-cta {
    padding: var(--space-8) var(--space-6);
    text-align: center;
    background: var(--panel-bg);
    border-top: 1px solid var(--panel-border);
    border-bottom: 1px solid var(--panel-border);
  }

  .supporters-cta h2 {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    letter-spacing: 0.15em;
    color: var(--text-primary);
    margin-bottom: var(--space-3);
  }

  .supporters-cta p {
    color: var(--text-secondary);
    margin-bottom: var(--space-4);
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }

  .supporters-link {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    color: var(--signal-blue);
    text-decoration: none;
    letter-spacing: 0.05em;
  }

  .supporters-link:hover {
    text-decoration: underline;
  }

  /* Footer */
  .footer {
    padding: var(--space-6);
    text-align: center;
  }

  .footer-links {
    display: flex;
    justify-content: center;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
    flex-wrap: wrap;
  }

  .footer-links a {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-muted);
    text-decoration: none;
    letter-spacing: 0.05em;
  }

  .footer-links a:hover {
    color: var(--signal-blue);
  }

  .footer-credit {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-dim);
    letter-spacing: 0.05em;
  }
</style>
```

**Step 3: Run dev server to verify components render**

Run: `bun run dev`
Expected: No errors in console

**Step 4: Commit**

```bash
git add src/client/components/public/
git commit -m "feat: add landing page with feature grid"
```

---

## Task 3: Create Legal Pages (Privacy & Terms)

**Files:**
- Create: `src/client/components/public/PrivacyPage.svelte`
- Create: `src/client/components/public/TermsPage.svelte`

**Step 1: Create PrivacyPage component**

```svelte
<!-- src/client/components/public/PrivacyPage.svelte -->
<script lang="ts">
  import { router } from '../../lib/router';
</script>

<div class="legal-page">
  <a href="/" class="back-link" onclick={(e) => { e.preventDefault(); router.navigate('/'); }}>
    ← Back to Home
  </a>

  <h1>Privacy Policy</h1>

  <section>
    <h2>Your data, your stuff</h2>
    <p>
      We use GitHub OAuth for sign-in, so we never see or store your password.
      We don't manage accounts — GitHub does.
    </p>
    <p>
      The only data we store is what you put into the app: your devices, specs, and network info.
      None of this is uniquely identifiable to you — it's just your gear.
    </p>
  </section>

  <section>
    <h2>Deleting your data</h2>
    <p>Request it, and it's gone automatically.</p>
  </section>

  <section>
    <h2>Exporting your data</h2>
    <p>Available anytime. Exports run on a schedule, so give it a moment.</p>
  </section>

  <section>
    <h2>Infrastructure</h2>
    <p>We use Convex for our backend. Your data lives there.</p>
  </section>

  <section>
    <h2>The bottom line</h2>
    <p>We don't sell your data. We don't share it. It's yours.</p>
  </section>
</div>

<style>
  .legal-page {
    max-width: 700px;
    margin: 0 auto;
    padding: var(--space-6);
    min-height: 100vh;
  }

  .back-link {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--signal-blue);
    text-decoration: none;
    margin-bottom: var(--space-6);
    letter-spacing: 0.05em;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  h1 {
    font-family: var(--font-mono);
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text-bright);
    margin-bottom: var(--space-6);
  }

  section {
    margin-bottom: var(--space-6);
  }

  h2 {
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--signal-blue);
    margin-bottom: var(--space-2);
  }

  p {
    color: var(--text-secondary);
    line-height: 1.7;
    margin-bottom: var(--space-2);
  }
</style>
```

**Step 2: Create TermsPage component**

```svelte
<!-- src/client/components/public/TermsPage.svelte -->
<script lang="ts">
  import { router } from '../../lib/router';
</script>

<div class="legal-page">
  <a href="/" class="back-link" onclick={(e) => { e.preventDefault(); router.navigate('/'); }}>
    ← Back to Home
  </a>

  <h1>Terms of Service</h1>

  <section>
    <h2>The basics</h2>
    <p>Don't spam. Don't hack. Don't be a jerk.</p>
  </section>

  <section>
    <h2>No guarantees</h2>
    <p>
      This is a passion project. Things might break. We'll do our best, but no promises.
    </p>
  </section>

  <section>
    <h2>No refunds</h2>
    <p>
      Supporter payments are donations to help keep the project alive.
      No refunds, but you can cancel anytime.
    </p>
  </section>

  <section>
    <h2>We're all figuring this out</h2>
    <p>
      We're not lawyers, just homelab nerds sharing a tool. Be cool and we'll be cool.
    </p>
  </section>
</div>

<style>
  .legal-page {
    max-width: 700px;
    margin: 0 auto;
    padding: var(--space-6);
    min-height: 100vh;
  }

  .back-link {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--signal-blue);
    text-decoration: none;
    margin-bottom: var(--space-6);
    letter-spacing: 0.05em;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  h1 {
    font-family: var(--font-mono);
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text-bright);
    margin-bottom: var(--space-6);
  }

  section {
    margin-bottom: var(--space-6);
  }

  h2 {
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--signal-blue);
    margin-bottom: var(--space-2);
  }

  p {
    color: var(--text-secondary);
    line-height: 1.7;
  }
</style>
```

**Step 3: Commit**

```bash
git add src/client/components/public/PrivacyPage.svelte src/client/components/public/TermsPage.svelte
git commit -m "feat: add privacy policy and terms of service pages"
```

---

## Task 4: Create Supporters Page

**Files:**
- Create: `src/client/components/public/SupportersPage.svelte`
- Create: `convex/supporters.ts`
- Modify: `convex/schema.ts`

**Step 1: Add supporters table to schema**

```typescript
// Add to convex/schema.ts after existing tables:

  // Supporters table (public, for listing)
  supporters: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    type: v.union(v.literal("monthly"), v.literal("one-time")),
    // Stripe-related
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    // Status
    isActive: v.boolean(),
    supportedAt: v.number(), // timestamp
  })
    .index("by_user", ["userId"])
    .index("by_active", ["isActive"])
    .index("by_type", ["type"]),
```

**Step 2: Create supporters query**

```typescript
// convex/supporters.ts
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// List all active supporters (public)
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const supporters = await ctx.db
      .query("supporters")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Sort by most recent first
    supporters.sort((a, b) => b.supportedAt - a.supportedAt);

    return supporters.map(s => ({
      displayName: s.displayName,
      avatarUrl: s.avatarUrl,
      type: s.type,
      supportedAt: s.supportedAt,
    }));
  },
});

// Check if current user is a supporter
export const currentUserSupporter = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const supporter = await ctx.db
      .query("supporters")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!supporter || !supporter.isActive) return null;

    return {
      type: supporter.type,
      supportedAt: supporter.supportedAt,
    };
  },
});
```

**Step 3: Create SupportersPage component**

```svelte
<!-- src/client/components/public/SupportersPage.svelte -->
<script lang="ts">
  import { router } from '../../lib/router';
  import { useQuery } from 'convex-svelte';
  import { api } from '../../../../convex/_generated/api';

  const supporters = useQuery(api.supporters.listActive, {});
</script>

<div class="supporters-page">
  <a href="/" class="back-link" onclick={(e) => { e.preventDefault(); router.navigate('/'); }}>
    ← Back to Home
  </a>

  <header class="page-header">
    <h1>Supporters</h1>
    <p class="subtitle">These cool people keep the project alive</p>
  </header>

  <section class="become-supporter">
    <p>Want to support the project?</p>
    <div class="support-options">
      <a href="#monthly" class="support-button monthly">
        Become a Monthly Supporter
      </a>
      <a href="#one-time" class="support-button one-time">
        Make a One-Time Donation
      </a>
    </div>
  </section>

  <section class="supporters-list">
    {#if supporters.isLoading}
      <div class="loading">Loading supporters...</div>
    {:else if supporters.data && supporters.data.length > 0}
      <div class="supporters-grid">
        {#each supporters.data as supporter}
          <div class="supporter-card">
            {#if supporter.avatarUrl}
              <img src={supporter.avatarUrl} alt="" class="avatar" />
            {:else}
              <div class="avatar placeholder">
                {supporter.displayName.charAt(0).toUpperCase()}
              </div>
            {/if}
            <span class="name">{supporter.displayName}</span>
            <span class="badge {supporter.type}">
              {supporter.type === 'monthly' ? '⭐ Monthly' : '💜 One-time'}
            </span>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <p>Be the first supporter!</p>
      </div>
    {/if}
  </section>
</div>

<style>
  .supporters-page {
    max-width: 900px;
    margin: 0 auto;
    padding: var(--space-6);
    min-height: 100vh;
  }

  .back-link {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--signal-blue);
    text-decoration: none;
    margin-bottom: var(--space-6);
    letter-spacing: 0.05em;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  .page-header {
    text-align: center;
    margin-bottom: var(--space-6);
  }

  .page-header h1 {
    font-family: var(--font-mono);
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text-bright);
    margin-bottom: var(--space-2);
  }

  .subtitle {
    color: var(--text-muted);
    font-size: 0.9375rem;
  }

  .become-supporter {
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    text-align: center;
    margin-bottom: var(--space-6);
  }

  .become-supporter p {
    color: var(--text-secondary);
    margin-bottom: var(--space-4);
  }

  .support-options {
    display: flex;
    gap: var(--space-3);
    justify-content: center;
    flex-wrap: wrap;
  }

  .support-button {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: transform 0.2s ease;
  }

  .support-button:hover {
    transform: translateY(-1px);
  }

  .support-button.monthly {
    background: var(--signal-blue);
    color: var(--bg-primary);
  }

  .support-button.one-time {
    background: transparent;
    border: 1px solid var(--signal-blue);
    color: var(--signal-blue);
  }

  .supporters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-4);
  }

  .supporter-card {
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
  }

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar.placeholder {
    background: var(--panel-active);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--text-primary);
  }

  .name {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .badge {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.05em;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
  }

  .badge.monthly {
    background: rgba(0, 200, 255, 0.1);
    color: var(--signal-blue);
  }

  .badge.one-time {
    background: rgba(168, 85, 247, 0.1);
    color: #a855f7;
  }

  .loading, .empty-state {
    text-align: center;
    padding: var(--space-6);
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.875rem;
  }
</style>
```

**Step 4: Run Convex to generate types**

Run: `bunx convex dev`
Expected: Schema synced, types generated

**Step 5: Commit**

```bash
git add convex/schema.ts convex/supporters.ts src/client/components/public/SupportersPage.svelte
git commit -m "feat: add supporters page with public listing"
```

---

## Task 5: Wire Up Router in App.svelte

**Files:**
- Modify: `src/client/App.svelte`

**Step 1: Update App.svelte to use router**

Add imports at top of script:
```typescript
import { router } from './lib/router';
import LandingPage from './components/public/LandingPage.svelte';
import SupportersPage from './components/public/SupportersPage.svelte';
import PrivacyPage from './components/public/PrivacyPage.svelte';
import TermsPage from './components/public/TermsPage.svelte';
```

Add route subscription:
```typescript
let currentRoute = $state<import('./lib/router').Route>({ page: 'landing' });

$effect(() => {
  const unsub = router.route.subscribe((r) => (currentRoute = r));
  return () => unsub();
});
```

**Step 2: Update template to handle public routes**

Replace the main template structure with routing logic that shows public pages without auth:

```svelte
<ErrorBoundary>
{#if currentRoute.page === 'landing'}
  <div class="app">
    <div class="bg-effects" aria-hidden="true">
      <!-- background effects -->
    </div>
    <LandingPage />
  </div>
{:else if currentRoute.page === 'supporters'}
  <div class="app">
    <div class="bg-effects" aria-hidden="true">
      <!-- background effects -->
    </div>
    <SupportersPage />
  </div>
{:else if currentRoute.page === 'privacy'}
  <div class="app">
    <div class="bg-effects" aria-hidden="true">
      <!-- background effects -->
    </div>
    <PrivacyPage />
  </div>
{:else if currentRoute.page === 'terms'}
  <div class="app">
    <div class="bg-effects" aria-hidden="true">
      <!-- background effects -->
    </div>
    <TermsPage />
  </div>
{:else if currentRoute.page === 'app'}
  <!-- Existing auth-gated app content -->
  {#if loading}
    <!-- loading UI -->
  {:else if !authenticated}
    <LoginPage />
  {:else}
    <!-- main app -->
  {/if}
{/if}
</ErrorBoundary>
```

**Step 3: Test routing manually**

Run: `bun run dev`
Test: Navigate to `/`, `/supporters`, `/privacy`, `/terms`, `/app`
Expected: Each page renders correctly

**Step 4: Commit**

```bash
git add src/client/App.svelte
git commit -m "feat: wire up URL router for public and app routes"
```

---

## Task 6: Add Sample Data System

**Files:**
- Create: `convex/sampleData.ts`
- Modify: `src/client/App.svelte` (trigger on first login)
- Create: `src/client/components/SampleDataBanner.svelte`

**Step 1: Create sample data seeding mutation**

```typescript
// convex/sampleData.ts
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc } from "./_generated/dataModel";

// Check if user has any devices (to determine if sample data should be seeded)
export const hasDevices = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const device = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return !!device;
  },
});

// Check if user has sample data
export const hasSampleData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const sampleDevice = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("notes"), "[SAMPLE DATA]"))
      .first();

    return !!sampleDevice;
  },
});

// Seed sample homelab data
export const seedSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Check if user already has devices
    const existing = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      throw new Error("User already has devices");
    }

    const sampleNote = "[SAMPLE DATA]";

    // Sample devices - enthusiast homelab
    const devices: Array<Omit<Doc<"devices">, "_id" | "_creationTime">> = [
      {
        userId,
        type: "Server",
        name: "Proxmox Host",
        model: "Custom Build",
        quantity: 1,
        location: "Server Rack",
        notes: sampleNote,
        specifications: {
          cpu: { model: "AMD Ryzen 9 5900X", cores: 12, threads: 24, tdp_watts: 105 },
          ram: { type: "DDR4", current_gb: 64, max_gb: 128 },
          motherboard: { model: "ASUS ProArt X570-Creator", chipset: "X570", form_factor: "ATX" },
        },
        storage: [
          { type: "NVMe", capacity_gb: 1000, model: "Samsung 980 Pro" },
          { type: "NVMe", capacity_gb: 1000, model: "Samsung 980 Pro" },
        ],
        gpus: [{ model: "NVIDIA Quadro P2000", vram_gb: 5 }],
      },
      {
        userId,
        type: "Server",
        name: "TrueNAS Scale",
        model: "Dell PowerEdge R720",
        quantity: 1,
        location: "Server Rack",
        notes: sampleNote,
        specifications: {
          cpu: { model: "Intel Xeon E5-2670 v2", cores: 10, threads: 20, tdp_watts: 115 },
          ram: { type: "DDR3", current_gb: 128, max_gb: 384 },
        },
        storage: [
          { type: "HDD", capacity_gb: 8000, model: "WD Red Plus" },
          { type: "HDD", capacity_gb: 8000, model: "WD Red Plus" },
          { type: "HDD", capacity_gb: 8000, model: "WD Red Plus" },
          { type: "HDD", capacity_gb: 8000, model: "WD Red Plus" },
          { type: "SSD", capacity_gb: 500, model: "Samsung 870 EVO" },
          { type: "SSD", capacity_gb: 500, model: "Samsung 870 EVO" },
        ],
      },
      {
        userId,
        type: "IoT",
        name: "Pi Cluster Node 1",
        model: "Raspberry Pi 4B",
        quantity: 1,
        location: "Desk",
        notes: sampleNote,
        specifications: {
          cpu: { model: "BCM2711", cores: 4, threads: 4, tdp_watts: 15 },
          ram: { type: "LPDDR4", current_gb: 8, max_gb: 8 },
        },
        storage: [{ type: "SSD", capacity_gb: 256, model: "Samsung T7" }],
      },
      {
        userId,
        type: "IoT",
        name: "Pi Cluster Node 2",
        model: "Raspberry Pi 4B",
        quantity: 1,
        location: "Desk",
        notes: sampleNote,
        specifications: {
          cpu: { model: "BCM2711", cores: 4, threads: 4, tdp_watts: 15 },
          ram: { type: "LPDDR4", current_gb: 8, max_gb: 8 },
        },
        storage: [{ type: "SSD", capacity_gb: 256, model: "Samsung T7" }],
      },
      {
        userId,
        type: "IoT",
        name: "Pi Cluster Node 3",
        model: "Raspberry Pi 4B",
        quantity: 1,
        location: "Desk",
        notes: sampleNote,
        specifications: {
          cpu: { model: "BCM2711", cores: 4, threads: 4, tdp_watts: 15 },
          ram: { type: "LPDDR4", current_gb: 8, max_gb: 8 },
        },
        storage: [{ type: "SSD", capacity_gb: 256, model: "Samsung T7" }],
      },
      {
        userId,
        type: "Network",
        name: "Main Switch",
        model: "UniFi Switch 24 PoE",
        quantity: 1,
        location: "Server Rack",
        notes: sampleNote,
        network_info: { ip_address: "192.168.1.2", mac_address: "00:1A:2B:3C:4D:5E" },
      },
      {
        userId,
        type: "Network",
        name: "OPNsense Firewall",
        model: "Protectli Vault FW4B",
        quantity: 1,
        location: "Server Rack",
        notes: sampleNote,
        specifications: {
          cpu: { model: "Intel Celeron J3160", cores: 4, threads: 4, tdp_watts: 6 },
          ram: { type: "DDR3", current_gb: 8, max_gb: 8 },
        },
        storage: [{ type: "SSD", capacity_gb: 120, model: "mSATA" }],
        network_info: { ip_address: "192.168.1.1" },
      },
      {
        userId,
        type: "IoT",
        name: "Home Assistant",
        model: "Intel NUC8i3BEH",
        quantity: 1,
        location: "Living Room",
        notes: sampleNote,
        specifications: {
          cpu: { model: "Intel Core i3-8109U", cores: 2, threads: 4, tdp_watts: 28 },
          ram: { type: "DDR4", current_gb: 16, max_gb: 32 },
        },
        storage: [{ type: "NVMe", capacity_gb: 256, model: "Samsung 970 EVO" }],
      },
    ];

    // Insert devices and collect IDs
    const deviceIds: Map<string, string> = new Map();
    for (const device of devices) {
      const id = await ctx.db.insert("devices", device);
      deviceIds.set(device.name, id);
    }

    // Create network connections
    const connections = [
      { from: "Proxmox Host", to: "Main Switch", type: "ethernet", speed: "10Gbps" },
      { from: "TrueNAS Scale", to: "Main Switch", type: "ethernet", speed: "10Gbps" },
      { from: "Pi Cluster Node 1", to: "Main Switch", type: "ethernet", speed: "1Gbps" },
      { from: "Pi Cluster Node 2", to: "Main Switch", type: "ethernet", speed: "1Gbps" },
      { from: "Pi Cluster Node 3", to: "Main Switch", type: "ethernet", speed: "1Gbps" },
      { from: "OPNsense Firewall", to: "Main Switch", type: "ethernet", speed: "1Gbps" },
      { from: "Home Assistant", to: "Main Switch", type: "ethernet", speed: "1Gbps" },
    ];

    for (const conn of connections) {
      const fromId = deviceIds.get(conn.from);
      const toId = deviceIds.get(conn.to);
      if (fromId && toId) {
        await ctx.db.insert("network_connections", {
          userId,
          from_device_id: fromId as any,
          to_device_id: toId as any,
          connection_type: conn.type as any,
          speed: conn.speed,
        });
      }
    }

    return { seeded: devices.length };
  },
});

// Clear all sample data for current user
export const clearSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Find all sample devices
    const sampleDevices = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("notes"), "[SAMPLE DATA]"))
      .collect();

    // Delete their network connections
    for (const device of sampleDevices) {
      const fromConns = await ctx.db
        .query("network_connections")
        .withIndex("by_from_device", (q) => q.eq("from_device_id", device._id))
        .collect();
      const toConns = await ctx.db
        .query("network_connections")
        .withIndex("by_to_device", (q) => q.eq("to_device_id", device._id))
        .collect();

      for (const conn of [...fromConns, ...toConns]) {
        if (conn.userId === userId) {
          await ctx.db.delete(conn._id);
        }
      }
    }

    // Delete sample devices
    for (const device of sampleDevices) {
      await ctx.db.delete(device._id);
    }

    return { cleared: sampleDevices.length };
  },
});
```

**Step 2: Create SampleDataBanner component**

```svelte
<!-- src/client/components/SampleDataBanner.svelte -->
<script lang="ts">
  import { useQuery, useMutation } from 'convex-svelte';
  import { api } from '../../../convex/_generated/api';

  const hasSampleData = useQuery(api.sampleData.hasSampleData, {});
  const clearMutation = useMutation(api.sampleData.clearSampleData);

  let isClearing = $state(false);

  async function clearSamples() {
    isClearing = true;
    try {
      await clearMutation.mutate({});
    } catch (e) {
      console.error('Failed to clear sample data:', e);
    } finally {
      isClearing = false;
    }
  }
</script>

{#if hasSampleData.data}
  <div class="sample-banner">
    <span class="banner-text">
      📋 You're viewing sample data. Explore, then clear it when ready.
    </span>
    <button
      class="clear-button"
      onclick={clearSamples}
      disabled={isClearing}
    >
      {isClearing ? 'Clearing...' : 'Clear Sample Data'}
    </button>
  </div>
{/if}

<style>
  .sample-banner {
    background: rgba(0, 200, 255, 0.1);
    border: 1px solid var(--signal-blue);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
    flex-wrap: wrap;
  }

  .banner-text {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--signal-blue);
  }

  .clear-button {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    padding: var(--space-2) var(--space-3);
    background: transparent;
    border: 1px solid var(--signal-blue);
    color: var(--signal-blue);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .clear-button:hover:not(:disabled) {
    background: var(--signal-blue);
    color: var(--bg-primary);
  }

  .clear-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
```

**Step 3: Add banner to Dashboard.svelte**

Import and add at top of Dashboard content:
```svelte
<script lang="ts">
  import SampleDataBanner from './SampleDataBanner.svelte';
  // ... rest of imports
</script>

<div class="dashboard">
  <SampleDataBanner />
  <!-- rest of dashboard -->
</div>
```

**Step 4: Trigger sample data seed on first login**

In App.svelte, after auth is confirmed and user has no devices, seed sample data:
```typescript
import { useMutation, useQuery } from 'convex-svelte';
import { api } from '../../convex/_generated/api';

const hasDevicesQuery = useQuery(api.sampleData.hasDevices, () => (authenticated ? {} : "skip"));
const seedMutation = useMutation(api.sampleData.seedSampleData);

let seedAttempted = $state(false);

$effect(() => {
  if (authenticated && !hasDevicesQuery.isLoading && hasDevicesQuery.data === false && !seedAttempted) {
    seedAttempted = true;
    seedMutation.mutate({}).catch(console.error);
  }
});
```

**Step 5: Run and test**

Run: `bun run dev`
Test: Sign up as new user, verify sample data appears
Test: Click "Clear Sample Data", verify it's removed

**Step 6: Commit**

```bash
git add convex/sampleData.ts src/client/components/SampleDataBanner.svelte src/client/components/Dashboard.svelte src/client/App.svelte
git commit -m "feat: add sample data system with seed on signup and clear button"
```

---

## Task 7: Add i18n Strings for New Features

**Files:**
- Modify: `src/client/lib/i18n/locales/en.json`
- Modify: `src/client/lib/i18n/locales/ro.json`

**Step 1: Add English strings**

Add to en.json:
```json
{
  "landing": {
    "headline": "A homelab inventory tool you'll actually enjoy using",
    "subheadline": "Track your gear. Visualize your network. Stop forgetting what you have.",
    "cta": "Get Started — Free",
    "whyTitle": "Why I Built This",
    "whyText": "I tried existing tools but couldn't find one that clicked for me. So I built something simple and beautiful that I actually wanted to use. Maybe you'll like it too.",
    "supportTitle": "Support the Project",
    "supportText": "This tool is completely free. If you find it useful, consider becoming a supporter to help keep it running.",
    "viewSupporters": "View Supporters →",
    "features": {
      "dashboard": "See your entire homelab at a glance",
      "topology": "Visualize how everything connects",
      "storage": "Track drives across all devices",
      "aiSpecs": "Auto-fill device specifications",
      "multiLang": "English & Romanian (more coming)",
      "responsive": "Works on desktop, tablet, mobile"
    }
  },
  "supporters": {
    "title": "Supporters",
    "subtitle": "These cool people keep the project alive",
    "becomeSupporter": "Want to support the project?",
    "monthlyButton": "Become a Monthly Supporter",
    "oneTimeButton": "Make a One-Time Donation",
    "monthlyBadge": "⭐ Monthly",
    "oneTimeBadge": "💜 One-time",
    "loading": "Loading supporters...",
    "beFirst": "Be the first supporter!"
  },
  "sampleData": {
    "bannerText": "You're viewing sample data. Explore, then clear it when ready.",
    "clearButton": "Clear Sample Data",
    "clearing": "Clearing..."
  },
  "legal": {
    "backToHome": "← Back to Home"
  }
}
```

**Step 2: Add Romanian strings**

Add to ro.json (translations):
```json
{
  "landing": {
    "headline": "Un instrument de inventar homelab pe care chiar îl vei folosi cu plăcere",
    "subheadline": "Urmărește-ți echipamentele. Vizualizează rețeaua. Nu mai uita ce ai.",
    "cta": "Începe — Gratuit",
    "whyTitle": "De Ce Am Construit Asta",
    "whyText": "Am încercat instrumente existente dar nu am găsit unul care să mi se potrivească. Așa că am construit ceva simplu și frumos pe care chiar am vrut să-l folosesc. Poate îți va plăcea și ție.",
    "supportTitle": "Susține Proiectul",
    "supportText": "Acest instrument este complet gratuit. Dacă îl găsești util, consideră să devii susținător pentru a ajuta la menținerea lui.",
    "viewSupporters": "Vezi Susținătorii →",
    "features": {
      "dashboard": "Vezi întregul tău homelab dintr-o privire",
      "topology": "Vizualizează cum este totul conectat",
      "storage": "Urmărește discurile de pe toate dispozitivele",
      "aiSpecs": "Completare automată a specificațiilor",
      "multiLang": "Engleză și Română (mai multe în curând)",
      "responsive": "Funcționează pe desktop, tabletă, mobil"
    }
  },
  "supporters": {
    "title": "Susținători",
    "subtitle": "Acești oameni minunați mențin proiectul în viață",
    "becomeSupporter": "Vrei să susții proiectul?",
    "monthlyButton": "Devino Susținător Lunar",
    "oneTimeButton": "Fă o Donație Unică",
    "monthlyBadge": "⭐ Lunar",
    "oneTimeBadge": "💜 O singură dată",
    "loading": "Se încarcă susținătorii...",
    "beFirst": "Fii primul susținător!"
  },
  "sampleData": {
    "bannerText": "Vizualizezi date demonstrative. Explorează, apoi șterge-le când ești gata.",
    "clearButton": "Șterge Datele Demo",
    "clearing": "Se șterge..."
  },
  "legal": {
    "backToHome": "← Înapoi la Prima Pagină"
  }
}
```

**Step 3: Commit**

```bash
git add src/client/lib/i18n/locales/en.json src/client/lib/i18n/locales/ro.json
git commit -m "feat: add i18n strings for landing, supporters, sample data"
```

---

## Task 8: Add Supporter Badge to Profile

**Files:**
- Modify: `src/client/components/settings/Profile.svelte`

**Step 1: Add supporter status query and badge**

Add to Profile.svelte script:
```typescript
import { api } from '../../../../convex/_generated/api';
const supporterStatus = useQuery(api.supporters.currentUserSupporter, {});
```

Add badge in template after profile info:
```svelte
{#if supporterStatus.data}
  <div class="supporter-badge">
    {supporterStatus.data.type === 'monthly' ? '⭐' : '💜'}
    {supporterStatus.data.type === 'monthly' ? 'Monthly Supporter' : 'Supporter'}
  </div>
{/if}
```

Add styles:
```css
.supporter-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: var(--space-2) var(--space-3);
  background: rgba(0, 200, 255, 0.1);
  border: 1px solid var(--signal-blue);
  border-radius: var(--radius-md);
  color: var(--signal-blue);
  margin-top: var(--space-3);
}
```

**Step 2: Commit**

```bash
git add src/client/components/settings/Profile.svelte
git commit -m "feat: add supporter badge to user profile"
```

---

## Task 9: Add Data Deletion Flow

**Files:**
- Create: `convex/account.ts`
- Modify: `src/client/components/settings/Profile.svelte`

**Step 1: Create account deletion mutation**

```typescript
// convex/account.ts
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Delete all user data
export const deleteAllData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Delete all user's devices
    const devices = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Delete network connections for each device
    for (const device of devices) {
      const fromConns = await ctx.db
        .query("network_connections")
        .withIndex("by_from_device", (q) => q.eq("from_device_id", device._id))
        .collect();
      const toConns = await ctx.db
        .query("network_connections")
        .withIndex("by_to_device", (q) => q.eq("to_device_id", device._id))
        .collect();

      for (const conn of [...fromConns, ...toConns]) {
        if (conn.userId === userId) {
          await ctx.db.delete(conn._id);
        }
      }

      await ctx.db.delete(device._id);
    }

    // Delete user preferences
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (prefs) {
      await ctx.db.delete(prefs._id);
    }

    // Delete supporter record if exists
    const supporter = await ctx.db
      .query("supporters")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (supporter) {
      await ctx.db.delete(supporter._id);
    }

    return { deleted: true, deviceCount: devices.length };
  },
});
```

**Step 2: Add delete button to Profile.svelte**

Add mutation and state:
```typescript
const deleteDataMutation = useMutation(api.account.deleteAllData);
let showDeleteConfirm = $state(false);
let isDeleting = $state(false);

async function deleteAllData() {
  isDeleting = true;
  try {
    await deleteDataMutation.mutate({});
    // Sign out after deletion
    window.location.href = '/';
  } catch (e) {
    console.error('Failed to delete data:', e);
    isDeleting = false;
  }
}
```

Add UI section:
```svelte
<div class="danger-zone">
  <h3>Danger Zone</h3>
  <p>Delete all your inventory data. This cannot be undone.</p>
  {#if !showDeleteConfirm}
    <button class="delete-button" onclick={() => showDeleteConfirm = true}>
      Delete All My Data
    </button>
  {:else}
    <div class="confirm-delete">
      <p>Are you sure? This will permanently delete all your devices and settings.</p>
      <div class="confirm-buttons">
        <button class="cancel-button" onclick={() => showDeleteConfirm = false}>
          Cancel
        </button>
        <button class="confirm-delete-button" onclick={deleteAllData} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
        </button>
      </div>
    </div>
  {/if}
</div>
```

**Step 3: Commit**

```bash
git add convex/account.ts src/client/components/settings/Profile.svelte
git commit -m "feat: add data deletion flow in profile settings"
```

---

## Task 10: Add Stripe Payment Integration (Structure Only)

**Files:**
- Create: `convex/stripe.ts`
- Create: `src/client/components/public/PaymentModal.svelte`

**Step 1: Create Stripe webhook handler structure**

```typescript
// convex/stripe.ts
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Note: Full implementation requires:
// 1. STRIPE_SECRET_KEY in Convex environment variables
// 2. STRIPE_WEBHOOK_SECRET in Convex environment variables
// 3. Stripe npm package (add to dependencies)

// This is the structure - actual Stripe integration requires setup
export const webhook = httpAction(async (ctx, request) => {
  // TODO: Implement when Stripe is configured
  // 1. Verify webhook signature
  // 2. Handle checkout.session.completed
  // 3. Handle customer.subscription.created/updated/deleted
  // 4. Update supporters table accordingly

  return new Response("Webhook handler placeholder", { status: 200 });
});

// Internal mutation to create/update supporter record
// Called by webhook handler
export const updateSupporterStatus = async (
  ctx: any,
  args: {
    stripeCustomerId: string;
    userId: string;
    type: "monthly" | "one-time";
    isActive: boolean;
    displayName: string;
    avatarUrl?: string;
  }
) => {
  // TODO: Implement supporter record creation/update
};
```

**Step 2: Create PaymentModal placeholder**

```svelte
<!-- src/client/components/public/PaymentModal.svelte -->
<script lang="ts">
  interface Props {
    type: 'monthly' | 'one-time';
    onClose: () => void;
  }

  let { type, onClose }: Props = $props();

  // TODO: Implement Stripe Checkout redirect
  // 1. Call Convex action to create Stripe Checkout session
  // 2. Redirect to Stripe Checkout URL
</script>

<div class="modal-overlay" onclick={onClose}>
  <div class="modal-content" onclick={(e) => e.stopPropagation()}>
    <h2>{type === 'monthly' ? 'Monthly Support' : 'One-Time Donation'}</h2>
    <p>
      Stripe payment integration coming soon!
    </p>
    <p class="price">
      {type === 'monthly' ? '$5/month' : '$5 one-time'}
    </p>
    <button class="close-button" onclick={onClose}>Close</button>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    max-width: 400px;
    text-align: center;
  }

  h2 {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    color: var(--text-bright);
    margin-bottom: var(--space-3);
  }

  p {
    color: var(--text-secondary);
    margin-bottom: var(--space-3);
  }

  .price {
    font-family: var(--font-mono);
    font-size: 1.5rem;
    color: var(--signal-blue);
    font-weight: 600;
  }

  .close-button {
    margin-top: var(--space-4);
    padding: var(--space-2) var(--space-4);
    background: transparent;
    border: 1px solid var(--panel-border);
    color: var(--text-secondary);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-family: var(--font-mono);
  }

  .close-button:hover {
    border-color: var(--signal-blue);
    color: var(--signal-blue);
  }
</style>
```

**Step 3: Commit**

```bash
git add convex/stripe.ts src/client/components/public/PaymentModal.svelte
git commit -m "feat: add Stripe payment integration structure (placeholder)"
```

---

## Task 11: Final Integration Test

**Step 1: Run full dev environment**

Run: `bun run dev`

**Step 2: Test all routes**

- `/` - Landing page loads
- `/supporters` - Supporters page loads
- `/privacy` - Privacy policy loads
- `/terms` - Terms of service loads
- `/app` - Redirects to login or shows app

**Step 3: Test user flow**

1. Go to landing page
2. Click "Get Started"
3. Sign in with GitHub
4. Verify sample data is seeded
5. Explore dashboard, devices, topology
6. Clear sample data
7. Check profile for supporter badge area
8. Test data deletion (on test account)

**Step 4: Run existing tests**

Run: `bun test`
Expected: All tests pass

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: complete hosted SaaS MVP implementation"
```

---

## Open Items (Post-MVP)

- [ ] Configure Stripe keys and complete payment integration
- [ ] Add actual payment buttons to SupportersPage
- [ ] Set up Stripe webhook endpoint in Convex HTTP routes
- [ ] Add email notifications for new supporters
- [ ] Create proper 404 page for unknown routes
- [ ] Add screenshot to landing page hero
- [ ] SEO meta tags for public pages
- [ ] Analytics integration
