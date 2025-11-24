# Understanding API Errors

## Error Types You're Seeing

### 1. **400 Bad Request** (`/api/equity/{SYMBOL}`)
**What it means:**
- The backend server is running and receiving your requests
- But it's rejecting them because something is wrong with the request format or data

**Possible causes:**
- ❌ Backend expects different symbol format (e.g., `NSE:RELIANCE` instead of `RELIANCE`)
- ❌ Backend validation is failing (symbol doesn't exist in database)
- ❌ Backend endpoint has changed or requires additional parameters
- ❌ Backend is not properly configured

**How to fix:**
1. **Check if backend is running:**
   ```bash
   # In the stock-nse-india directory
   npm run start
   ```
   Should be running on `http://localhost:3000`

2. **Check backend API documentation:**
   - Visit `http://localhost:3000/api-docs` (if available)
   - Check the backend code to see what format it expects

3. **Test an endpoint manually:**
   ```bash
   curl http://localhost:3000/api/equity/RELIANCE
   ```
   This will show you the exact error message from the backend

4. **Check backend logs:**
   - Look at the backend server console for error messages
   - Backend logs will tell you why it's rejecting the requests

### 2. **500 Internal Server Error** (`/graphql`)
**What it means:**
- The GraphQL server is running but encountering an internal error
- This is a backend problem, not a frontend problem

**Possible causes:**
- ❌ Backend database connection issues
- ❌ Backend code has bugs
- ❌ Backend dependencies are missing or outdated
- ❌ Backend environment variables are not set

**How to fix:**
1. **Check backend logs:**
   - Look at the backend server console for detailed error messages
   - GraphQL errors usually include a stack trace

2. **Check backend dependencies:**
   ```bash
   cd ../stock-nse-india
   npm install
   ```

3. **Check backend environment:**
   - Make sure all required environment variables are set
   - Check `.env` file in the backend directory

## What I've Fixed

I've updated the error handling in `src/services/api.ts` to:

1. ✅ **Suppress console warnings in production** - Errors only log in development mode
2. ✅ **Gracefully handle all errors** - Returns `null` or empty arrays instead of crashing
3. ✅ **Reduce console noise** - 400 errors are now silent by default
4. ✅ **Better error recovery** - App continues to work even when backend is unavailable

## Browser Network Tab Errors

**Note:** The browser's Network tab will **always** show failed requests. This is normal browser behavior and cannot be suppressed. However:

- ✅ The app will continue to work (uses fallback data)
- ✅ Console warnings are now suppressed in production
- ✅ Errors are handled gracefully without breaking the UI

## Current Behavior

When the backend is unavailable or returns errors:

1. **Stock details** → Returns `null`, components show loading/empty states
2. **GraphQL queries** → Returns empty objects/arrays, components use fallback data
3. **No crashes** → App continues to function with degraded features

## Next Steps

1. **Start the backend server** (if not running):
   ```bash
   cd ../stock-nse-india
   npm install
   npm run start
   ```

2. **Verify backend is working:**
   ```bash
   curl http://localhost:3000/api/equity/RELIANCE
   ```

3. **Check backend configuration:**
   - Ensure backend is configured to accept requests from `http://localhost:8080`
   - Check CORS settings in backend
   - Verify database connection

4. **If backend is intentionally unavailable:**
   - The app will work with fallback data
   - Console errors are now suppressed in production
   - UI will show loading/empty states gracefully

## Summary

- **400 errors** = Backend is rejecting requests (check backend logs and API format)
- **500 errors** = Backend has internal errors (check backend logs and dependencies)
- **Network errors** = Backend is not running (start the backend server)

The frontend is now configured to handle these errors gracefully without spamming the console.

