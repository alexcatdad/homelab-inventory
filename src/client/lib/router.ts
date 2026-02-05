import { writable, derived } from 'svelte/store';

export type Route =
  | { page: 'landing' }
  | { page: 'supporters' }
  | { page: 'privacy' }
  | { page: 'terms' }
  | { page: 'demo' }   // Guest/demo mode - read-only with sample data
  | { page: 'app' };   // The main authenticated app

// Base path for GitHub Pages deployment (e.g., '/homelab-inventory/')
// Vite injects this at build time from VITE_BASE_PATH
const BASE_PATH = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

/**
 * Strip base path from URL pathname to get the route path
 */
function stripBasePath(pathname: string): string {
  if (BASE_PATH && pathname.startsWith(BASE_PATH)) {
    return pathname.slice(BASE_PATH.length) || '/';
  }
  return pathname;
}

/**
 * Add base path to route for navigation
 */
function addBasePath(route: string): string {
  return BASE_PATH + route;
}

function parseRoute(path: string): Route {
  // Strip base path before matching routes
  const routePath = stripBasePath(path);

  switch (routePath) {
    case '/':
      return { page: 'landing' };
    case '/supporters':
      return { page: 'supporters' };
    case '/privacy':
      return { page: 'privacy' };
    case '/terms':
      return { page: 'terms' };
    case '/demo':
      return { page: 'demo' };
    case '/app':
    default:
      return { page: 'app' };
  }
}

function createRouter() {
  // Handle GitHub Pages SPA redirect
  // When 404.html redirects, it encodes the original path as ?redirect=...
  const params = new URLSearchParams(window.location.search);
  const redirectPath = params.get('redirect');

  let initialPath = window.location.pathname;

  if (redirectPath) {
    // Restore the original URL without the redirect param
    const decoded = decodeURIComponent(redirectPath);
    window.history.replaceState({}, '', decoded);
    initialPath = decoded.split('?')[0]; // Get path without query string
  }

  const path = writable(initialPath);

  // Listen for popstate (browser back/forward)
  window.addEventListener('popstate', () => {
    path.set(window.location.pathname);
  });

  return {
    subscribe: path.subscribe,
    navigate: (newPath: string) => {
      // Add base path for the actual URL, but store route path for matching
      const fullPath = addBasePath(newPath);
      window.history.pushState({}, '', fullPath);
      path.set(fullPath);
    },
    route: derived(path, parseRoute),
    // Export for components that need to build hrefs
    basePath: BASE_PATH
  };
}

export const router = createRouter();
