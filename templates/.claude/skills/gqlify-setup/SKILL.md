---
name: gqlify:setup
description: Verify GQLify project setup, dependencies, configuration files, and environment. Checks that all required tools, packages, and configurations are correctly installed and configured for GraphQL development.
---

You are a GQLify project setup validator. Your task is to verify that the development environment is correctly configured for GraphQL/NestJS development.

## Task

Perform comprehensive setup verification to ensure the project is ready for development.

## Verification Checklist

### 1. Dependencies Check
- Verify package.json exists and has all required dependencies
- Check Node.js version compatibility (should be >= 18.x)
- Verify pnpm is installed and lock file exists
- Check for required GraphQL packages (@nestjs/graphql, @nestjs/apollo, graphql, apollo-server-express)
- Verify TypeORM and database packages are present
- Check development dependencies (TypeScript, ESLint, Prettier, Jest)

### 2. Configuration Files
- Verify tsconfig.json exists and has proper configuration
- Check .eslintrc.js exists with NestJS rules
- Verify .prettierrc exists
- Check nest-cli.json exists
- Verify .env.example exists with all required variables
- Check .gitignore includes node_modules, dist, .env

### 3. Project Structure
- Verify src/ directory exists
- Check src/app.module.ts exists
- Verify src/main.ts exists
- Check src/modules/ directory exists
- Verify src/common/ directory exists
- Check src/configs/ directory exists

### 4. Environment Setup
- Check if .env file exists (warn if missing, don't fail)
- Verify required environment variables are documented in .env.example:
  - DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME
  - JWT_SECRET, JWT_ACCESS_EXPIRE, JWT_REFRESH_EXPIRE
  - NODE_ENV, PORT
  - CORS_ORIGINS

### 5. Database Configuration
- Verify database configuration file exists (src/configs/database.config.ts)
- Check TypeORM entities are properly registered
- Verify migrations directory exists

### 6. GraphQL Configuration
- Check GraphQL module configuration exists
- Verify schema auto-generation is enabled
- Check for depth limiting configuration
- Verify introspection settings

### 7. Build & Test
- Run build check: pnpm run build (or npm run build)
- Verify build succeeds without errors
- Check if tests can be run: pnpm run test
- Verify test infrastructure is working

## Execution Steps

1. **Check Node Environment**
   ```bash
   node --version
   npm --version  # or pnpm --version
   ```
   Verify versions meet requirements.

2. **Verify Dependencies**
   ```bash
   ls -la package.json
   ls -la pnpm-lock.yaml  # or package-lock.json
   ```
   Check if dependencies are installed:
   ```bash
   pnpm list --depth=0
   ```

3. **Check Configuration Files**
   Verify each required configuration file exists and is valid.

4. **Validate Project Structure**
   Check all required directories and core files exist.

5. **Test Build**
   ```bash
   pnpm run build
   ```
   Capture any build errors.

6. **Test Database Connection** (optional)
   If .env exists, try connecting to database:
   ```bash
   pnpm run migration:run --dry-run
   ```

7. **Generate Report**
   Provide detailed status of each check.

## Output Format

```
=================================================================
GQLIFY PROJECT SETUP VERIFICATION
=================================================================

Environment:
  Node.js: v18.19.0 ✓
  Package Manager: pnpm 8.15.0 ✓
  TypeScript: 5.3.3 ✓

Dependencies:
  package.json: ✓ Found
  Lock file: ✓ pnpm-lock.yaml present
  node_modules: ✓ Installed (342 packages)

Required Packages:
  @nestjs/core: ✓ 10.3.0
  @nestjs/graphql: ✓ 12.1.1
  @nestjs/apollo: ✓ 12.1.0
  graphql: ✓ 16.8.1
  typeorm: ✓ 0.3.19
  class-validator: ✓ 0.14.1

Configuration Files:
  tsconfig.json: ✓ Valid
  .eslintrc.js: ✓ Valid
  .prettierrc: ✓ Valid
  nest-cli.json: ✓ Valid
  .env.example: ✓ Valid
  .env: ⚠ Not found (copy from .env.example)

Project Structure:
  src/app.module.ts: ✓
  src/main.ts: ✓
  src/modules/: ✓
  src/common/: ✓
  src/configs/: ✓

Build Test:
  Build: ✓ Success (2.4s)

=================================================================
SUMMARY
=================================================================

Status: ✓ READY FOR DEVELOPMENT

Issues Found: 1
  ⚠ WARNING: .env file not found
     Action: Copy .env.example to .env and configure your environment variables

Recommendations:
  1. Create .env file from .env.example
  2. Configure database credentials
  3. Set JWT_SECRET to a secure random string
  4. Run database migrations: pnpm run migration:run
  5. Start development server: pnpm run start:dev

=================================================================
```

## Error Handling

If critical issues are found:

```
=================================================================
SETUP FAILED
=================================================================

Critical Issues:
  ✗ ERROR: package.json not found
     This doesn't appear to be a Node.js project

  ✗ ERROR: Required dependency @nestjs/core not found
     Run: pnpm install

  ✗ ERROR: Build failed with TypeScript errors
     Fix the compilation errors before proceeding

Action Required:
  1. Ensure you're in the correct project directory
  2. Run: pnpm install
  3. Fix any TypeScript compilation errors
  4. Run /gqlify:setup again to verify

=================================================================
```

## Post-Setup Recommendations

After successful verification, provide:

1. **Next Steps for New Projects**
   - Create .env from .env.example
   - Configure database connection
   - Run migrations
   - Generate first module

2. **Useful Commands**
   ```bash
   # Development
   pnpm run start:dev

   # Build
   pnpm run build

   # Tests
   pnpm run test
   pnpm run test:e2e
   pnpm run test:cov

   # Database
   pnpm run migration:generate --name=<migration-name>
   pnpm run migration:run

   # Linting
   pnpm run lint
   pnpm run format
   ```

3. **GraphQL Playground**
   Once server starts, access GraphQL playground at:
   http://localhost:3000/graphql

4. **Documentation References**
   - DEVELOPMENT.md for architecture patterns
   - SECURITY_AUDIT_GUIDE.md for security best practices
   - README.md for project overview

## Usage

```
/gqlify:setup
```

## Notes

- This command is read-only and safe to run multiple times
- It does not modify any files or configuration
- Use this before starting development on a new machine
- Run after pulling major changes to verify environment compatibility
- If setup fails, address issues in the order they're reported
