# Security, Accessibility & Production Readiness Analysis

**Project:** Homelab Inventory
**Analysis Date:** 2026-01-14
**Stack:** Svelte 5 + Convex + Vite + TailwindCSS

---

## Executive Summary

| Category | Rating | Status |
|----------|--------|--------|
| **Security** | Good | Minor improvements recommended |
| **Accessibility** | Needs Work | Multiple issues to address |
| **Production Readiness** | Moderate | Several items to address before production |

---

## 1. Security Analysis

### 1.1 Authentication & Authorization

**Strengths:**
- GitHub OAuth 2.0 via `@convex-dev/auth` - industry standard
- PKCE (Proof Key for Code Exchange) implemented for secure OAuth flow
- JWT tokens with refresh token rotation
- OAuth code removed from URL immediately after exchange (`authStore.ts:92-95`)
- Per-user data isolation with `userId` checks on all queries/mutations

**Concerns:**

| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| Token Storage | Medium | `authStore.ts:56` | JWT stored in localStorage, vulnerable to XSS |
| Console Logging | Low | `authStore.ts:101,109,135` | Auth tokens/states logged to console |
| Optional userId | Medium | `schema.ts:123,149` | `userId` is optional to support legacy migration |

**Recommendations:**
1. Consider using HttpOnly cookies for token storage (Convex handles this if configured)
2. Remove console.log statements containing auth information in production
3. Make `userId` required once legacy data is migrated

### 1.2 Input Validation

**Strengths:**
- Convex validators (`v`) enforce schema at runtime (`schema.ts`)
- TypeScript strict mode enabled
- Device types, RAM types, connection types are literal unions (not arbitrary strings)
- Duplicate name checks prevent data conflicts (`devices.ts:99-107`)

**Concerns:**

| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| Loose Validation | Medium | `devices.ts:85-90` | `v.any()` used for specifications, gpus, storage, pcie_slots |
| Type Casting | Medium | `devices.ts:111` | `type: args.type as any` bypasses type validation |
| Import Validation | Medium | `dataImport.ts:182,193,206` | `as any` casts in import mutations |

**Recommendations:**
1. Replace `v.any()` with specific validators matching schema definitions
2. Add explicit type validation before casting
3. Sanitize imported data more strictly

### 1.3 API Security

**Strengths:**
- All mutations require authentication (`getAuthUserId` check)
- Ownership verification on all device operations
- Queries return empty data for unauthenticated users (no error exposure)
- Convex handles CORS automatically

**Concerns:**

| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| Unauthenticated Cache | Low | `specs.ts:50-82` | `setCache` mutation doesn't require auth |
| Proxy Search | Medium | `specs.ts:97-115` | DuckDuckGo proxy could be abused for SSRF |
| No Rate Limiting | Medium | All mutations | No visible rate limiting on API calls |

**Recommendations:**
1. Add authentication to `specs.setCache` mutation
2. Implement rate limiting for `proxySearch` action
3. Consider allowlisting domains for proxy requests

### 1.4 Data Protection

**Strengths:**
- User data isolated by `userId` with database indexes
- Ownership checks prevent cross-user data access
- Convex provides encryption at rest and in transit

**Concerns:**

| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| Sensitive Data | Medium | `schema.ts:97-102` | Network info (IP, MAC, open ports) stored |
| Export All | Low | `dataExport.ts` | Full data export without confirmation |
| Specs Cache Global | Low | `schema.ts:161-166` | Specs cache is not user-scoped |

**Recommendations:**
1. Consider encrypting sensitive network info
2. Add confirmation step for full data export
3. Document that specs cache is shared (or scope it per-user)

### 1.5 Dependencies Security

**Current Dependencies:**
```json
"@auth/core": "^0.37.0",
"@convex-dev/auth": "^0.0.90",
"@mlc-ai/web-llm": "^0.2.80",
"convex": "^1.31.4"
```

**Recommendations:**
1. Run `bun audit` regularly to check for vulnerabilities
2. Pin dependency versions for production builds
3. Consider using a lockfile (`bun.lockb`) in git

---

## 2. Accessibility Analysis

### 2.1 Current State

Found **34 accessibility-related attributes** across 10 Svelte files. This is a start but insufficient for WCAG compliance.

### 2.2 Critical Issues

| Issue | WCAG | Location | Description |
|-------|------|----------|-------------|
| Missing Skip Links | 2.4.1 | `App.svelte` | No skip-to-content link for keyboard users |
| Missing Landmarks | 1.3.1 | Multiple | No `<nav>`, `<main>`, `<aside>` roles in some components |
| Color Contrast | 1.4.3 | `global.css` | `--text-dim: #3d4555` likely fails 4.5:1 ratio |
| Focus Indicators | 2.4.7 | `global.css` | Custom focus styles may not be visible enough |
| Missing Form Labels | 1.3.1 | `Header.svelte:136-141` | Search input missing `<label>` association |
| Modal Focus Trap | 2.4.3 | `DeviceForm.svelte` | No focus trap in modal dialogs |
| Live Regions | 4.1.3 | Multiple | No `aria-live` for dynamic content updates |

### 2.3 Detailed Findings

**Positive:**
- Background effects marked with `aria-hidden="true"` (`App.svelte:84,106,129`)
- Close buttons have `aria-label` (`DeviceForm.svelte:266`)
- Dialog has `role="dialog"` and `aria-modal="true"` (`DeviceForm.svelte:260`)

**Needs Improvement:**

1. **Navigation (`Header.svelte`):**
   ```svelte
   <!-- Missing proper nav landmark -->
   <nav class="nav">  <!-- Good -->

   <!-- Buttons lack aria-pressed for toggle state -->
   <button class="nav-item" class:active={view === v.id}>
   ```

2. **Search Input (`Header.svelte:136-141`):**
   ```svelte
   <!-- Missing label association -->
   <input
     type="text"
     placeholder={$t('header.searchPlaceholder')}  <!-- Placeholders aren't labels -->
   />
   ```

3. **Icon Buttons (`Header.svelte:154-164`):**
   ```svelte
   <!-- Missing accessible names for icon-only buttons -->
   <button class="icon-button" title={$t('header.settings')}>
     <!-- title isn't reliably announced by screen readers -->
   ```

4. **Loading States:**
   ```svelte
   <!-- No live region for async updates -->
   <div class="loading-screen">
     <span class="loading-text">{$t('app.initializing')}</span>
   </div>
   ```

5. **Form Overlay (`DeviceForm.svelte:259`):**
   ```svelte
   <!-- Overlay is focusable but shouldn't be -->
   <div class="overlay" role="button" tabindex="-1">
   ```

### 2.4 Color Contrast Analysis

| Color Variable | Hex | Background | Contrast | WCAG AA |
|---------------|-----|------------|----------|---------|
| `--text-dim` | #3d4555 | #08090c | ~2.8:1 | FAIL |
| `--text-muted` | #5c6578 | #08090c | ~4.1:1 | FAIL |
| `--text-secondary` | #8892a2 | #08090c | ~6.2:1 | PASS |
| `--text-primary` | #c8cdd6 | #08090c | ~10.5:1 | PASS |

### 2.5 Keyboard Navigation

| Component | Tab Order | Escape | Enter/Space | Arrow Keys |
|-----------|-----------|--------|--------------|------------|
| Header Nav | Partial | N/A | Works | Missing |
| Device Form | Good | Works | Works | Missing |
| Settings | Unknown | Unknown | Unknown | Missing |
| Topology | Unknown | N/A | Unknown | Unknown |

---

## 3. Production Readiness

### 3.1 Build & Deployment

| Item | Status | Notes |
|------|--------|-------|
| Build Script | OK | `vite build` configured |
| Environment Variables | OK | `.env` files gitignored |
| Output Directory | OK | `dist/client` configured |
| Source Maps | Review | May expose source in production |

**Missing:**
- No production-specific Vite config
- No CSP (Content Security Policy) headers
- No error boundary components
- No production logging/monitoring setup

### 3.2 Performance Considerations

| Item | Status | Notes |
|------|--------|-------|
| Code Splitting | Partial | Vite handles automatic splitting |
| Asset Optimization | OK | Vite handles minification |
| Bundle Size | Review | WebLLM model is ~720MB |
| Caching Strategy | Missing | No service worker or cache headers |

**Recommendations:**
1. Implement lazy loading for WebLLM (currently loads on form open)
2. Add service worker for offline support
3. Configure proper cache headers for static assets

### 3.3 Error Handling

| Component | Error Handling | User Feedback |
|-----------|----------------|---------------|
| Auth | Partial | Shows error state |
| Device CRUD | Partial | Shows form errors |
| Spec Lookup | Silent | Fails silently |
| Data Import | Good | Returns detailed results |

**Missing:**
- Global error boundary
- Error reporting service (e.g., Sentry)
- Retry logic for network failures
- Offline state detection

### 3.4 Testing

| Type | Status | Coverage |
|------|--------|----------|
| E2E Tests | Configured | Playwright setup exists |
| Unit Tests | Missing | No unit tests found |
| Integration Tests | Missing | No API tests found |
| Accessibility Tests | Missing | No a11y testing configured |

**Playwright Config Issues:**
- References `dev:server` and `dev:client` scripts that don't exist in package.json
- No actual test files found in `./tests` directory

### 3.5 Monitoring & Observability

| Item | Status |
|------|--------|
| Application Logging | Console only |
| Error Tracking | None |
| Performance Monitoring | None |
| Analytics | None |
| Health Checks | None |

### 3.6 Security Headers (Missing)

Required headers for production:
```
Content-Security-Policy: ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 4. Priority Action Items

### Critical (Before Production)

1. **Remove console.log statements** containing auth information
2. **Add proper form labels** for search input and other form fields
3. **Implement focus management** in modals
4. **Add skip links** for keyboard navigation
5. **Fix color contrast** for `--text-dim` and `--text-muted`
6. **Set up error boundary** component

### High Priority

7. **Add rate limiting** to API endpoints
8. **Implement authentication** for specs cache mutations
9. **Add aria-live regions** for dynamic content
10. **Configure CSP headers**
11. **Add unit and integration tests**
12. **Set up error tracking** (Sentry, etc.)

### Medium Priority

13. **Replace `v.any()` validators** with specific schemas
14. **Add keyboard navigation** to all interactive components
15. **Implement service worker** for offline support
16. **Add health check endpoint**
17. **Configure production logging**

### Low Priority

18. **Scope specs cache** per user
19. **Add confirmation** for data export
20. **Pin dependency versions**
21. **Add analytics tracking**

---

## 5. Compliance Summary

### WCAG 2.1 AA Compliance

| Principle | Status | Issues |
|-----------|--------|--------|
| Perceivable | Partial | Color contrast, missing alt text |
| Operable | Partial | Keyboard nav, focus management |
| Understandable | Good | Clear labels, good i18n |
| Robust | Partial | Missing ARIA attributes |

### OWASP Top 10 Coverage

| Risk | Status | Notes |
|------|--------|-------|
| A01 Broken Access Control | Good | User isolation implemented |
| A02 Cryptographic Failures | Good | Convex handles encryption |
| A03 Injection | Good | Convex ORM prevents SQL injection |
| A04 Insecure Design | Moderate | Some architectural concerns |
| A05 Security Misconfiguration | Review | Headers not configured |
| A06 Vulnerable Components | Review | Audit needed |
| A07 Auth Failures | Good | OAuth 2.0 + PKCE |
| A08 Data Integrity | Good | Validation in place |
| A09 Logging Failures | Poor | No production logging |
| A10 SSRF | Moderate | Proxy search endpoint |

---

## Appendix: Files Reviewed

- `src/client/lib/authStore.ts` - Authentication state management
- `convex/schema.ts` - Database schema definitions
- `convex/devices.ts` - Device CRUD operations
- `convex/specs.ts` - Hardware specs cache
- `convex/dataImport.ts` - Data import functionality
- `convex/auth.config.ts` - Auth provider configuration
- `src/client/App.svelte` - Root application component
- `src/client/components/Header.svelte` - Navigation header
- `src/client/components/LoginPage.svelte` - Login interface
- `src/client/components/DeviceForm.svelte` - Device form modal
- `src/client/styles/global.css` - Global styles
- `vite.config.ts` - Build configuration
- `playwright.config.ts` - Test configuration
- `package.json` - Dependencies
- `.gitignore` - Version control exclusions
