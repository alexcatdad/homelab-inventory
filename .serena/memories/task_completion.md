# Task Completion Checklist

## Before Committing

1. **Type Check**: Ensure no TypeScript errors
   ```bash
   # Vite build will catch TS errors
   bun run build
   ```

2. **Test API**: Verify endpoints work
   ```bash
   curl http://localhost:3000/api/devices
   curl http://localhost:3000/api/stats
   ```

3. **Test Frontend**: Check UI renders correctly
   - Open http://localhost:5173
   - Verify no console errors in browser
   - Test navigation between views
   - Test device detail panel opens

4. **Check for Warnings**: Review vite-plugin-svelte warnings
   - a11y warnings are informational, not blocking
   - Fix actual errors before committing

## After Making Changes

### Backend Changes
- Restart dev server (`bun run dev:server`)
- Test affected API endpoints with curl
- Verify frontend still loads data

### Frontend Changes
- HMR should auto-reload
- Check browser console for errors
- Test user interactions (clicks, navigation)

### Database Schema Changes
- Delete `data/inventory.db` to reset
- Re-run `bun run import` to repopulate
- Test all queries still work

### Type Changes (`src/shared/types.ts`)
- Check both server and client compile
- Update any affected queries/components

## Common Issues

- **Port in use**: Kill existing processes
  ```bash
  lsof -ti:3000,5173 | xargs kill -9
  ```

- **Blank page**: Check browser console for Svelte errors

- **API 404**: Ensure server is running on port 3000

- **CORS errors**: Vite proxy handles this in dev; check vite.config.ts
