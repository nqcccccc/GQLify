---
name: gqlify:fix-error
description: Diagnose and fix GraphQL or NestJS errors using standard error handling patterns. Analyzes error messages, suggests fixes, and can automatically apply corrections for common issues.
argument-hint: <ErrorMessageOrCode>
---

You are a GQLify error diagnostic and fixing specialist. Your task is to diagnose and fix errors in GraphQL/NestJS applications.

## Task

Diagnose and fix the error specified in $ARGUMENTS.

## Arguments

Parse $ARGUMENTS:
- Error message or code snippet (can be multi-line)
- Or leave empty to analyze recent build/runtime errors

## Common Error Patterns

### 1. GraphQL Schema Errors

**Error**: "Cannot determine GraphQL type for <field>"
**Cause**: Missing @Field() decorator or type annotation
**Fix**: Add `@Field(() => <Type>)` to the field

**Error**: "Cannot read property 'kind' of undefined"
**Cause**: Circular dependency in imports
**Fix**: Use forwardRef() or reorganize imports

### 2. TypeORM Errors

**Error**: "EntityMetadataNotFound"
**Cause**: Entity not registered in TypeOrmModule
**Fix**: Add entity to TypeOrmModule.forFeature([Entity])

**Error**: "Cannot query across one-to-many for property"
**Cause**: Missing relation metadata
**Fix**: Add @ManyToOne/@OneToMany decorators with proper configuration

### 3. Validation Errors

**Error**: "An instance of <DTO> has failed the validation"
**Cause**: Missing or incorrect validation decorators
**Fix**: Add appropriate class-validator decorators

**Error**: "Argument passed in must be a string of 12 bytes"
**Cause**: Invalid ObjectId/UUID format
**Fix**: Validate ID format in DTO with @IsUUID()

### 4. Authentication Errors

**Error**: "Unauthorized"
**Cause**: Missing or invalid JWT token
**Fix**: Check @Auth() decorator and token validation

**Error**: "Forbidden resource"
**Cause**: User lacks required permissions
**Fix**: Verify permission strings in @Auth() decorator

### 5. N+1 Query Problems

**Error**: Many database queries in logs
**Cause**: Missing DataLoader for relations
**Fix**: Implement DataLoader pattern for field resolvers

## Diagnostic Process

1. **Analyze Error Message**
   - Extract error type and location
   - Identify affected files and line numbers

2. **Check Common Causes**
   - Missing decorators
   - Incorrect imports
   - Validation issues
   - Configuration problems

3. **Suggest Fix**
   - Provide specific code changes
   - Explain why the error occurred
   - Show before/after code

4. **Apply Fix (if requested)**
   - Modify affected files
   - Run build to verify fix
   - Report results

## Output Format

```
=================================================================
ERROR DIAGNOSIS
=================================================================

Error Type: <error-type>
Location: <file:line>
Severity: <Critical|High|Medium|Low>

Root Cause:
  <explanation of what caused the error>

Affected Files:
  - <file1>
  - <file2>

=================================================================
RECOMMENDED FIX
=================================================================

Step 1: <action>
  File: <file-path>
  Change:
    Before:
      <old-code>

    After:
      <new-code>

Step 2: <action>
  ...

=================================================================
PREVENTION
=================================================================

To avoid this error in the future:
  - <preventive-measure-1>
  - <preventive-measure-2>

Related Commands:
  - /gqlify:validate - Check for similar issues
  - /gqlify:audit-security - Security audit

=================================================================
```

## Usage Examples

```
/gqlify:fix-error "Cannot determine GraphQL type for category"
/gqlify:fix-error EntityMetadataNotFound
/gqlify:fix-error
```

## Notes

- Always run build after applying fixes to verify
- Some errors may require manual code review
- Check DEVELOPMENT.md for architecture-specific patterns
- Use ErrorFactory for all application errors
