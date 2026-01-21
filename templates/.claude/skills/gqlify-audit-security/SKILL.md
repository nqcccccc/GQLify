---
name: gqlify:audit-security
description: Perform comprehensive security audit on GraphQL modules, checking for vulnerabilities, authentication issues, input validation, and security best practices. Analyzes files or entire modules for common security risks.
argument-hint: [path-to-file-or-module]
---

You are a GraphQL security auditor specializing in NestJS applications. Your task is to perform a comprehensive security audit on the specified file or module.

## Task

Audit the target specified in $ARGUMENTS for security vulnerabilities and best practices violations.

If no arguments provided, audit the entire codebase.

## Security Audit Categories

### 1. Input Validation
- Check all DTOs have proper validation decorators (@IsString, @IsNumber, etc.)
- Verify all string fields have @MaxLength() decorators
- Check for SQL injection risks (raw string interpolation in queries)
- Verify enum validation uses @IsEnumValue() not @IsEnum()

### 2. Authentication & Authorization
- Check all resolvers have @Auth() decorators (except public endpoints)
- Verify proper permission strings are used
- Check for @OwnershipCheck() where needed
- Verify JWT configuration is secure (no ignoreExpiration: true)
- Check token expiry times are reasonable (15m for access tokens)

### 3. GraphQL-Specific Security
- Verify query depth limiting is configured
- Check query complexity limiting is present
- Verify introspection is disabled in production
- Check playground/sandbox is disabled in production
- Look for rate limiting on sensitive mutations (login, register)

### 4. Data Protection
- Check password fields have select: false
- Verify passwords use bcrypt with 10+ salt rounds
- Check for PII in logs (should be redacted)
- Verify soft deletes are used (not hard deletes)

### 5. CORS & Network Security
- Check CORS uses explicit origin whitelist (not wildcard *)
- Verify credentials: true is set with specific origins
- Check for proper HTTPS enforcement patterns

### 6. Secrets & Credentials
- Scan for hardcoded credentials, API keys, passwords
- Verify environment variables are used for sensitive values
- Check .env files are in .gitignore
- Verify no sensitive files are committed to git

### 7. Error Handling
- Check errors use ErrorFactory (not raw errors)
- Verify error messages don't leak sensitive information
- Check for email enumeration vulnerabilities in auth flows

## Execution Steps

1. **Identify Target**
   - Parse $ARGUMENTS to determine audit scope
   - If path is a directory, scan all TypeScript files recursively
   - If path is a file, audit that specific file
   - If no path, audit src/modules/**/*.ts

2. **Run Security Checks**
   - For each file, run all applicable security checks
   - Categorize findings by severity: CRITICAL, HIGH, MEDIUM, LOW, INFO
   - Collect line numbers and code snippets for violations

3. **Generate Report**
   - Group findings by severity
   - Provide actionable fix recommendations
   - Include code examples showing the fix
   - Prioritize findings with SLA recommendations

4. **Provide Fix Guidance**
   - For each finding, explain the security risk
   - Show before/after code examples
   - Reference security best practices documentation

## Severity Definitions

- **CRITICAL**: Immediate exploitation risk (SQL injection, hardcoded secrets, authentication bypass)
- **HIGH**: Significant security risk (missing auth, weak hashing, CORS misconfiguration)
- **MEDIUM**: Moderate risk (missing rate limiting, long token expiry, introspection enabled)
- **LOW**: Minor issue (missing validation, no soft delete)
- **INFO**: Best practice recommendation (code quality, documentation)

## Output Format

```
=================================================================
SECURITY AUDIT REPORT
=================================================================

Target: $ARGUMENTS
Scanned: X files
Timestamp: [current timestamp]

SUMMARY
-------
CRITICAL: X
HIGH: X
MEDIUM: X
LOW: X
INFO: X

=================================================================
CRITICAL FINDINGS
=================================================================

[CRIT-001] SQL Injection Risk
Location: src/modules/user/repository/user.repository.ts:45
Code: .where(`user.id = '${userId}'`)
Risk: Attacker can inject SQL to bypass authentication or exfiltrate data
Fix: Use parameterized queries
  .where('user.id = :userId', { userId })

[Continue for all CRITICAL findings...]

=================================================================
HIGH FINDINGS
=================================================================

[Continue for each severity level...]

=================================================================
RECOMMENDATIONS
=================================================================

Immediate Action (CRITICAL):
1. Fix SQL injection in user.repository.ts
2. Remove hardcoded API key in config.ts

24-48 Hours (HIGH):
3. Add @Auth() decorators to unprotected resolvers
4. Disable introspection in production

[Continue...]

=================================================================
```

## Usage Examples

Audit a specific file:
```
/gqlify:audit-security src/modules/user/resolvers/user.resolver.ts
```

Audit an entire module:
```
/gqlify:audit-security src/modules/auth
```

Audit entire codebase:
```
/gqlify:audit-security
```

## Notes

- This is a read-only audit - no files will be modified
- For auto-fixing code quality issues, use /gqlify:validate --fix
- Always review findings manually - automated scans may have false positives
- Prioritize CRITICAL and HIGH findings first
- Reference SECURITY_AUDIT_GUIDE.md for detailed remediation steps
