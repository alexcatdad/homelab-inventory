/**
 * DuckDuckGo Instant Answer API helper
 * Uses JSONP to bypass CORS - no server proxy needed
 */

export interface DDGInstantResult {
  text?: string;
  heading?: string;
  abstractURL?: string;
}

/**
 * Query DDG Instant Answer API via JSONP
 * Returns Wikipedia/knowledge graph data if available
 * ~20% hit rate for hardware - only popular items have Wikipedia entries
 */
export function queryDDGInstant(query: string, timeoutMs = 3000): Promise<DDGInstantResult> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve({});
    }, timeoutMs);

    const callbackName = `ddg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const cleanup = () => {
      clearTimeout(timeout);
      delete (window as any)[callbackName];
      script.remove();
    };

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve({
        text: data.AbstractText || '',
        heading: data.Heading || '',
        abstractURL: data.AbstractURL || '',
      });
    };

    const script = document.createElement('script');
    script.src = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&callback=${callbackName}&t=homelab-inventory`;
    script.onerror = () => {
      cleanup();
      resolve({});
    };
    document.head.appendChild(script);
  });
}
