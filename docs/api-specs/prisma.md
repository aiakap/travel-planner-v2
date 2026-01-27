# Prisma ORM Specification

## Overview

Prisma is a next-generation ORM that provides type-safe database access for Node.js and TypeScript. This project uses Prisma to interact with the Neon PostgreSQL database.

**Version**: 6.4.1

**Last Updated**: January 27, 2026

---

## Configuration

### Schema File

**Location**: `prisma/schema.prisma`

**Basic Structure**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  trips     Trip[]
  
  @@map("users")
}

model Trip {
  id          String   @id @default(cuid())
  name        String
  destination String
  startDate   DateTime
  endDate     DateTime
  userId      String
  
  user        User     @relation(fields: [userId], references: [id])
  segments    Segment[]
  
  @@map("trips")
}
```

---

## Prisma Client

### Initialization

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### Usage

```typescript
import { prisma } from '@/lib/prisma';

// Create
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
  },
});

// Read
const users = await prisma.user.findMany({
  where: { email: { contains: '@example.com' } },
  include: { trips: true },
});

// Update
await prisma.user.update({
  where: { id: 'user-123' },
  data: { name: 'Jane Doe' },
});

// Delete
await prisma.user.delete({
  where: { id: 'user-123' },
});
```

---

## CRUD Operations

### Create

```typescript
// Simple create
const trip = await prisma.trip.create({
  data: {
    name: 'Paris Vacation',
    destination: 'Paris',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-07'),
    userId: 'user-123',
  },
});

// Create with relations
const trip = await prisma.trip.create({
  data: {
    name: 'Tokyo Trip',
    destination: 'Tokyo',
    startDate: new Date('2026-08-01'),
    endDate: new Date('2026-08-10'),
    user: {
      connect: { id: 'user-123' },
    },
    segments: {
      create: [
        {
          type: 'FLIGHT',
          startTime: new Date('2026-08-01T08:00:00Z'),
          endTime: new Date('2026-08-01T20:00:00Z'),
        },
      ],
    },
  },
  include: {
    segments: true,
  },
});
```

### Read

```typescript
// Find unique
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});

// Find many with filters
const trips = await prisma.trip.findMany({
  where: {
    userId: 'user-123',
    startDate: {
      gte: new Date(),
    },
  },
  orderBy: {
    startDate: 'asc',
  },
  take: 10,
  skip: 0,
});

// Find with relations
const trip = await prisma.trip.findUnique({
  where: { id: 'trip-123' },
  include: {
    user: true,
    segments: {
      orderBy: { startTime: 'asc' },
    },
  },
});

// Select specific fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
  },
});
```

### Update

```typescript
// Simple update
await prisma.trip.update({
  where: { id: 'trip-123' },
  data: { name: 'Updated Trip Name' },
});

// Update with relations
await prisma.trip.update({
  where: { id: 'trip-123' },
  data: {
    segments: {
      create: {
        type: 'HOTEL',
        startTime: new Date('2026-08-02T15:00:00Z'),
      },
      deleteMany: {
        type: 'FLIGHT',
      },
    },
  },
});

// Upsert
await prisma.user.upsert({
  where: { email: 'user@example.com' },
  create: {
    email: 'user@example.com',
    name: 'New User',
  },
  update: {
    name: 'Updated Name',
  },
});
```

### Delete

```typescript
// Delete one
await prisma.trip.delete({
  where: { id: 'trip-123' },
});

// Delete many
await prisma.segment.deleteMany({
  where: {
    tripId: 'trip-123',
    type: 'FLIGHT',
  },
});
```

---

## Advanced Queries

### Filtering

```typescript
// Complex where conditions
const trips = await prisma.trip.findMany({
  where: {
    AND: [
      { userId: 'user-123' },
      {
        OR: [
          { destination: 'Paris' },
          { destination: 'London' },
        ],
      },
      {
        startDate: {
          gte: new Date('2026-01-01'),
          lte: new Date('2026-12-31'),
        },
      },
    ],
  },
});

// String filters
const users = await prisma.user.findMany({
  where: {
    email: {
      contains: '@gmail.com',
      mode: 'insensitive',
    },
  },
});

// Array filters
const trips = await prisma.trip.findMany({
  where: {
    tags: {
      hasSome: ['beach', 'relaxation'],
    },
  },
});
```

### Sorting

```typescript
const trips = await prisma.trip.findMany({
  orderBy: [
    { startDate: 'desc' },
    { name: 'asc' },
  ],
});
```

### Pagination

```typescript
// Offset pagination
const page = 2;
const pageSize = 10;

const trips = await prisma.trip.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
});

// Cursor pagination
const trips = await prisma.trip.findMany({
  take: 10,
  skip: 1,
  cursor: {
    id: 'last-trip-id',
  },
});
```

### Aggregation

```typescript
// Count
const count = await prisma.trip.count({
  where: { userId: 'user-123' },
});

// Aggregate
const stats = await prisma.trip.aggregate({
  where: { userId: 'user-123' },
  _count: true,
  _avg: { durationDays: true },
  _sum: { budget: true },
});

// Group by
const tripsByDestination = await prisma.trip.groupBy({
  by: ['destination'],
  _count: true,
  orderBy: {
    _count: {
      destination: 'desc',
    },
  },
});
```

---

## Transactions

### Sequential Operations

```typescript
await prisma.$transaction(async (tx) => {
  // Create user
  const user = await tx.user.create({
    data: { email: 'user@example.com' },
  });
  
  // Create trip for user
  const trip = await tx.trip.create({
    data: {
      name: 'Vacation',
      userId: user.id,
      startDate: new Date(),
      endDate: new Date(),
    },
  });
  
  // If any operation fails, entire transaction rolls back
});
```

### Interactive Transactions

```typescript
const result = await prisma.$transaction([
  prisma.user.create({ data: { email: 'user1@example.com' } }),
  prisma.user.create({ data: { email: 'user2@example.com' } }),
  prisma.trip.create({ data: { /* ... */ } }),
]);
```

---

## Migrations

### Development

```bash
# Create migration
npx prisma migrate dev --name add_user_preferences

# Reset database (warning: deletes data)
npx prisma migrate reset

# Apply pending migrations
npx prisma migrate dev
```

### Production

```bash
# Deploy migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

### Migration Files

Located in `prisma/migrations/`:
```
prisma/migrations/
  20260127000000_initial/
    migration.sql
  20260127120000_add_segments/
    migration.sql
```

---

## Raw SQL

### Execute Raw Queries

```typescript
// Raw query
const result = await prisma.$queryRaw`
  SELECT * FROM trips 
  WHERE destination = ${destination}
  AND start_date > ${new Date()}
`;

// Raw execute (INSERT, UPDATE, DELETE)
await prisma.$executeRaw`
  UPDATE trips 
  SET status = 'archived'
  WHERE end_date < ${thirtyDaysAgo}
`;
```

### Unsafe (Be Careful)

```typescript
// Only use with trusted input
const result = await prisma.$queryRawUnsafe(
  'SELECT * FROM trips WHERE destination = $1',
  destination
);
```

---

## Type Safety

### Generated Types

After schema changes:
```bash
npx prisma generate
```

Prisma generates TypeScript types:

```typescript
import { User, Trip, Prisma } from '@prisma/client';

// Type for user
const user: User = await prisma.user.findUnique({ where: { id } });

// Type for user with trips
type UserWithTrips = Prisma.UserGetPayload<{
  include: { trips: true };
}>;

// Input types
const createData: Prisma.TripCreateInput = {
  name: 'New Trip',
  destination: 'Paris',
  startDate: new Date(),
  endDate: new Date(),
  user: {
    connect: { id: 'user-123' },
  },
};
```

---

## Usage in Project

### Server Actions

From `lib/actions/profile-actions.ts`:

```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function updateUserProfile(data: {
  name: string;
  preferences: any;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  return await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      preferences: data.preferences,
    },
  });
}
```

### API Routes

From `app/api/trips/route.ts` (example):

```typescript
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id },
    include: {
      segments: {
        orderBy: { startTime: 'asc' },
      },
    },
    orderBy: { startDate: 'desc' },
  });
  
  return Response.json(trips);
}
```

---

## Best Practices

### 1. Use Select for Performance

```typescript
// Good - only fetch needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
  },
});

// Avoid - fetches all fields
const users = await prisma.user.findMany();
```

### 2. Index Critical Fields

```prisma
model Trip {
  userId String
  startDate DateTime
  
  @@index([userId])
  @@index([startDate])
  @@index([userId, startDate])
}
```

### 3. Use Transactions for Multi-Step Operations

```typescript
// Atomic operations
await prisma.$transaction([
  prisma.trip.update({ where: { id }, data: { status: 'cancelled' } }),
  prisma.refund.create({ data: { tripId: id, amount: 100 } }),
]);
```

### 4. Implement Soft Deletes

```prisma
model Trip {
  deletedAt DateTime?
  
  @@map("trips")
}
```

```typescript
// Soft delete
await prisma.trip.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// Query only non-deleted
const trips = await prisma.trip.findMany({
  where: { deletedAt: null },
});
```

---

## Testing

### Test Database

```bash
# Set test database URL
export DATABASE_URL="postgresql://localhost:5432/test_db"

# Run migrations
npx prisma migrate deploy

# Run tests
npm test
```

### Mocking Prisma

```typescript
import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});

// In tests
prismaMock.user.findUnique.mockResolvedValue({
  id: '123',
  email: 'test@example.com',
  name: 'Test User',
});
```

---

## Performance Optimization

### 1. Connection Pooling

Prisma manages connections automatically, but for serverless:

```typescript
// Use Prisma with Neon's pooler
// Connection pooling handled by Neon
```

### 2. Query Optimization

```typescript
// Use findUnique instead of findFirst when possible
const user = await prisma.user.findUnique({
  where: { id: 'user-123' },
});

// Batch queries
const [users, trips] = await Promise.all([
  prisma.user.findMany(),
  prisma.trip.findMany(),
]);
```

### 3. Reduce Over-fetching

```typescript
// Good - specific fields
const trips = await prisma.trip.findMany({
  select: {
    id: true,
    name: true,
    startDate: true,
  },
});

// Avoid - fetches everything
const trips = await prisma.trip.findMany({
  include: {
    user: {
      include: {
        profile: {
          include: {
            // Too deep
          },
        },
      },
    },
  },
});
```

---

## Common Patterns

### Find or Create

```typescript
async function findOrCreateUser(email: string) {
  let user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (!user) {
    user = await prisma.user.create({
      data: { email },
    });
  }
  
  return user;
}
```

### Soft Delete Query Helper

```typescript
function excludeDeleted<T>(model: any) {
  return {
    ...model,
    findMany: (args: any) =>
      model.findMany({
        ...args,
        where: {
          ...args?.where,
          deletedAt: null,
        },
      }),
  };
}

const activeTrips = excludeDeleted(prisma.trip);
const trips = await activeTrips.findMany();
```

### Pagination Helper

```typescript
interface PaginationParams {
  page: number;
  pageSize: number;
}

async function paginateTrips(userId: string, { page, pageSize }: PaginationParams) {
  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where: { userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.trip.count({
      where: { userId },
    }),
  ]);
  
  return {
    trips,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
```

---

## Schema Best Practices

### 1. Use Descriptive Names

```prisma
model Trip {
  // Good
  startDate DateTime
  endDate   DateTime
  
  // Avoid
  sd DateTime
  ed DateTime
}
```

### 2. Add Indexes

```prisma
model Trip {
  userId String
  status String
  createdAt DateTime
  
  @@index([userId])
  @@index([status])
  @@index([userId, status])
  @@index([createdAt])
}
```

### 3. Use Enums for Fixed Values

```prisma
enum TripStatus {
  DRAFT
  ACTIVE
  COMPLETED
  CANCELLED
}

model Trip {
  status TripStatus @default(DRAFT)
}
```

### 4. Add Updated Timestamp

```prisma
model Trip {
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Troubleshooting

### Common Issues

**1. Type Errors After Schema Changes**
```
Error: Property 'X' does not exist
```
**Solution**:
```bash
npx prisma generate
```

**2. Migration Conflicts**
```
Error: Migration conflict detected
```
**Solution**:
```bash
# Resolve in schema
npx prisma migrate dev

# Or reset (caution: deletes data)
npx prisma migrate reset
```

**3. Connection Issues**
```
Error: Can't reach database server
```
**Solution**:
- Check `DATABASE_URL` is correct
- Verify Neon database is running
- Check network connectivity
- Ensure SSL is enabled

**4. Slow Queries**
**Solution**:
- Add indexes to frequently queried fields
- Use `select` instead of fetching all fields
- Analyze query with `EXPLAIN`
- Check connection pooling

---

## Prisma Studio

### Launch Studio

```bash
npx prisma studio
```

**URL**: http://localhost:5555

**Features**:
- Browse database records
- Edit data directly
- View relations
- Test queries

**Use Cases**:
- Debugging
- Data inspection
- Quick edits
- Testing relations

---

## CLI Commands

### Essential Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio

# Format schema
npx prisma format

# Validate schema
npx prisma validate

# Pull schema from database
npx prisma db pull

# Push schema to database (no migration)
npx prisma db push

# Seed database
npx prisma db seed
```

---

## Seeding

### Seed Script

From `prisma/seed.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create test users
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
    },
  });
  
  // Create test trips
  await prisma.trip.create({
    data: {
      name: 'Sample Trip',
      destination: 'Paris',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-07'),
      userId: user.id,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Configure in package.json**:
```json
{
  "prisma": {
    "seed": "node prisma/seed.js"
  }
}
```

**Run Seed**:
```bash
npx prisma db seed
```

---

## Official Resources

### Documentation
- [Prisma Documentation](https://www.prisma.io/docs)
- [Client Reference](https://www.prisma.io/docs/orm/reference/prisma-client-reference)
- [PostgreSQL Connector](https://www.prisma.io/docs/orm/overview/databases/postgresql)
- [Migrations](https://www.prisma.io/docs/orm/prisma-migrate)
- [Schema Reference](https://www.prisma.io/docs/orm/reference/prisma-schema-reference)

### Tools
- [Prisma Studio](https://www.prisma.io/studio)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=Prisma.prisma)
- [Prisma Examples](https://github.com/prisma/prisma-examples)

### Community
- [GitHub Discussions](https://github.com/prisma/prisma/discussions)
- [Discord](https://discord.gg/prisma)
- [Twitter](https://twitter.com/prisma)

---

## Related Documentation

- [API Reference](../API_REFERENCE.md) - Overview of all APIs
- [Neon PostgreSQL](./neon.md) - Database platform
