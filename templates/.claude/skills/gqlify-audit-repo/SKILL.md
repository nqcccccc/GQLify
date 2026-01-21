---
name: gqlify:audit-repo
description: Comprehensive repository audit covering security, architecture, performance, dependencies, and best practices. Generates detailed report with severity-based findings, scores, and actionable recommendations. Combines security audit, code validation, and dependency checks.
argument-hint: [--category <name>] [--format <type>] [--export <file>] [--fix] [--quick] [--strict]
---

You are a comprehensive GQLify repository auditor. Your task is to perform a full security, architecture, performance, and quality audit of the entire repository.

## Task

Perform comprehensive repository audit with scoring and prioritized recommendations.

## Arguments

Parse $ARGUMENTS for options:
- `--category <name>`: Run specific category only (security, auth, data, architecture, performance, code, test, docs)
- `--format <type>`: Output format (text, json, markdown) - default: text
- `--export <file>`: Export report to file
- `--fix`: Auto-fix issues where possible (delegates to /gqlify:validate --fix)
- `--quick`: Run essential checks only (skip INFO-level checks)
- `--strict`: Fail if overall score below 80/100

## Audit Categories

This command combines multiple specialized audits:

### 1. Security Audit (25 points)
Delegates to /gqlify:audit-security patterns:
- GraphQL configuration (depth limiting, introspection)
- CORS configuration
- Input validation
- Secrets detection
- SQL injection prevention

### 2. Authentication Audit (15 points)
- Password security (bcrypt with 10+ salt rounds)
- Token security (short expiry, no ignoreExpiration)
- Rate limiting on auth endpoints
- Information disclosure prevention

### 3. Data Protection Audit (10 points)
- PII in logs (redaction)
- Soft deletes
- Password field exclusion (select: false)

### 4. Architecture Audit (20 points)
- Module registration
- File structure compliance
- DataLoader coverage
- Code quality (delegates to /gqlify:validate)

### 5. Performance Audit (15 points)
- N+1 prevention (DataLoader usage)
- Pagination usage
- Database indexes
- Connection pool configuration

### 6. Dependency Audit (10 points)
- Vulnerability scan (pnpm audit)
- Outdated packages (pnpm outdated)
- Lock file committed

### 7. Test Coverage Audit (5 points)
- Service unit tests
- Resolver tests
- Coverage metrics (pnpm run test:cov)

## Severity Definitions

| Severity | Icon | Description | SLA |
|----------|------|-------------|-----|
| CRITICAL | [CRIT] | Immediate exploitation risk | Immediate fix |
| HIGH | [HIGH] | Significant security risk | Fix within 24-48 hours |
| MEDIUM | [MED] | Moderate risk | Fix within 1-2 weeks |
| LOW | [LOW] | Minor issue | Fix when convenient |
| INFO | [INFO] | Informational | Consider for future |

## Scoring Methodology

- Each category starts with 100 points
- CRITICAL findings: -25 points each
- HIGH findings: -15 points each
- MEDIUM findings: -8 points each
- LOW findings: -3 points each
- INFO: No deduction

Final category score: Max(0, 100 - deductions)
Overall score: Weighted average of all categories

## Execution Steps

1. **Initialize**
   - Read DEVELOPMENT.md for architecture patterns
   - Read SECURITY_AUDIT_GUIDE.md for security checks
   - Identify all modules in src/modules/
   - Parse command options

2. **Run Category Audits**
   - For each enabled category (or all if none specified)
   - Run applicable checks from the category
   - Collect findings with severity, location, and fix suggestions
   - Calculate category score

3. **Run External Commands**
   - pnpm audit for vulnerability scan
   - pnpm outdated for package updates
   - pnpm run test:cov for coverage (unless --quick)

4. **Generate Report**
   - Calculate overall score
   - Sort findings by severity
   - Generate prioritized recommendations
   - Format output based on --format option

5. **Export (if requested)**
   - Write report to file if --export specified
   - Return exit code based on --strict

## Output Format

```
=================================================================
REPOSITORY AUDIT REPORT
=================================================================

Generated: 2026-01-21 10:30:00
Repository: GQLify
Branch: main
Commit: abc1234

=================================================================
EXECUTIVE SUMMARY
=================================================================

Overall Health Score: 85/100

Category Scores:
  [✓] Security:           90/100
  [✓] Authentication:     88/100
  [✓] Data Protection:    95/100
  [!] Architecture:       75/100
  [✓] Performance:        92/100
  [✓] Dependencies:       100/100
  [✓] Test Coverage:      70/100

Findings Summary:
  [CRIT] CRITICAL:  0
  [HIGH] HIGH:      2
  [MED]  MEDIUM:    5
  [LOW]  LOW:       8
  [INFO] INFO:      3

=================================================================
DETAILED FINDINGS
=================================================================

## SECURITY (90/100)

[HIGH-001] GraphQL introspection enabled unconditionally
  Location: src/app.module.ts:32
  Code: introspection: true
  Risk: Exposes full schema in production
  Fix: Use process.env.NODE_ENV !== 'production'

[MED-002] Missing query complexity limiting
  Location: src/app.module.ts
  Risk: Vulnerable to complex query DoS
  Fix: Add createComplexityLimitRule(1000) to validationRules

## ARCHITECTURE (75/100)

[HIGH-003] Field resolver not using DataLoader
  Location: src/modules/product/resolvers/product.resolver.ts:45
  Risk: N+1 query problem
  Fix: Use ctx.loaders.categories.load(product.categoryId)

[MED-004] Missing @Field() decorator
  Location: src/modules/order/dtos/create-order.dto.ts:12
  Fix: Add @Field() before @IsString()

=================================================================
RECOMMENDATIONS
=================================================================

Priority 1 - HIGH (Fix within 24-48 hours):
  1. [HIGH-001] Disable introspection in production
  2. [HIGH-003] Implement DataLoader for product.category

Priority 2 - MEDIUM (Fix within 1-2 weeks):
  3. [MED-002] Add query complexity limiting
  4. [MED-004] Add missing @Field() decorators (5 instances)

Priority 3 - LOW (Fix when convenient):
  5. [LOW-010] Add descriptions to GraphQL queries
  6. [LOW-011] Improve test coverage for OrderService

=================================================================
QUICK FIXES
=================================================================

Run these commands to address auto-fixable issues:

  # Fix code quality violations
  /gqlify:validate --fix

  # Update dependencies
  pnpm update

  # Fix security vulnerabilities
  pnpm audit --fix

Remaining: 2 issues require manual fixes

=================================================================
```

## Integration Examples

Pre-release checklist:
```
/gqlify:audit-repo --category security,auth --strict
```

CI/CD pipeline:
```
/gqlify:audit-repo --format json --export audit-results.json --strict
```

Quarterly review:
```
/gqlify:audit-repo --format markdown --export audit-2026-01.md
```

## Usage Examples

Full audit:
```
/gqlify:audit-repo
```

Security only:
```
/gqlify:audit-repo --category security
```

Quick audit (essential checks):
```
/gqlify:audit-repo --quick
```

Export to markdown:
```
/gqlify:audit-repo --format markdown --export audit-report.md
```

Strict mode (fail if score < 80):
```
/gqlify:audit-repo --strict
```

## Exit Codes

- `0`: All checks passed (or score >= 80 in strict mode)
- `1`: Issues found (or score < 80 in strict mode)
- `2`: Audit execution error

## Notes

- This is a read-only audit by default (use --fix for auto-corrections)
- Some checks require running external commands (build, test)
- For detailed code pattern violations, use /gqlify:validate
- For focused security audit, use /gqlify:audit-security
- Reference SECURITY_AUDIT_GUIDE.md for detailed remediation examples
- Always review audit findings manually before acting
- Combine with /gqlify:validate --fix for comprehensive code quality improvements
