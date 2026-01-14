import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/bun';
import { initSchema } from './db/schema';
import { getAllDevices, getDeviceById, getStats, getTopology, addConnection, removeConnection, createDevice, updateDevice, deleteDevice, updateSpecifications } from './db/queries';
import type { DeviceType } from '../shared/types';
import specsRoutes from './routes/specs';

// Initialize database on startup
initSchema();

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('/api/*', cors());

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes

// List all devices with optional filters
app.get('/api/devices', (c) => {
  const type = c.req.query('type') as DeviceType | undefined;
  const search = c.req.query('q');

  const devices = getAllDevices({ type, search });

  return c.json({
    devices,
    total: devices.length,
  });
});

// Get single device by ID
app.get('/api/devices/:id', (c) => {
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    return c.json({ error: 'Invalid device ID' }, 400);
  }

  const device = getDeviceById(id);

  if (!device) {
    return c.json({ error: 'Device not found' }, 404);
  }

  return c.json(device);
});

// Create a new device
app.post('/api/devices', async (c) => {
  const body = await c.req.json();
  const { type, name, model, quantity, location, notes, specifications } = body;

  if (!name || !type) {
    return c.json({ error: 'name and type are required' }, 400);
  }

  const validTypes = ['Server', 'Desktop', 'Laptop', 'Component', 'IoT', 'Network'];
  if (!validTypes.includes(type)) {
    return c.json({ error: `type must be one of: ${validTypes.join(', ')}` }, 400);
  }

  const id = createDevice({ type, name, model, quantity, location, notes });

  // Save specifications if provided
  if (specifications) {
    updateSpecifications(id, specifications);
  }

  const device = getDeviceById(id);

  return c.json({ device }, 201);
});

// Update a device
app.patch('/api/devices/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    return c.json({ error: 'Invalid device ID' }, 400);
  }

  const existing = getDeviceById(id);
  if (!existing) {
    return c.json({ error: 'Device not found' }, 404);
  }

  const body = await c.req.json();
  const { type, name, model, quantity, location, notes, specifications } = body;

  if (type) {
    const validTypes = ['Server', 'Desktop', 'Laptop', 'Component', 'IoT', 'Network'];
    if (!validTypes.includes(type)) {
      return c.json({ error: `type must be one of: ${validTypes.join(', ')}` }, 400);
    }
  }

  updateDevice(id, { type, name, model, quantity, location, notes });

  // Update specifications if provided
  if (specifications) {
    updateSpecifications(id, specifications);
  }

  const device = getDeviceById(id);

  return c.json({ device });
});

// Delete a device
app.delete('/api/devices/:id', (c) => {
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    return c.json({ error: 'Invalid device ID' }, 400);
  }

  const existing = getDeviceById(id);
  if (!existing) {
    return c.json({ error: 'Device not found' }, 404);
  }

  deleteDevice(id);
  return c.json({ success: true });
});

// Get inventory statistics
app.get('/api/stats', (c) => {
  const stats = getStats();
  return c.json(stats);
});

// Get network topology data
app.get('/api/topology', (c) => {
  const topology = getTopology();
  return c.json(topology);
});

// Add network connection
app.post('/api/connections', async (c) => {
  const body = await c.req.json();
  const { from_device_id, to_device_id, connection_type } = body;

  if (!from_device_id || !to_device_id) {
    return c.json({ error: 'from_device_id and to_device_id required' }, 400);
  }

  const id = addConnection(from_device_id, to_device_id, connection_type || 'ethernet');
  return c.json({ id }, 201);
});

// Remove network connection
app.delete('/api/connections/:id', (c) => {
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    return c.json({ error: 'Invalid connection ID' }, 400);
  }

  const success = removeConnection(id);
  if (!success) {
    return c.json({ error: 'Connection not found' }, 404);
  }

  return c.json({ success: true });
});

// Specs lookup routes
app.route('/api/specs', specsRoutes);

// Serve static files from client build (production)
app.use('/*', serveStatic({ root: './dist/client' }));

// Fallback to index.html for SPA routing
app.get('*', serveStatic({ path: './dist/client/index.html' }));

const port = parseInt(process.env.PORT || '3000', 10);

console.log(`
╔════════════════════════════════════════════╗
║       Home Lab Inventory Server            ║
╠════════════════════════════════════════════╣
║  API:  http://localhost:${port}/api/devices    ║
║  Health: http://localhost:${port}/health       ║
╚════════════════════════════════════════════╝
`);

export default {
  port,
  fetch: app.fetch,
};
