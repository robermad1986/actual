# Actual Budget Development Setup Documentation

## Overview
This document explains the proper development setup for Actual Budget, how to troubleshoot common issues, and the architecture of the development environment.

## Architecture

Actual Budget development environment consists of:

1. **Frontend (Port 3001)** - React/Vite development server
2. **Backend (In-browser)** - loot-core compiled to WebAssembly/Worker
3. **Sync Server (Port 5006)** - Optional Docker container for multi-device sync

## Development Environment Setup

### Method 1: Full Development Environment (Recommended)

Start both frontend and backend development servers:

```bash
yarn start:browser
```

This command:
- Starts the frontend Vite server on port 3001
- Compiles loot-core (backend) in watch mode
- Creates a development environment with hot-reloading

### Method 2: Development with Sync Server

For testing sync functionality:

```bash
# Start development servers
yarn start:browser

# In another terminal, start sync server
docker-compose up -d
```

## Common Issues and Solutions

### Issue: "Database is out of sync with migrations"

**Symptoms:**
- Error: `out-of-sync-migrations`
- Frontend shows "Please update Actual!" dialog
- Console errors about migration mismatch

**Root Cause:**
The frontend and backend have different migration states. This usually happens when:
- Using different versions of Actual
- Mixing development and production databases
- Database corruption

**Solution:**
1. Stop all services:
   ```bash
   docker-compose down
   pkill -f "yarn|node.*actual|vite|webpack"
   ```

2. Reset the database (if acceptable to lose data):
   ```bash
   rm -rf actual-data/
   ```

3. Restart development environment:
   ```bash
   yarn start:browser
   ```

4. Optionally start sync server:
   ```bash
   docker-compose up -d
   ```

### Issue: Port 3001 not accessible

**Symptoms:**
- Cannot connect to http://localhost:3001
- "Connection refused" errors

**Solution:**
1. Check if development server is running:
   ```bash
   lsof -i :3001
   ```

2. If not running, start it:
   ```bash
   yarn start:browser
   ```

3. Check task output in VS Code:
   - Use "View > Terminal" 
   - Look for Vite server startup messages

### Issue: Port 5006 not accessible

**Symptoms:**
- Cannot connect to sync server
- Dashboard shows "Server offline"

**Solution:**
1. Check Docker container status:
   ```bash
   docker-compose ps
   ```

2. Start sync server if needed:
   ```bash
   docker-compose up -d
   ```

3. Check logs:
   ```bash
   docker-compose logs
   ```

## File Structure

```
actual/
├── packages/
│   ├── loot-core/           # Core backend logic
│   │   ├── migrations/      # Database migrations
│   │   └── src/server/      # Server-side code
│   ├── desktop-client/      # Frontend React app
│   └── sync-server/         # Sync server (Docker)
├── actual-data/             # Database and user files
├── docker-compose.yml       # Sync server configuration
└── package.json            # Main development scripts
```

## Migration System

- **Location**: `packages/loot-core/migrations/`
- **Format**: JavaScript files with timestamps
- **Key Migration**: `1722804019000_create_dashboard_table.js` (Dashboard functionality)

### Migration Troubleshooting

If you encounter migration issues:

1. **Check current migrations in codebase**:
   ```bash
   ls packages/loot-core/migrations/
   ```

2. **Reset database (development only)**:
   ```bash
   rm -rf actual-data/
   ```

3. **Check migration logs** in browser console when loading Actual

## Development Scripts

Available in `package.json`:

- `yarn start:browser` - Start frontend + backend development
- `yarn start:server` - Start only sync server
- `yarn build:browser` - Build for production
- `yarn test` - Run tests

## Docker Configuration

The `docker-compose.yml` configures:
- Actual sync server on port 5006
- Data persistence in `./actual-data`
- Latest stable version: `actualbudget/actual-server:25.7.1`

## VS Code Tasks

The workspace includes a task: "Start Actual Budget App"
- Runs `yarn start` (which equals `yarn start:browser`)
- Available in VS Code Command Palette
- Includes background process monitoring

## Debugging Tips

1. **Check all running processes**:
   ```bash
   lsof -i :3001  # Frontend
   lsof -i :5006  # Sync server
   ```

2. **Monitor task output** in VS Code Terminal

3. **Check browser console** for frontend errors

4. **Check Docker logs**:
   ```bash
   docker-compose logs actual_server
   ```

## Best Practices

1. **Always start with clean environment** when encountering issues
2. **Use yarn start:browser** for primary development
3. **Only use Docker sync server** when testing sync features
4. **Reset database** if migration errors persist
5. **Check this documentation** before asking for help

## Related Files

- `.vscode/tasks.json` - VS Code task definitions
- `docker-compose.yml` - Sync server configuration
- `package.json` - Development scripts
- `packages/loot-core/migrations/` - Database schema changes

---

Last updated: July 13, 2025
