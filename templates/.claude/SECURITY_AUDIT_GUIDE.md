# Security Audit Guide for NestJS GraphQL Applications

This guide provides a comprehensive checklist and methodology for conducting security audits on NestJS GraphQL applications.

---

## Table of Contents

1. [Audit Methodology](#audit-methodology)
2. [Severity Definitions](#severity-definitions)
3. [Security Checklist](#security-checklist)
4. [Authentication Checklist](#authentication-checklist)
5. [Data Protection Checklist](#data-protection-checklist)
6. [Performance & DoS Checklist](#performance--dos-checklist)
7. [Dependency Checklist](#dependency-checklist)
8. [Common Vulnerabilities & Remediations](#common-vulnerabilities--remediations)
9. [Tools & Commands](#tools--commands)
10. [Audit Report Template](#audit-report-template)

---

## Audit Methodology

### Phase 1: Preparation
1. Identify scope (files, modules, infrastructure)
2. Gather documentation (API specs, architecture diagrams)
3. Set up audit environment
4. Define severity criteria

### Phase 2: Static Analysis
1. Review configuration files
2. Analyze authentication/authorization logic
3. Check data protection measures
4. Review error handling
5. Analyze dependency security

### Phase 3: Dynamic Analysis (Optional)
1. Runtime penetration testing
2. Load testing for DoS vulnerabilities
3. API fuzzing

### Phase 4: Reporting
1. Document findings with severity
2. Provide remediation code
3. Prioritize recommendations
4. Schedule follow-up audit

---

## Severity Definitions

| Severity | Icon | Description | SLA |
|----------|------|-------------|-----|
| CRITICAL | :red_circle: | Immediate exploitation risk, data breach potential | Immediate fix |
| HIGH | :orange_circle: | Significant security risk | Fix within 24-48 hours |
| MEDIUM | :yellow_circle: | Moderate risk | Fix within 1-2 weeks |
| LOW | :green_circle: | Minor issue, best practice | Fix when convenient |
| INFO | :blue_circle: | Informational, no action needed | Consider for future |

---

## Security Checklist

### GraphQL Configuration

- [ ] **Query Depth Limiting** - Prevent deeply nested queries
  ```typescript
  // app.module.ts
  import depthLimit from 'graphql-depth-limit';

  GraphQLModule.forRoot({
    validationRules: [depthLimit(10)], // Max depth of 10
  });
  ```

- [ ] **Query Complexity Limiting** - Prevent expensive queries
  ```typescript
  // Install: graphql-query-complexity
  import { createComplexityLimitRule } from 'graphql-validation-complexity';

  validationRules: [createComplexityLimitRule(1000)];
  ```

- [ ] **Introspection Disabled in Production**
  ```typescript
  introspection: process.env.NODE_ENV !== 'production',
  ```

- [ ] **Playground/Sandbox Disabled in Production**
  ```typescript
  playground: process.env.NODE_ENV !== 'production',
  ```

### CORS Configuration

- [ ] **Explicit Origin Whitelist** - No wildcard in production
  ```typescript
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || [],
    credentials: true,
  }
  ```

- [ ] **Credentials with Specific Origins** - Never use `*` with credentials

### Access Control

- [ ] **All Mutations Protected** - `@Auth()` decorator on sensitive operations
- [ ] **Ownership Verification** - IDOR prevention
  ```typescript
  @OwnershipCheck({ idPath: 'input.id', allowAdmin: true })
  @Mutation(() => Boolean)
  async updateUser(@Args('input') input: UpdateUserInput) {}
  ```

- [ ] **Field-Level Authorization** - `@Auth()` on sensitive field resolvers
- [ ] **Permission Checks** - Role-based access control
  ```typescript
  @Auth({ permissions: 'user_manage_update' })
  ```

### Input Validation

- [ ] **DTO Validation** - class-validator decorators on all inputs
- [ ] **Sanitization** - XSS prevention on user-generated content
- [ ] **File Upload Limits** - Size and type restrictions

### SQL/NoSQL Injection

- [ ] **Parameterized Queries** - No string interpolation in queries
- [ ] **TypeORM Native Methods** - Avoid raw SQL when possible
  ```typescript
  // BAD - String interpolation
  .where(`p.id IN(${subQuery.getQuery()})`)

  // GOOD - Use TypeORM subquery
  .where((qb) => {
    const subQuery = qb.subQuery()...
    return `p.id IN ${subQuery.getQuery()}`;
  })
  ```

---

## Authentication Checklist

### Password Security

- [ ] **Strong Hashing Algorithm** - bcrypt with 10+ rounds
  ```typescript
  const SALT_ROUNDS = 12;
  await bcrypt.hash(password, SALT_ROUNDS);
  ```

- [ ] **Password Field Exclusion** - `select: false` in entity
  ```typescript
  @Column({ select: false })
  password: string;
  ```

- [ ] **No Hardcoded Credentials** - Require environment variables
  ```typescript
  // BAD
  defaultPassword: process.env.DEFAULT_PASS || 'Qw3rty!@#',

  // GOOD
  defaultPassword: process.env.DEFAULT_PASS!, // Throws if missing
  ```

### Token Security

- [ ] **Short Access Token Lifetime** - 15 minutes recommended
- [ ] **Longer Refresh Token Lifetime** - 7 days typical
- [ ] **Token Revocation** - Database-backed token storage
- [ ] **Expiration Validation** - Don't ignore expiration
  ```typescript
  // BAD
  jwtService.verifyAsync(token, { ignoreExpiration: true });

  // GOOD
  jwtService.verifyAsync(token, { ignoreExpiration: false });
  ```

### Rate Limiting

- [ ] **Global Rate Limits** - Throttler module configured
- [ ] **Stricter Auth Limits** - Specific limits on sensitive endpoints
  ```typescript
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 per 15 min
  @Mutation(() => AuthTokenOutput)
  async login() {}
  ```

- [ ] **Account Lockout** - Temporary lock after failed attempts

### Information Disclosure

- [ ] **No Email Enumeration** - Same response for existing/non-existing
  ```typescript
  // Always return success for password reset
  async forgotPassword(email: string) {
    const user = await this.findByEmail(email);
    if (user) {
      await this.sendResetEmail(user);
    }
    return { success: true }; // Same response regardless
  }
  ```

---

## Data Protection Checklist

### PII Inventory

Create a table of all PII fields:

| Entity | Field | PII Type | Encrypted | Masked in Logs |
|--------|-------|----------|-----------|----------------|
| User | email | Email | No | Partial |
| User | password | Credential | Yes (bcrypt) | Yes |
| Token | accessToken | Auth | No | Yes |

### Logging Security

- [ ] **No PII in Logs** - Redact sensitive fields
  ```typescript
  const redactedFields = ['email', 'password', 'token', 'phone'];
  ```

- [ ] **Winston Redactor** - Custom format for PII masking
  ```typescript
  format: winston.format.combine(
    piiRedactor(),
    winston.format.json(),
  )
  ```

- [ ] **Log Retention Policy** - GDPR compliance

### Third-Party Services

- [ ] **Minimal PII to Sentry** - Only send userId
  ```typescript
  scope.setUser({ id: user.id }); // NOT email/username
  ```

- [ ] **Variable Sanitization** - Redact tokens before sending
  ```typescript
  const denyList = ['accessToken', 'refreshToken', 'password'];
  ```

### Database Security

- [ ] **Soft Deletes** - Data retention for compliance
- [ ] **Encryption at Rest** - Database-level encryption
- [ ] **Encryption in Transit** - SSL connections

---

## Performance & DoS Checklist

### Query Protection

- [ ] **Depth Limiting** - Prevent nested query attacks
- [ ] **Complexity Limiting** - Prevent expensive operations
- [ ] **Timeout Configuration** - Request timeout limits

### Concurrency

- [ ] **Atomic Distributed Locks** - Redis SET NX pattern
  ```typescript
  // Atomic lock acquisition
  const acquired = await redis.set(
    lockKey,
    lockValue,
    'NX',
    'PX',
    ttlMs,
  );
  ```

- [ ] **Lua Scripts for Release** - Atomic compare-and-delete
  ```lua
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
  ```

### Database Performance

- [ ] **Indexes on Queried Columns**
  - Primary keys
  - Foreign keys
  - Status/filter columns
  - created_at (for sorting)

- [ ] **Connection Pool Sizing**
  ```typescript
  extra: {
    max: 20,
    min: 5,
  }
  ```

### Caching

- [ ] **Entity-Level Caching** - Redis for frequently accessed data
- [ ] **DataLoader Pattern** - N+1 query prevention
  ```typescript
  @ResolveField()
  async role(@Parent() user, @Context() ctx) {
    return ctx.loaders.roles.load(user.roleId);
  }
  ```

### Background Jobs

- [ ] **Retry Strategy** - Exponential backoff
  ```typescript
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 1000,
  }
  ```

---

## Dependency Checklist

### Vulnerability Scanning

```bash
# Check for known vulnerabilities
pnpm audit

# Check for outdated packages
pnpm outdated

# Update dependencies
pnpm update
```

### Regular Maintenance

- [ ] **Weekly**: Run `pnpm audit`
- [ ] **Monthly**: Check `pnpm outdated`
- [ ] **Quarterly**: Major version updates evaluation

### Lock Files

- [ ] **Committed Lock File** - pnpm-lock.yaml in version control
- [ ] **CI Integrity Check** - Verify lock file in CI

---

## Common Vulnerabilities & Remediations

### 1. GraphQL Denial of Service

**Vulnerability**: Unbounded query depth/complexity

**Remediation**:
```typescript
import depthLimit from 'graphql-depth-limit';
import { createComplexityLimitRule } from 'graphql-validation-complexity';

GraphQLModule.forRoot({
  validationRules: [
    depthLimit(configService.get('graphql.maxDepth', 10)),
    createComplexityLimitRule(1000),
  ],
});
```

### 2. IDOR (Insecure Direct Object Reference)

**Vulnerability**: Users can access/modify other users' resources

**Remediation**:
```typescript
// Create ownership guard
@Injectable()
export class OwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = getUser(context);
    const resourceId = getResourceId(context);
    return user.id === resourceId || user.role === 'admin';
  }
}
```

### 3. Race Condition in Distributed Locks

**Vulnerability**: Non-atomic check-then-set pattern

**Remediation**:
```typescript
// Use atomic SET NX
async acquireLock(key: string, ttl: number): Promise<boolean> {
  const lockValue = uuidv4();
  const result = await this.redis.set(key, lockValue, 'NX', 'PX', ttl);
  return result === 'OK';
}
```

### 4. Email Enumeration

**Vulnerability**: Different responses reveal if email exists

**Remediation**:
```typescript
async forgotPassword(email: string): Promise<SuccessResponse> {
  const user = await this.findByEmail(email);
  if (user) {
    await this.sendResetEmail(user);
  }
  // Always return same response
  return { success: true, message: 'If email exists, reset link sent' };
}
```

### 5. PII Leakage in Logs/Monitoring

**Vulnerability**: Sensitive data in logs or third-party services

**Remediation**:
```typescript
// Sentry - Only send user ID
scope.setUser({ id: user.id });

// Winston - Redact PII
const piiRedactor = winston.format((info) => {
  const sensitiveFields = ['email', 'password', 'token'];
  for (const field of sensitiveFields) {
    if (info[field]) info[field] = '[REDACTED]';
  }
  return info;
});
```

---

## Tools & Commands

### Security Scanning

```bash
# Dependency vulnerabilities
pnpm audit
pnpm audit --fix

# Outdated packages
pnpm outdated

# License check (optional)
npx license-checker --summary
```

### Static Analysis

```bash
# ESLint security rules
pnpm add -D eslint-plugin-security
```

```javascript
// eslint.config.js
import security from 'eslint-plugin-security';

export default [
  security.configs.recommended,
];
```

### GraphQL Security Testing

```bash
# Install InQL for Burp Suite or use graphql-cop
npx graphql-cop -t http://localhost:3000/graphql
```

---

## Audit Report Template

### Executive Summary
- Total findings by severity
- Critical issues requiring immediate attention
- Overall security posture assessment

### Findings Summary Table

| Category | Critical | High | Medium | Low | Info |
|----------|----------|------|--------|-----|------|
| Security | 0 | 0 | 0 | 0 | 0 |
| Authentication | 0 | 0 | 0 | 0 | 0 |
| Data Protection | 0 | 0 | 0 | 0 | 0 |
| Performance | 0 | 0 | 0 | 0 | 0 |
| Dependencies | 0 | 0 | 0 | 0 | 0 |

### Finding Template

```markdown
### [CATEGORY-###] Finding Title
- **Severity**: :orange_circle: HIGH
- **Category**: Category Name
- **Location**: `src/path/to/file.ts:line`
- **Description**: What the issue is
- **Impact**: What could happen if exploited
- **Evidence**:
```typescript
// Code showing the issue
```
- **Recommendation**: How to fix it
- **Remediation Code**:
```typescript
// Fixed code
```
```

### Priority Matrix

| Priority | Finding | Action | SLA |
|----------|---------|--------|-----|
| 1 | FINDING-ID | Action item | Immediate |
| 2 | FINDING-ID | Action item | 24-48 hours |

### Security Strengths

List positive security practices found.

### Appendix

- Files reviewed
- Tools used
- Out of scope items

---

## Audit Schedule

| Frequency | Scope |
|-----------|-------|
| Weekly | Dependency vulnerability scan |
| Monthly | Code changes since last audit |
| Quarterly | Full security audit |
| Annually | External penetration test |

---

## Quick Checklist Summary

### Before Every Release

- [ ] `pnpm audit` - No high/critical vulnerabilities
- [ ] `pnpm outdated` - No security-related outdated packages
- [ ] GraphQL introspection disabled in production
- [ ] All sensitive endpoints rate-limited
- [ ] All mutations have proper authorization
- [ ] No hardcoded credentials
- [ ] Error messages don't leak sensitive info

### Quarterly Review

- [ ] PII inventory up to date
- [ ] Log retention policy enforced
- [ ] Token lifetimes appropriate
- [ ] Database indexes optimized
- [ ] Caching strategy reviewed
- [ ] Third-party integrations audited
