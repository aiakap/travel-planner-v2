# Neon PostgreSQL Specification

## Overview

Neon is a serverless PostgreSQL database platform with autoscaling, branching, and modern developer experience. This project uses Neon as the primary database.

**Last Updated**: January 27, 2026

---

## Authentication

**Method**: Connection String

**Environment Variable**: `DATABASE_URL`

**Format**:
```
postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require&channel_binding=require
```

**Current Connection**:
```
postgresql://neondb_owner:PASSWORD@ep-hidden-cake-ahuggbae-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## Key Features

### 1. Serverless Architecture

- **Autoscaling**: Automatically scales compute based on demand
- **Instant Cold Starts**: Fast startup from idle state
- **Usage-Based Billing**: Pay only for what you use

### 2. Database Branching

Create database branches for development:

```bash
# Create branch
neon branches create --name dev

# Get branch connection string
neon connection-string dev
```

**Use Cases**:
- Feature development
- Testing migrations
- Preview deployments

### 3. Connection Pooling

**Pooler Endpoint**: Included in connection string (`-pooler` suffix)

**Benefits**:
- Reduces connection overhead
- Better performance in serverless
- Handles connection limits

### 4. Point-in-Time Recovery

Restore database to any point in time (retention period varies by plan).

---

## Data API (Alternative Access)

**Base URL**: `https://console.neon.tech/api/v2`

**Purpose**: HTTP-based database access for serverless environments

**Authentication**: API key

**Example Request**:
```bash
curl -X POST https://console.neon.tech/api/v2/projects/PROJECT_ID/branches/BRANCH_ID/query \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM users WHERE id = $1",
    "params": ["123"]
  }'
```

**Use Cases**:
- Edge functions without connection pooling
- Environments with connection limits
- HTTP-only runtimes

---

## Serverless Driver

**Package**: `@neondatabase/serverless`

**Purpose**: Optimized PostgreSQL driver for serverless/edge

**Installation**:
```bash
npm install @neondatabase/serverless
```

**Usage**:
```typescript
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const result = await pool.query('SELECT * FROM users');
console.log(result.rows);
```

---

## Usage in Project

### Database Access

All database access in this project goes through Prisma ORM:

```typescript
import { prisma } from '@/lib/prisma';

// Prisma handles the Neon connection
const users = await prisma.user.findMany();
```

See [Prisma ORM Specification](./prisma.md) for database operation details.

### Connection Configuration

From Prisma schema (`prisma/schema.prisma`):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Performance Optimization

### 1. Connection Pooling

Use the pooler endpoint in production:
```
postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db
```

### 2. Query Optimization

- Use indexes appropriately
- Limit result sets
- Use projections (select specific columns)
- Implement pagination

### 3. Autoscaling Configuration

Configure compute scaling in Neon dashboard:
- Minimum compute units
- Maximum compute units
- Autosuspend delay

---

## Monitoring

### Neon Dashboard

Access at [console.neon.tech](https://console.neon.tech)

**Metrics**:
- Active connections
- Query performance
- Storage usage
- Compute time
- Data transfer

### Query Performance

Enable slow query logging in Neon settings:
```sql
-- Queries slower than 100ms
ALTER DATABASE neondb SET log_min_duration_statement = 100;
```

---

## Backup & Recovery

### Automatic Backups

Neon automatically backs up your database:
- Continuous backup (every 24 hours)
- Point-in-time recovery available
- Retention period based on plan

### Manual Export

```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Import database
psql $DATABASE_URL < backup.sql
```

---

## Database Branching Workflow

### Development Branch

```bash
# Create dev branch from main
neon branches create --name dev --parent main

# Get connection string
export DEV_DATABASE_URL=$(neon connection-string dev)

# Run migrations on dev branch
DATABASE_URL=$DEV_DATABASE_URL npx prisma migrate dev

# Test on dev branch
DATABASE_URL=$DEV_DATABASE_URL npm run test

# Merge changes to main (via Neon UI)
```

### Preview Deployments

```bash
# Create preview branch
neon branches create --name preview-feature-x

# Deploy with preview branch
vercel --env DATABASE_URL=PREVIEW_DB_URL
```

---

## Security

### 1. SSL/TLS

Always use SSL in connection string:
```
?sslmode=require&channel_binding=require
```

### 2. IP Allowlist

Configure IP allowlist in Neon dashboard (enterprise plan).

### 3. Role-Based Access

Create separate database roles:

```sql
-- Read-only role for analytics
CREATE ROLE analytics_readonly;
GRANT CONNECT ON DATABASE neondb TO analytics_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_readonly;
```

### 4. Connection String Security

- Never commit `DATABASE_URL` to version control
- Use environment variables
- Rotate passwords periodically
- Use different credentials for dev/prod

---

## Limits & Quotas

**Free Tier**:
- 0.5 GB storage
- 100 hours compute time/month
- 1 project
- 10 branches

**Pro Tier**:
- 10 GB included storage
- 300 hours compute time/month
- Unlimited projects
- Unlimited branches

**Compute Limits**:
- Max connections: Varies by compute size
- Default autosuspend: 5 minutes of inactivity

---

## Best Practices

### 1. Use Pooler in Serverless

Always use the pooler endpoint for serverless:
```
-pooler.region.aws.neon.tech
```

### 2. Implement Connection Cleanup

```typescript
// Disconnect Prisma on shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

### 3. Monitor Compute Usage

Check compute hours to avoid unexpected scaling costs:
- Set max compute units
- Configure autosuspend
- Monitor in dashboard

### 4. Database Branching for Testing

```bash
# Create test branch
neon branches create --name test

# Run tests
DATABASE_URL=$TEST_DB_URL npm test

# Delete branch after tests
neon branches delete test
```

---

## Troubleshooting

### Common Issues

**1. Connection Timeout**
```
Error: Connection timeout
```
**Solution**:
- Check network connectivity
- Verify connection string
- Ensure SSL is enabled
- Check Neon service status

**2. Too Many Connections**
```
Error: sorry, too many clients already
```
**Solution**:
- Use pooler endpoint
- Reduce concurrent connections
- Implement connection pooling in app
- Upgrade compute size

**3. SSL/TLS Errors**
```
Error: SSL required
```
**Solution**:
- Add `?sslmode=require` to connection string
- Check SSL certificates are trusted

**4. Slow Queries**
**Solution**:
- Add indexes
- Analyze query plans
- Optimize Prisma queries
- Check compute units aren't scaled to minimum

---

## Migrations

### With Prisma

```bash
# Create migration
npx prisma migrate dev --name add_feature

# Apply to production
npx prisma migrate deploy
```

### Manual SQL

```bash
# Connect via psql
psql $DATABASE_URL

# Or execute SQL file
psql $DATABASE_URL -f migration.sql
```

---

## CLI Commands

### Installation

```bash
npm install -g neonctl
```

### Common Commands

```bash
# Login
neon auth

# List projects
neon projects list

# List branches
neon branches list

# Create branch
neon branches create --name dev

# Delete branch
neon branches delete dev

# Get connection string
neon connection-string main
```

---

## Official Resources

### Documentation
- [Neon Documentation](https://neon.tech/docs/introduction)
- [Serverless Driver](https://neon.tech/docs/serverless/serverless-driver)
- [Data API](https://neon.tech/docs/data-api/get-started)
- [Branching Guide](https://neon.tech/docs/guides/branching)
- [Prisma Integration](https://neon.tech/docs/guides/prisma)

### Tools
- [Neon Console](https://console.neon.tech)
- [CLI (neonctl)](https://neon.tech/docs/reference/neon-cli)
- [API Reference](https://neon.tech/docs/reference/api-reference)

### Support
- [Discord Community](https://discord.gg/neon)
- [GitHub Discussions](https://github.com/neondatabase/neon/discussions)
- [Support Portal](https://neon.tech/docs/introduction/support)

---

## Related Documentation

- [API Reference](../API_REFERENCE.md) - Overview of all APIs
- [Prisma ORM](./prisma.md) - Database access layer
