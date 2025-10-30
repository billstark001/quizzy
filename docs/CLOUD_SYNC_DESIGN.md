# Cloud Synchronization Design Document

## Executive Summary

This document outlines the architecture for adding optional cloud synchronization to Quizzy while maintaining its offline-first, IndexedDB-based design. The solution prioritizes simplicity and extensibility using Hono framework for the backend.

**Design Principles:**
1. **Offline-First:** Application works fully without server
2. **Optional Sync:** Cloud sync is completely optional
3. **Simple Server:** Minimal backend complexity
4. **Extensible:** Easy to add features without major rewrites
5. **Data Ownership:** Users control their data
6. **Privacy-Focused:** Optional end-to-end encryption

**Key Features:**
- Multi-device synchronization
- Conflict resolution
- Incremental sync (only changed data)
- Automatic and manual sync modes
- Data encryption (optional)
- Self-hosting support

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│              Client (Browser)                       │
│  ┌──────────────────────────────────────────────┐  │
│  │        Quizzy Frontend (React)               │  │
│  │                                              │  │
│  │  ┌──────────────┐    ┌──────────────────┐  │  │
│  │  │  Sync Layer  │◄──►│  IndexedDB       │  │  │
│  │  └──────────────┘    └──────────────────┘  │  │
│  │         │                                   │  │
│  └─────────┼───────────────────────────────────┘  │
└────────────┼──────────────────────────────────────┘
             │
             │ HTTPS + WebSocket (optional)
             │
┌────────────▼──────────────────────────────────────┐
│         Hono Server (Edge/Cloudflare/Node)        │
│                                                    │
│  ┌──────────────────────────────────────────┐    │
│  │         API Layer (REST + WebSocket)     │    │
│  └──────────────────────────────────────────┘    │
│                      │                            │
│  ┌──────────────────────────────────────────┐    │
│  │       Sync Engine & Conflict Resolution  │    │
│  └──────────────────────────────────────────┘    │
│                      │                            │
│  ┌──────────────────────────────────────────┐    │
│  │         Database Adapter Layer           │    │
│  └──────────────────────────────────────────┘    │
└────────────┬──────────────────────────────────────┘
             │
   ┌─────────┴─────────┐
   │                   │
┌──▼────────┐   ┌─────▼──────┐   ┌──────────┐
│ PostgreSQL│   │   SQLite   │   │  MongoDB │
│  (prod)   │   │   (dev)    │   │  (opt)   │
└───────────┘   └────────────┘   └──────────┘
```

---

## Component Design

### 1. Client-Side Sync Layer

#### 1.1 Sync Manager

**Responsibilities:**
- Detect local changes
- Track sync state
- Handle sync operations
- Manage conflicts
- Queue operations

**Interface:**
```typescript
interface SyncManager {
  // Sync operations
  sync(options?: SyncOptions): Promise<SyncResult>;
  syncEntity(type: EntityType, id: ID): Promise<void>;
  
  // Change tracking
  trackChange(change: DataChange): void;
  getPendingChanges(): DataChange[];
  
  // Sync state
  getSyncState(): SyncState;
  getLastSyncTime(): number;
  
  // Configuration
  configure(config: SyncConfig): void;
  enable(): void;
  disable(): void;
}

interface SyncOptions {
  force?: boolean;        // Force full sync
  entities?: EntityType[]; // Sync specific entities
  direction?: 'push' | 'pull' | 'both'; // Sync direction
}

interface SyncResult {
  success: boolean;
  synced: number;         // Number of items synced
  conflicts: Conflict[];  // Conflicts found
  errors: SyncError[];    // Errors encountered
  timestamp: number;
}

interface SyncState {
  enabled: boolean;
  connected: boolean;
  syncing: boolean;
  lastSync: number;
  pendingChanges: number;
  conflicts: number;
}
```

#### 1.2 Change Detection

**Strategy:** Track changes in IndexedDB using version system (already implemented).

**Implementation:**
```typescript
// Add sync-specific fields to entities
interface SyncIndexed {
  syncStatus?: 'synced' | 'pending' | 'conflict';
  lastSyncTime?: number;
  syncVersion?: string;
}

// Change tracking
interface DataChange {
  entityType: EntityType;
  entityId: ID;
  operation: 'create' | 'update' | 'delete';
  timestamp: number;
  version: string;
  data?: any;
}

// Change queue in IndexedDB
const changeQueue: DataChange[] = [];
```

#### 1.3 Conflict Resolution

**Client-Side Strategy:**
- Present conflicts to user
- Offer resolution options
- Preview changes
- Allow manual merge

**UI Component:**
```typescript
interface ConflictResolutionDialog {
  conflicts: Conflict[];
  onResolve: (resolutions: Resolution[]) => void;
}

interface Conflict {
  entityType: EntityType;
  entityId: ID;
  localVersion: any;
  remoteVersion: any;
  localTimestamp: number;
  remoteTimestamp: number;
  diff: Patch;
}

type ResolutionStrategy = 
  | 'use-local'    // Keep local version
  | 'use-remote'   // Use server version
  | 'merge'        // Manual merge
  | 'create-both'; // Keep both as separate items

interface Resolution {
  conflictId: string;
  strategy: ResolutionStrategy;
  mergedData?: any;
}
```

---

### 2. Server Architecture (Hono-Based)

#### 2.1 Why Hono?

**Advantages:**
- **Lightweight:** Minimal overhead, fast startup
- **Edge-Ready:** Works on Cloudflare Workers, Deno Deploy, Bun
- **Type-Safe:** Excellent TypeScript support
- **Simple:** Easy to understand and maintain
- **Flexible:** Works with multiple runtimes and databases
- **Fast:** High performance routing
- **Extensible:** Easy to add middleware

#### 2.2 Server Structure

```
quizzy-server/
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Hono app setup
│   ├── config/
│   │   └── database.ts       # Database configuration
│   ├── routes/
│   │   ├── auth.ts           # Authentication routes
│   │   ├── sync.ts           # Sync endpoints
│   │   ├── entities.ts       # CRUD endpoints
│   │   └── websocket.ts      # WebSocket for real-time
│   ├── middleware/
│   │   ├── auth.ts           # JWT authentication
│   │   ├── cors.ts           # CORS handling
│   │   └── logger.ts         # Request logging
│   ├── services/
│   │   ├── sync-engine.ts    # Core sync logic
│   │   ├── conflict-resolver.ts # Conflict resolution
│   │   └── encryption.ts     # E2E encryption (optional)
│   ├── models/
│   │   ├── user.ts           # User model
│   │   └── sync-entity.ts    # Synced entity model
│   ├── db/
│   │   ├── postgres.ts       # PostgreSQL adapter
│   │   ├── sqlite.ts         # SQLite adapter
│   │   └── schema.ts         # Database schema
│   └── utils/
│       ├── crypto.ts         # Cryptography utilities
│       └── version.ts        # Version comparison
├── tests/
│   └── ...
├── package.json
└── tsconfig.json
```

#### 2.3 Core Server Implementation

**Entry Point (index.ts):**
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import syncRoutes from './routes/sync';
import entityRoutes from './routes/entities';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  credentials: true,
}));

// Public routes
app.route('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/*', authMiddleware);
app.route('/api/sync', syncRoutes);
app.route('/api/entities', entityRoutes);

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

export default app;
```

**Sync Routes (routes/sync.ts):**
```typescript
import { Hono } from 'hono';
import { SyncEngine } from '../services/sync-engine';

const sync = new Hono();

// Get sync status
sync.get('/status', async (c) => {
  const userId = c.get('userId');
  const status = await SyncEngine.getStatus(userId);
  return c.json(status);
});

// Push local changes to server
sync.post('/push', async (c) => {
  const userId = c.get('userId');
  const changes = await c.req.json();
  const result = await SyncEngine.push(userId, changes);
  return c.json(result);
});

// Pull remote changes from server
sync.get('/pull', async (c) => {
  const userId = c.get('userId');
  const since = c.req.query('since');
  const changes = await SyncEngine.pull(userId, since);
  return c.json(changes);
});

// Full sync operation
sync.post('/sync', async (c) => {
  const userId = c.get('userId');
  const { localChanges, lastSync } = await c.req.json();
  const result = await SyncEngine.sync(userId, localChanges, lastSync);
  return c.json(result);
});

// Resolve conflicts
sync.post('/conflicts/resolve', async (c) => {
  const userId = c.get('userId');
  const resolutions = await c.req.json();
  const result = await SyncEngine.resolveConflicts(userId, resolutions);
  return c.json(result);
});

export default sync;
```

---

### 3. Database Schema

#### 3.1 Core Tables

**Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  encryption_key VARCHAR(255), -- For E2E encryption
  settings JSONB DEFAULT '{}'
);

CREATE INDEX idx_users_email ON users(email);
```

**Synced Entities Table:**
```sql
CREATE TABLE synced_entities (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'question', 'paper', 'tag', etc.
  entity_id VARCHAR(255) NOT NULL,  -- Client-side ID
  data JSONB NOT NULL,               -- Entity data (possibly encrypted)
  version VARCHAR(255) NOT NULL,     -- Version hash
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN DEFAULT FALSE,
  
  UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX idx_synced_entities_user ON synced_entities(user_id);
CREATE INDEX idx_synced_entities_type ON synced_entities(entity_type);
CREATE INDEX idx_synced_entities_updated ON synced_entities(updated_at);
CREATE INDEX idx_synced_entities_deleted ON synced_entities(deleted);
```

**Sync History Table:**
```sql
CREATE TABLE sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sync_type VARCHAR(20) NOT NULL, -- 'push', 'pull', 'full'
  entities_synced INTEGER DEFAULT 0,
  conflicts_found INTEGER DEFAULT 0,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
  error_message TEXT
);

CREATE INDEX idx_sync_history_user ON sync_history(user_id);
CREATE INDEX idx_sync_history_started ON sync_history(started_at);
```

**Conflicts Table:**
```sql
CREATE TABLE conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  local_version VARCHAR(255),
  remote_version VARCHAR(255),
  local_data JSONB,
  remote_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  resolution VARCHAR(20), -- 'local', 'remote', 'merge', 'both'
  resolved_data JSONB
);

CREATE INDEX idx_conflicts_user ON conflicts(user_id);
CREATE INDEX idx_conflicts_resolved ON conflicts(resolved_at);
```

#### 3.2 Database Adapters

**Abstract Interface:**
```typescript
interface DatabaseAdapter {
  // User operations
  createUser(user: UserData): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  
  // Entity operations
  getEntities(userId: string, since?: number): Promise<SyncedEntity[]>;
  getEntity(userId: string, type: string, id: string): Promise<SyncedEntity | null>;
  upsertEntity(entity: SyncedEntity): Promise<SyncedEntity>;
  deleteEntity(userId: string, type: string, id: string): Promise<void>;
  
  // Conflict operations
  createConflict(conflict: Conflict): Promise<Conflict>;
  getConflicts(userId: string): Promise<Conflict[]>;
  resolveConflict(id: string, resolution: Resolution): Promise<void>;
  
  // Sync history
  createSyncRecord(record: SyncRecord): Promise<SyncRecord>;
  getSyncHistory(userId: string, limit?: number): Promise<SyncRecord[]>;
}
```

---

### 4. Sync Protocol

#### 4.1 Three-Way Merge Strategy

**Process:**
1. Client sends local changes with timestamps and versions
2. Server compares with server state
3. Determine for each entity:
   - **No conflict:** Apply change
   - **Conflict:** Create conflict record
4. Return updated entities and conflicts to client
5. Client resolves conflicts and re-syncs

**Entity Comparison:**
```typescript
function compareVersions(
  local: Entity,
  remote: Entity,
  lastSync: number
): 'no-conflict' | 'local-newer' | 'remote-newer' | 'conflict' {
  if (!remote) return 'no-conflict'; // New entity
  if (!local) return 'remote-newer'; // Deleted locally
  
  const localTime = local.lastUpdate || 0;
  const remoteTime = remote.lastUpdate || 0;
  
  // No changes on either side since last sync
  if (localTime <= lastSync && remoteTime <= lastSync) {
    return 'no-conflict';
  }
  
  // Only local changed
  if (localTime > lastSync && remoteTime <= lastSync) {
    return 'local-newer';
  }
  
  // Only remote changed
  if (remoteTime > lastSync && localTime <= lastSync) {
    return 'remote-newer';
  }
  
  // Both changed - conflict
  if (localTime > lastSync && remoteTime > lastSync) {
    // Check if versions are identical (same changes)
    if (local.currentVersion === remote.currentVersion) {
      return 'no-conflict';
    }
    return 'conflict';
  }
  
  return 'no-conflict';
}
```

#### 4.2 Sync Flow

**Full Sync:**
```typescript
interface SyncRequest {
  lastSync: number;
  localChanges: DataChange[];
}

interface SyncResponse {
  success: boolean;
  timestamp: number;
  applied: AppliedChange[];
  conflicts: Conflict[];
  remoteChanges: RemoteChange[];
}

async function performSync(
  userId: string,
  request: SyncRequest
): Promise<SyncResponse> {
  const { lastSync, localChanges } = request;
  const results: AppliedChange[] = [];
  const conflicts: Conflict[] = [];
  
  // Process local changes
  for (const change of localChanges) {
    const remote = await db.getEntity(
      userId,
      change.entityType,
      change.entityId
    );
    
    const comparison = compareVersions(
      change.data,
      remote?.data,
      lastSync
    );
    
    if (comparison === 'conflict') {
      // Create conflict
      const conflict = await db.createConflict({
        userId,
        entityType: change.entityType,
        entityId: change.entityId,
        localData: change.data,
        remoteData: remote?.data,
        localVersion: change.version,
        remoteVersion: remote?.version,
      });
      conflicts.push(conflict);
    } else {
      // Apply change
      const applied = await db.upsertEntity({
        userId,
        entityType: change.entityType,
        entityId: change.entityId,
        data: change.data,
        version: change.version,
        deleted: change.operation === 'delete',
      });
      results.push({ change, status: 'applied' });
    }
  }
  
  // Get remote changes since last sync
  const remoteChanges = await db.getEntities(userId, lastSync);
  
  return {
    success: true,
    timestamp: Date.now(),
    applied: results,
    conflicts,
    remoteChanges,
  };
}
```

---

### 5. Authentication & Security

#### 5.1 Authentication

**Strategy:** JWT-based authentication with refresh tokens.

**Flow:**
```typescript
// Registration
POST /api/auth/register
{
  email: string;
  password: string;
}
Response: { token: string; refreshToken: string; user: User }

// Login
POST /api/auth/login
{
  email: string;
  password: string;
}
Response: { token: string; refreshToken: string; user: User }

// Refresh token
POST /api/auth/refresh
{
  refreshToken: string;
}
Response: { token: string; refreshToken: string }

// Logout
POST /api/auth/logout
Headers: { Authorization: 'Bearer <token>' }
```

**Implementation:**
```typescript
import { sign, verify } from 'hono/jwt';
import { hash, compare } from 'bcrypt';

// Register user
async function register(email: string, password: string): Promise<AuthResult> {
  const passwordHash = await hash(password, 10);
  const user = await db.createUser({ email, passwordHash });
  
  const token = await sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  
  const refreshToken = await sign(
    { userId: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );
  
  return { token, refreshToken, user };
}

// Auth middleware
async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.substring(7);
  try {
    const payload = await verify(token, process.env.JWT_SECRET!);
    c.set('userId', payload.userId);
    c.set('userEmail', payload.email);
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}
```

#### 5.2 End-to-End Encryption (Optional)

**Strategy:** Client-side encryption with user-controlled keys.

**Flow:**
1. User enables E2E encryption in settings
2. Generate encryption key from password + salt
3. Encrypt entity data before sync
4. Store encrypted data on server
5. Decrypt on client after fetch

**Implementation:**
```typescript
import { AES, SHA256 } from 'crypto-js';

class EncryptionService {
  private key: string | null = null;
  
  async initialize(password: string, salt: string) {
    this.key = SHA256(password + salt).toString();
  }
  
  encrypt(data: any): string {
    if (!this.key) throw new Error('Encryption not initialized');
    const json = JSON.stringify(data);
    return AES.encrypt(json, this.key).toString();
  }
  
  decrypt(encrypted: string): any {
    if (!this.key) throw new Error('Encryption not initialized');
    const decrypted = AES.decrypt(encrypted, this.key);
    const json = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(json);
  }
}
```

**Note:** E2E encryption means server cannot read data, which limits server-side features (search, analytics). Make it optional and document trade-offs.

---

### 6. Real-Time Sync (WebSocket) - Optional

**Purpose:** Push notifications for multi-device sync.

**Implementation:**
```typescript
import { Hono } from 'hono';
import { upgradeWebSocket } from 'hono/cloudflare-workers';

const ws = new Hono();

// WebSocket connection
ws.get('/sync', upgradeWebSocket((c) => ({
  onOpen: (evt, ws) => {
    const userId = c.get('userId');
    subscribeToUserChannel(userId, ws);
  },
  onMessage: (evt, ws) => {
    // Handle client messages (e.g., sync requests)
  },
  onClose: () => {
    // Cleanup
  }
})));

// Notify clients of changes
async function notifyChange(userId: string, change: DataChange) {
  const connections = getUserConnections(userId);
  const message = JSON.stringify({ type: 'sync', change });
  
  connections.forEach(ws => {
    ws.send(message);
  });
}
```

**Note:** WebSocket support depends on the runtime (Cloudflare Workers supports Durable Objects for WebSocket).

---

## Deployment Options

### Option 1: Cloudflare Workers + D1 (Recommended for Edge)

**Pros:**
- Global edge deployment
- Automatic scaling
- D1 for SQLite
- WebSocket via Durable Objects
- Very cost-effective

**Cons:**
- Limited to Cloudflare ecosystem
- D1 is beta (as of 2024)

**Setup:**
```bash
npm create hono@latest quizzy-server
cd quizzy-server
npm install
wrangler d1 create quizzy-db
wrangler deploy
```

### Option 2: Node.js + PostgreSQL (Recommended for Production)

**Pros:**
- Battle-tested stack
- Full PostgreSQL features
- Easy to self-host
- No vendor lock-in

**Cons:**
- Requires server management
- Not edge-deployed

**Setup:**
```bash
npm create hono@latest quizzy-server
cd quizzy-server
npm install pg
# Deploy to VPS, Heroku, Railway, etc.
```

### Option 3: Deno Deploy + Deno KV

**Pros:**
- TypeScript-first
- Edge deployment
- Built-in KV store
- Simple deployment

**Cons:**
- Smaller ecosystem
- Deno KV limitations

### Option 4: Self-Hosted (Docker)

**Pros:**
- Full control
- No cloud costs
- Data privacy

**Setup:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/quizzy
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
  
  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=quizzy
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Implementation Phases

### Phase 1: Foundation (4-6 weeks)
**Priority:** High

- [ ] Design database schema
- [ ] Set up Hono server project
- [ ] Implement authentication (register, login, JWT)
- [ ] Create database adapters (PostgreSQL + SQLite)
- [ ] Basic CRUD API for entities
- [ ] Deploy to staging environment

### Phase 2: Sync Engine (6-8 weeks)
**Priority:** High

- [ ] Implement client-side sync manager
- [ ] Implement change detection and tracking
- [ ] Implement server sync engine
- [ ] Implement version comparison and conflict detection
- [ ] Add sync endpoints (push, pull, full sync)
- [ ] Test basic sync scenarios

### Phase 3: Conflict Resolution (4-6 weeks)
**Priority:** High

- [ ] Design conflict resolution UI
- [ ] Implement client-side conflict handling
- [ ] Implement server-side conflict storage
- [ ] Add conflict resolution endpoint
- [ ] Test conflict scenarios
- [ ] Add conflict history and logging

### Phase 4: Production Readiness (3-4 weeks)
**Priority:** High

- [ ] Add error handling and retry logic
- [ ] Implement rate limiting
- [ ] Add sync monitoring and metrics
- [ ] Write comprehensive tests
- [ ] Documentation and API reference
- [ ] Production deployment

### Phase 5: Advanced Features (6-8 weeks)
**Priority:** Medium

- [ ] Implement WebSocket for real-time sync
- [ ] Add E2E encryption option
- [ ] Optimize sync performance (batch operations)
- [ ] Add sync history and analytics
- [ ] Implement data export from server
- [ ] Add admin dashboard

### Phase 6: Polish (2-4 weeks)
**Priority:** Low

- [ ] UI/UX improvements
- [ ] Better error messages
- [ ] Sync status indicators
- [ ] Network quality detection
- [ ] Offline queue management
- [ ] User settings and preferences

**Total Estimated Time:** 25-36 weeks (6-9 months)

---

## API Reference

### Sync Endpoints

```
POST /api/sync/push
Body: { changes: DataChange[] }
Response: { applied: number, conflicts: Conflict[] }

GET /api/sync/pull?since=<timestamp>
Response: { changes: RemoteChange[] }

POST /api/sync/sync
Body: { lastSync: number, localChanges: DataChange[] }
Response: SyncResponse

GET /api/sync/status
Response: { lastSync: number, conflicts: number, pending: number }

POST /api/sync/conflicts/resolve
Body: { resolutions: Resolution[] }
Response: { resolved: number }
```

### Entity Endpoints

```
GET /api/entities/:type
Response: { entities: Entity[] }

GET /api/entities/:type/:id
Response: { entity: Entity }

POST /api/entities/:type
Body: { entity: Entity }
Response: { entity: Entity }

PUT /api/entities/:type/:id
Body: { entity: Partial<Entity> }
Response: { entity: Entity }

DELETE /api/entities/:type/:id
Response: { success: boolean }
```

---

## Testing Strategy

### Unit Tests
- [ ] Sync manager operations
- [ ] Version comparison logic
- [ ] Conflict detection
- [ ] Encryption/decryption
- [ ] Database adapters

### Integration Tests
- [ ] Full sync flow
- [ ] Conflict resolution
- [ ] Authentication flow
- [ ] Multi-device scenarios

### E2E Tests
- [ ] User registration and login
- [ ] Create and sync entities
- [ ] Conflict scenarios
- [ ] Offline → online transitions
- [ ] Multi-device sync

---

## Monitoring and Observability

### Metrics to Track
- Sync success rate
- Sync duration
- Conflict frequency
- API response times
- Error rates
- Active users
- Storage usage per user

### Logging
```typescript
interface SyncLog {
  timestamp: number;
  userId: string;
  operation: string;
  duration: number;
  entitiesSynced: number;
  conflicts: number;
  success: boolean;
  error?: string;
}
```

---

## Cost Estimation

### Cloudflare Workers (for 10,000 users)
- Workers: Free (under 100k req/day) or $5/month
- D1: Free beta or ~$5/month
- Storage: ~$0.15/GB
- **Total: ~$10-20/month**

### VPS Hosting (for 10,000 users)
- VPS: $20-50/month
- Database: $10-30/month (managed) or included
- Bandwidth: Usually included
- **Total: ~$30-80/month**

### Self-Hosted
- Hardware cost (one-time)
- Electricity: Minimal
- **Total: ~$0/month (ongoing)**

---

## Security Considerations

### Data Protection
- [ ] HTTPS only (TLS 1.3)
- [ ] Password hashing (bcrypt, rounds=10)
- [ ] JWT with short expiry (15 min)
- [ ] Refresh token rotation
- [ ] Rate limiting on API endpoints
- [ ] Input validation and sanitization
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection
- [ ] CSRF tokens for mutations

### Privacy
- [ ] GDPR compliance (if applicable)
- [ ] Data deletion on account closure
- [ ] Export user data functionality
- [ ] Optional E2E encryption
- [ ] Clear privacy policy

### Audit
- [ ] Log all data access
- [ ] Track sync operations
- [ ] Monitor unusual activity
- [ ] Alert on security events

---

## Migration Path

For existing users with local data:

1. **Opt-in:** Sync is completely optional
2. **First sync:** Export local data → upload to server
3. **Verification:** Compare local vs. server data
4. **Enable auto-sync:** Background sync on changes
5. **Multi-device:** Install on other devices → sync

**Important:** Always maintain local-first approach. Server is a backup/sync layer, not the primary data store.

---

## FAQs

**Q: What happens if the server goes down?**
A: The app continues to work normally with local data. Sync resumes when server is back.

**Q: Can I self-host the server?**
A: Yes! We provide Docker images and deployment guides.

**Q: Is my data encrypted?**
A: Optional E2E encryption is available. Standard deployment uses TLS + server-side encryption.

**Q: How much storage do I get?**
A: Depends on plan. Estimate: ~100MB for 10,000 questions.

**Q: Can I switch between devices seamlessly?**
A: Yes, with auto-sync enabled. Changes sync within seconds (with WebSocket) or minutes (polling).

**Q: What if I have conflicts on multiple devices?**
A: The app will present conflicts and let you choose which version to keep, or manually merge.

---

## Related Documents

- [MOBILE_PWA_ROADMAP.md](MOBILE_PWA_ROADMAP.md) - Mobile and PWA implementation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [BUGS_AND_TODO.md](BUGS_AND_TODO.md) - Known issues and roadmap

---

**Document Version:** 1.0  
**Last Updated:** October 2025  
**Status:** Design Phase  
**Next Review:** After Phase 1 implementation
