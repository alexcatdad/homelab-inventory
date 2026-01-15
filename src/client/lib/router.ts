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
