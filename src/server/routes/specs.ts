import { Hono } from 'hono';
import { getCachedSpecs, setCachedSpecs } from '../db/queries';

const specs = new Hono();

// Check cache for specs
specs.get('/cache', (c) => {
  const model = c.req.query('model');

  if (!model) {
    return c.json({ error: 'model query parameter required' }, 400);
  }

  const cached = getCachedSpecs(model);

  if (cached) {
    return c.json({
      cached: true,
      specs: JSON.parse(cached.specs_json),
      source_url: cached.source_url,
    });
  }

  return c.json({ cached: false });
});

// Save specs to cache
specs.post('/cache', async (c) => {
  const body = await c.req.json();
  const { model, specs: specsData, source_url } = body;

  if (!model || !specsData) {
    return c.json({ error: 'model and specs are required' }, 400);
  }

  setCachedSpecs(model, JSON.stringify(specsData), source_url);
  return c.json({ success: true });
});

// Helper to clean HTML entities
function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim();
}

// Proxy endpoint - fetches raw HTML from DuckDuckGo (bypasses CORS for client)
specs.get('/proxy-search', async (c) => {
  const query = c.req.query('q');

  if (!query) {
    return c.json({ error: 'q query parameter required' }, 400);
  }

  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return c.json({ error: 'Search request failed' }, 502);
    }

    const html = await response.text();
    return c.text(html);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed';
    return c.json({ error: message }, 500);
  }
});

export default specs;
