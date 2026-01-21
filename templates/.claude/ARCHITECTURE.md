# Architecture Guide

This document covers the architectural patterns, module structure, and key infrastructure components of this NestJS GraphQL boilerplate.

---

## Table of Contents

1. [Module Structure](#module-structure)
2. [Domain Module Structure](#domain-module-structure)
3. [Repository Pattern](#repository-pattern)
4. [Error Handling](#error-handling)
5. [DataLoader Pattern](#dataloader-pattern)
6. [Field Resolvers](#field-resolvers)
7. [Authentication & Authorization](#authentication--authorization)
8. [Background Jobs](#background-jobs)
9. [Distributed Locking](#distributed-locking)
10. [Sentry Integration](#sentry-integration)

---

## Module Structure

```
src/
├── common/                      # Shared infrastructure (global modules)
│   ├── cache/                  # Redis cache + LockService
│   ├── database/               # TypeORM config, migrations, query helpers
│   │   ├── entities/          # BaseUUIDEntity, BaseEntity
│   │   ├── helper/            # Query helpers (pagination, sorting, filtering)
│   │   ├── migrations/        # TypeORM migrations
│   │   └── seeds/             # Database seeders
│   ├── dataloader/             # DataLoader factory for N+1 prevention
│   ├── error/                  # Error handling infrastructure
│   │   ├── exceptions/        # CustomError exception class
│   │   ├── factories/         # ErrorFactory (use this!)
│   │   ├── filters/           # GraphQL error filter + Sentry integration
│   │   └── types/             # ErrorCategory, ErrorSeverity enums
│   ├── logger/                 # Winston configuration + plugins
│   ├── mail/                   # Email templates + BullMQ queue
│   ├── message/                # MessageService (i18n wrapper)
│   ├── queue/                  # BullMQ configuration
│   ├── request/                # Request middleware, decorators, guards
│   └── response/               # Response serialization
├── modules/                     # Business domain modules
│   ├── user/                   # User management (REFERENCE IMPLEMENTATION)
│   ├── role/                   # Role management
│   ├── permission/             # Permission management
│   └── system/                 # System settings/configuration
├── auth/                        # Authentication module
│   ├── decorators/             # @Auth() decorator
│   ├── guards/                 # AuthJwtAccessGuard, AuthScopeGuard, etc.
│   ├── strategies/             # Passport strategies
│   ├── services/               # AuthService, AuthEmailTokenService
│   └── repository/             # Token + EmailToken entities/repositories
├── resolver/                    # GraphQL resolver registration module
├── configs/                     # Configuration files
├── loaders/                     # Express loaders (validation, cors, helmet)
└── instrument.ts                # Sentry initialization
```

---

## Domain Module Structure

Every business domain module follows this exact structure:

```
modules/<name>/
├── repository/
│   ├── entities/<name>.entity.ts       # TypeORM + GraphQL entity
│   ├── repositories/<name>.repository.ts  # Custom repository
│   └── <name>.repository.module.ts     # Repository module
├── services/<name>.service.ts          # Business logic
├── resolvers/<name>.resolver.ts        # GraphQL resolver
├── dtos/
│   ├── create-<name>.dto.ts           # Create input
│   ├── update-<name>.dto.ts           # Update input
│   └── filter-<name>.dto.ts           # Filter/pagination input
├── types/<name>.type.ts               # PaginatedResponse type
└── <name>.module.ts                   # Module definition
```

---

## Repository Pattern

All data access goes through custom repositories that extend TypeORM's `Repository`:

```typescript
@Injectable()
export class UserRepository extends Repository<User> {
  constructor(dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async getList(params: FilterDto): Promise<[User[], number]> {
    const query = this.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');

    applyQueryPaging(params, query);
    applyQuerySorting(params.sorting, query, 'user');

    return query.getManyAndCount();
  }
}
```

### Query Helpers

Located in `src/common/database/helper/query.helper.ts`:

| Helper | Purpose |
|--------|---------|
| `applyQueryPaging(params, query)` | Pagination with limit/offset |
| `applyQuerySorting(sorting, query, alias)` | Sorting by field |
| `applyQueryPeriod(params, query, config)` | Date range filters |
| `applyQueryMonthRange(params, query, config)` | Month-based date ranges |
| `extractSorting(value)` | Parse sorting strings |

---

## Error Handling

This error model is designed for GraphQL APIs with the following principles:
- **GraphQL-first**: Uses GraphQL error extensions, not HTTP status codes
- **Sentry-ready**: Structured metadata for excellent observability
- **Low noise**: Filters expected errors from monitoring
- **Type-safe**: Full TypeScript support

### Error Categories

```typescript
enum ErrorCategory {
  VALIDATION       // User input errors (400-level)
  BUSINESS         // Business rule violations
  AUTHENTICATION   // Auth required
  AUTHORIZATION    // Access denied
  NOT_FOUND        // Resource not found
  RATE_LIMIT       // Too many requests
  EXTERNAL_SERVICE // Third-party API failures
  INFRASTRUCTURE   // Database, cache, etc.
  INTERNAL         // Unexpected errors
}
```

### Error Severity

```typescript
enum ErrorSeverity {
  LOW      // Expected errors - no alert
  MEDIUM   // Degraded service - monitor
  HIGH     // System issues - alert
  CRITICAL // Production-breaking - page
}
```

### ErrorFactory Usage

**CRITICAL: Always use `ErrorFactory`** - never throw raw errors:

```typescript
// CORRECT
throw ErrorFactory.notFound('User', userId);
throw ErrorFactory.business('INSUFFICIENT_BALANCE', 'Insufficient balance');
throw ErrorFactory.forbidden('Access denied to this resource');
throw ErrorFactory.duplicate('User', 'email', email);
throw ErrorFactory.externalService('Email', error, { provider: 'SendGrid' });
throw ErrorFactory.infrastructure('Database connection failed', 'DATABASE_ERROR', error);

// WRONG - DO NOT DO THIS
throw new Error('User not found');
throw new NotFoundException();
throw new HttpException('Error', 400);
```

### Best Practices

```typescript
// Include contextual metadata
throw ErrorFactory.business(
  'INSUFFICIENT_BALANCE',
  'Insufficient balance for transaction',
  { required: 100.00, available: 50.00, userId: user.id }
);

// Don't expose sensitive data
// WRONG
throw new CustomError({ message: `Query failed: SELECT * FROM users WHERE password='${pwd}'` });
// CORRECT
throw ErrorFactory.infrastructure('Database query failed', 'DATABASE_ERROR');
```

### What Gets Sent to Sentry?

**SENT** (MEDIUM+ Severity):
- `AUTHENTICATION`, `AUTHORIZATION` errors
- `RATE_LIMIT`, `EXTERNAL_SERVICE` errors
- `INFRASTRUCTURE`, `INTERNAL` errors

**NOT SENT** (LOW Severity):
- `VALIDATION` errors (user input)
- `BUSINESS` errors (expected)
- `NOT_FOUND` errors (expected 404s)

---

## DataLoader Pattern

DataLoader prevents N+1 query problems in GraphQL field resolvers.

### The N+1 Problem

Without DataLoader, querying multiple roles with permissions:

```graphql
query { allRoles { id, name, permissions { module } } }
```

- **Without DataLoader**: 1 query for roles + N queries for permissions = **11 queries** (if 10 roles)
- **With DataLoader**: 1 query for roles + 1 batched query = **2 queries**

### Architecture

**DataLoaderFactory** (`src/common/dataloader/dataloader.factory.ts`):

```typescript
export interface DataLoaders {
  rolePermissions: DataLoader<number, PermissionGroup[]>;
  roles: DataLoader<number, Role>;
  // Add new loaders here
}

@Injectable()
export class DataLoaderFactory {
  constructor(private readonly roleService: RoleService) {}

  createLoaders(): DataLoaders {
    return {
      rolePermissions: this.createRolePermissionsLoader(),
      roles: this.createRolesLoader(),
    };
  }

  private createRolePermissionsLoader(): DataLoader<number, PermissionGroup[]> {
    return new DataLoader<number, PermissionGroup[]>(
      async (roleIds: readonly number[]) => {
        const permissionsByRole = await this.roleService.getRolePermissionsBatch(Array.from(roleIds));
        return roleIds.map((roleId) => permissionsByRole.get(roleId) || []);
      },
      { cache: true, batch: true },
    );
  }
}
```

### Adding New DataLoaders

1. Add type to `DataLoaders` interface
2. Inject required service/repository in constructor
3. Create loader method
4. Add to `createLoaders()` return object
5. Update `DataLoaderModule` imports if needed
6. Use in field resolver via context

### How Batching Works

```
1. GraphQL Request Received
2. Create DataLoader Instances (per request)
3. Execute Parent Query (fetch all roles)
4. Field Resolvers Called:
   - Role 1: loader.load(1) → queued
   - Role 2: loader.load(2) → queued
   - Role 3: loader.load(3) → queued
5. Batch Execution (next tick):
   - Collects all IDs: [1, 2, 3]
   - Single database query
6. Results Distribution
```

---

## Field Resolvers

Field resolvers dynamically fetch related data when a GraphQL field is requested.

### Implementation Pattern

```typescript
import { DataLoaders } from '@common/dataloader';

@Resolver(() => Role)
export class RoleResolver {
  @ResolveField(() => [PermissionGroup], {
    description: 'Get permissions grouped by module for this role',
  })
  async permissions(
    @Parent() role: Role,
    @Context() ctx: { loaders: DataLoaders },
  ): Promise<PermissionGroup[]> {
    return ctx.loaders.rolePermissions.load(role.id);
  }
}
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `@ResolveField()` | Marks method as a field resolver |
| `@Parent()` | Access to the parent entity |
| `@Context()` | Access to GraphQL context with DataLoaders |
| `DataLoaders` | Typed interface for all available loaders |

### Best Practices

1. **Always use DataLoader** for related entity lookups
2. **Access loaders via context** - Not direct service injection
3. **Keep resolvers thin** - Business logic in services
4. **Use descriptive descriptions** - Helps with API documentation
5. **Handle null cases** - Return empty arrays or null appropriately

---

## Authentication & Authorization

**JWT with dual tokens** (access + refresh) stored in `Token` entity:
- Access token: short-lived (15min default)
- Refresh token: long-lived (7 days default)

### @Auth() Decorator

From `src/auth/decorators/auth.jwt.decorator.ts`:

```typescript
// Basic authentication
@Auth()
@Query(() => User)
async me(@Context() ctx) { ... }

// With permission check
@Auth({ permissions: 'user_manage_read' })
@Query(() => [User])
async users() { ... }

// Multiple permissions
@Auth({ permissions: ['user_manage_read', 'user_manage_create'] })
@Mutation(() => User)
async createUser() { ... }
```

### @OwnershipCheck() Decorator

For IDOR prevention:

```typescript
@Mutation(() => Boolean)
@Auth({ permissions: 'user_manage_update' })
@OwnershipCheck({
  idArg: 'input.id',
  adminPermissions: ['user_manage_update'],
})
async updateUser(@Args('input') input: UpdateUserInput) { ... }
```

### Strategies

Located in `src/auth/strategies/`:
- `JwtAccessStrategy` - Validates JWT access tokens
- `JwtRefreshStrategy` - Validates JWT refresh tokens
- `LocalStrategy` - Username/password validation

---

## Background Jobs

Queue processing using BullMQ with Redis backend:

```typescript
// Producer (add job to queue)
@InjectQueue('mailSender')
private readonly mailQueue: Queue;

await this.mailQueue.add('sendVerification', { email, token });

// Consumer (process jobs)
// Defined in src/common/mail/queues/ or src/common/jobs/
```

Queue configuration in `src/common/queue/queue.module.ts`.

---

## Distributed Locking

`LockService` provides Redis-based distributed locks:

```typescript
await this.lockService.synchronize('resource-key', async () => {
  // Critical section - only one process executes at a time
  return await this.performCriticalOperation();
});
```

Lock automatically released after task completion or 5 minute timeout.

---

## Sentry Integration

### Configuration

Sentry is configured in `src/instrument.ts` with:
- Performance monitoring (tracing)
- Profiling
- Smart error filtering (`beforeSend` hook)
- Environment-based sampling rates

### Environment Setup

```env
SENTRY_DSN=https://your-sentry-dsn@o123456.ingest.sentry.io/123456
```

### Tags for Filtering

Filter by:
- `error.category`: VALIDATION, BUSINESS, AUTH, etc.
- `error.code`: Specific error codes
- `error.severity`: LOW, MEDIUM, HIGH, CRITICAL
- `graphql.operation`: GraphQL operation name

### Sampling Configuration

**Production:** Traces: 10%, Profiles: 10%
**Development:** Traces: 100%, Profiles: 100%

### Sensitive Data Protection

Already sanitized:
- **Variables**: password, token, secret, apiKey, accessToken, refreshToken
- **Headers**: authorization, cookie, x-api-key, x-auth-token

---

## Paginated Response Pattern

### Factory Function

Located in `src/common/response/types/paginated-response.type.ts`:

```typescript
export function PaginatedResponse<T>(
  classRef: Type<T>,
  typeName: string,
): Type<IPaginatedResponse<T>>
```

### Usage

```typescript
// types/role.type.ts
import { PaginatedResponse } from '@common/response/types/paginated-response.type';
import { Role } from '../repository/entities/role.entity';

export const PaginatedRoleResponse = PaginatedResponse(Role, 'Role');

// resolver
@Query(() => PaginatedRoleResponse, { description: 'Get paginated roles' })
async roles(@Args('params') params: FilterRoleInput): Promise<IPaginatedResponse<Role>> {
  return await this.service.getList(params);
}
```

### Generated GraphQL Schema

```graphql
type PaginatedRoleResponse {
  totalRecords: Int!
  limit: Int!
  page: Int!
  totalPages: Int!
  data: [Role!]!
}
```

---

## Related Documentation

- [CONVENTIONS.md](./CONVENTIONS.md) - Code generation rules and patterns
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow and commands
- [TESTING.md](./TESTING.md) - Testing patterns and best practices
