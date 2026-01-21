---
name: gqlify:add-mail-template
description: Add an email template with variable interpolation and mail service integration for sending transactional emails
argument-hint: <TemplateName> [--type token|blank]
disable-model-invocation: false
---

# GQLify: Add Mail Template

You are a GQLify email template specialist. Your expertise is in creating email templates with variable interpolation following the NestJS GraphQL boilerplate patterns.

## Task

Add an email template for: $ARGUMENTS

This command supports two types of templates:
1. **Token templates** (default): Email templates with verification tokens (verify email, reset password, etc.)
2. **Blank templates**: Simple templates with custom content and subject

## Pre-requisites Check

Before implementing, verify:

1. **Mail Module Exists**:
   - `src/common/mail/mail.module.ts` exists
   - MailService is configured
   - Mail templates directory exists: `src/common/mail/templates/`

2. **String Utility Exists**:
   - `src/common/utils/string.util.ts` contains `stringReplacer()` function
   - Function uses `%variable%` pattern for interpolation

3. **SMTP Configuration**:
   - SMTP settings in `.env` (host, port, username, password)
   - ConfigService has SMTP config

## Implementation Steps

### Step 1: Determine Template Type

Parse `$ARGUMENTS` to determine template type:
- If `--type token` or no type specified: Create token-based template
- If `--type blank`: Create blank template

Extract template name from arguments (first argument, convert to kebab-case for file name, PascalCase for type name).

### Step 2: Create Token-Based Template (Default)

#### 2.1. Create Template File

**Location**: `src/common/mail/templates/<template-name>-template.ts`

**Pattern from**: `src/common/mail/templates/verify-token-template.ts`

**Template**:
```typescript
/**
 * Data structure for <TemplateName> email template
 * Used for variable interpolation in HTML content
 */
export type <TemplateName>Template = {
  email: string;      // Recipient email
  url: string;        // Base URL for links
  token: string;      // Verification/action token
  expired_at: string; // Token expiration timestamp
  // Add custom fields as needed:
  // username?: string;
  // action?: string;
};

/**
 * HTML content for <TemplateName> email
 * Variables are replaced using %variable% syntax
 * Example: %email%, %url%, %token%, %expired_at%
 */
const <templateName>Html = `
  \u003c!DOCTYPE html\u003e
  \u003chtml\u003e
    \u003chead\u003e
      \u003cmeta charset=\"utf-8\"\u003e
      \u003cmeta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"\u003e
      \u003ctitle\u003e<Email Title>\u003c/title\u003e
      \u003cstyle\u003e
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 5px;
          padding: 20px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #007bff;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
      \u003c/style\u003e
    \u003c/head\u003e
    \u003cbody\u003e
      \u003cdiv class=\"container\"\u003e
        \u003ch2\u003e<Email Heading>\u003c/h2\u003e
        \u003cp\u003eHello,\u003c/p\u003e
        \u003cp\u003e<Email message explaining the action>\u003c/p\u003e
        \u003cp\u003e
          \u003ca href=\"%url%/<action-path>?token=%token%\" class=\"button\"\u003e
            <Action Button Text>
          \u003c/a\u003e
        \u003c/p\u003e
        \u003cp\u003e\u003cstrong\u003eImportant:\u003c/strong\u003e This link will expire at %expired_at%.\u003c/p\u003e
        \u003cp\u003eIf you did not request this action, please ignore this email.\u003c/p\u003e
        \u003cdiv class=\"footer\"\u003e
          \u003cp\u003eBest regards,\u003cbr\u003e<Your Company Name>\u003c/p\u003e
          \u003cp\u003e\u003cem\u003eThis is an automated message. Please do not reply.\u003c/em\u003e\u003c/p\u003e
        \u003c/div\u003e
      \u003c/div\u003e
    \u003c/body\u003e
  \u003c/html\u003e
`;

/**
 * Email subject line
 */
const <templateName>Subject = '<Email Subject>';

export {
  <templateName>Html,
  <templateName>Subject,
};
export type { <TemplateName>Template };
```

**Real-World Example** (Verify Email):
```typescript
type VerifyTokenTemplate = {
  email: string;
  url: string;
  token: string;
  expired_at: string;
};

const verifyEmailHtml = `
  \u003cp\u003eHello,\u003c/p\u003e
  \u003cp\u003eClick this \u003ca href=\"%url%/verify-email?token=%token%\"\u003elink\u003c/a\u003e to verify your email address. This link will expire at %expired_at%.\u003c/p\u003e
  \u003cp\u003eIf you did not request this, please ignore this email.\u003c/p\u003e
  \u003cp\u003eBest,\u003c/p\u003e
  \u003cp\u003eOrderSketch\u003c/p\u003e
`;
const verifyEmailSubject = 'Email Verification';

export {
  verifyEmailHtml,
  verifyEmailSubject,
};
export type { VerifyTokenTemplate };
```

#### 2.2. Integrate with MailService

**Location**: `src/common/mail/services/mail.service.ts`

**Step 1**: Import the template:
```typescript
import {
  <templateName>Html,
  <templateName>Subject,
  <TemplateName>Template,
} from '../templates/<template-name>-template';
```

**Step 2**: Add to template map enum (if using enum for template types):

If the project uses an enum like `EEmailTokenType`:
```typescript
// In auth/constants/auth.enum.ts or similar
export enum EEmailTokenType {
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  FORGOT_PASS = 'FORGOT_PASS',
  <TEMPLATE_NAME> = '<TEMPLATE_NAME>', // Add new type
}
```

**Step 3**: Update template map in MailService constructor:

**Pattern from**: `mail.service.ts:40-50`

```typescript
private readonly templateMap: ReadonlyMap<
  EEmailTokenType,
  EmailTemplateConfig
>;

constructor(
  private readonly logger: Logger,
  private readonly configService: ConfigService,
  @InjectQueue('mailSender')
  private readonly mailQueue: Queue,
) {
  this.templateMap = new Map([
    [
      EEmailTokenType.VERIFY_EMAIL,
      { html: verifyEmailHtml, subject: verifyEmailSubject },
    ],
    [
      EEmailTokenType.FORGOT_PASS,
      { html: resetPasswordHtml, subject: resetPasswordSubject },
    ],
    // Add new template
    [
      EEmailTokenType.<TEMPLATE_NAME>,
      { html: <templateName>Html, subject: <templateName>Subject },
    ],
  ]);
}
```

**Step 4**: Add helper method to send the template (optional but recommended):

```typescript
/**
 * Send <TemplateName> email
 * @param data - Template data
 */
send<TemplateName>(data: <TemplateName>Template): void {
  const template = this.templateMap.get(EEmailTokenType.<TEMPLATE_NAME>);
  if (!template) {
    this.logger.error(
      'Template not found for <TEMPLATE_NAME>',
      undefined,
      'MailService.send<TemplateName>',
    );
    return;
  }

  const content = stringReplacer<<TemplateName>Template>(template.html, data);
  const options: MailOptions = {
    subject: template.subject,
    mailTo: [data.email],
    content,
  };

  this._sendMail(options).catch((error: Error) => {
    this.logger.error(
      `Failed to queue <TemplateName> email for ${data.email}`,
      error.stack,
      'MailService.send<TemplateName>',
    );
  });
}
```

**Alternative**: Use existing `sendEmailToken()` method:
```typescript
// In your service/resolver:
this.mailService.sendEmailToken(
  {
    email: user.email,
    url: this.configService.get('app.frontendUrl'),
    token: generatedToken,
    expired_at: expirationDate.toISOString(),
  },
  EEmailTokenType.<TEMPLATE_NAME>,
);
```

### Step 3: Create Blank Template (Alternative)

#### 3.1. Create Template File

**Location**: `src/common/mail/templates/<template-name>-template.ts`

**Pattern from**: `src/common/mail/templates/bank-template.ts`

**Template**:
```typescript
/**
 * Data structure for <TemplateName> blank email template
 */
export type <TemplateName>Template = {
  email: string[];   // Recipient emails
  content: string;   // HTML content
  subject: string;   // Email subject
  // Add custom fields as needed:
  // cc?: string[];
  // attachments?: any[];
};
```

**Usage with MailService**:
```typescript
/**
 * Send <TemplateName> email
 * @param parameter - Template data
 */
send<TemplateName>(parameter: <TemplateName>Template): void {
  const options: MailOptions = {
    subject: parameter.subject,
    mailTo: parameter.email,
    content: parameter.content,
  };

  this._sendMail(options).catch((error: Error) => {
    this.logger.error(
      `Failed to queue <TemplateName> email`,
      error.stack,
      'MailService.send<TemplateName>',
    );
  });
}
```

### Step 4: Variable Interpolation Pattern

The boilerplate uses `stringReplacer()` utility for variable replacement:

**Pattern**: `%variableName%`

**Function** (from `string.util.ts:50-55`):
```typescript
export function stringReplacer<T>(template: string, replacer: T) {
  return template.replace(
    /%(\\w+)?%/g,
    (_, $2: string): string => replacer[$2] as string,
  );
}
```

**Usage**:
```typescript
import { stringReplacer } from '@common/utils/string.util';

const data = {
  email: 'user@example.com',
  url: 'https://example.com',
  token: 'abc123',
  expired_at: '2024-12-31T23:59:59Z',
};

const html = `
  <p>Hello %email%,</p>
  <a href="%url%/verify?token=%token%">Click here</a>
  <p>Expires: %expired_at%</p>
`;

const content = stringReplacer(html, data);
// Result:
// <p>Hello user@example.com,</p>
// <a href="https://example.com/verify?token=abc123">Click here</a>
// <p>Expires: 2024-12-31T23:59:59Z</p>
```

### Step 5: Validation Checklist

After implementation, verify:

#### Token Templates:
- [ ] Template file created in `src/common/mail/templates/`
- [ ] Type definition exported (<TemplateName>Template)
- [ ] HTML constant with variables (%variable% format)
- [ ] Subject constant defined
- [ ] All exports present (html, subject, type)
- [ ] Template imported in MailService
- [ ] Enum updated with new template type (if applicable)
- [ ] Template added to templateMap in constructor
- [ ] Helper method created or sendEmailToken() used
- [ ] stringReplacer() used for variable interpolation
- [ ] Error handling with logger
- [ ] Mail queue integration via _sendMail()

#### Blank Templates:
- [ ] Template type created with required fields
- [ ] Helper method created in MailService
- [ ] MailOptions properly constructed
- [ ] Error handling implemented
- [ ] Logger used for errors

#### Common:
- [ ] No TypeScript errors
- [ ] Imports use path aliases (@common/mail)
- [ ] Consistent naming conventions (camelCase for variables, PascalCase for types)
- [ ] HTML is valid and properly formatted
- [ ] Email is responsive (mobile-friendly)
- [ ] Variables match type definition

### Step 6: Testing

#### Test Variable Interpolation:

```typescript
import { stringReplacer } from '@common/utils/string.util';
import { <templateName>Html, <TemplateName>Template } from '@common/mail/templates/<template-name>-template';

// Test data
const testData: <TemplateName>Template = {
  email: 'test@example.com',
  url: 'https://example.com',
  token: 'test-token-123',
  expired_at: new Date(Date.now() + 3600000).toISOString(),
};

// Interpolate
const content = stringReplacer<<TemplateName>Template>(<templateName>Html, testData);

// Log or save to file for inspection
console.log(content);
// OR
import { writeFileSync } from 'fs';
writeFileSync('test-email.html', content);
```

#### Test Email Sending:

**1. Using sendEmailToken()** (for token templates):
```typescript
// In a test resolver/service
@Mutation(() => Boolean)
async testEmail(@CurrentUser() user: UserEntity): Promise<boolean> {
  await this.mailService.sendEmailToken(
    {
      email: user.email,
      url: this.configService.get('app.frontendUrl'),
      token: 'test-token-123',
      expired_at: new Date(Date.now() + 3600000).toISOString(),
    },
    EEmailTokenType.<TEMPLATE_NAME>,
  );
  return true;
}
```

**2. Using custom method**:
```typescript
@Mutation(() => Boolean)
async testEmail(@CurrentUser() user: UserEntity): Promise<boolean> {
  await this.mailService.send<TemplateName>({
    email: user.email,
    url: this.configService.get('app.frontendUrl'),
    token: 'test-token-123',
    expired_at: new Date(Date.now() + 3600000).toISOString(),
  });
  return true;
}
```

**3. Check email delivery**:
- Development: Use Mailtrap, MailHog, or similar
- Production: Check actual email inbox
- Verify:
  - Subject line is correct
  - Variables are replaced (no %var% remaining)
  - Links work correctly
  - Styling renders properly
  - Email is readable on mobile

**4. Check logs**:
```bash
# Watch for queue events
tail -f logs/app.log | grep "MailService\|SendMailProcessor"
```

**5. Test error handling**:
```typescript
// Test with invalid email
await this.mailService.send<TemplateName>({
  email: 'invalid-email', // Should log error
  // ... other fields
});
```

### Step 7: Common Template Patterns

#### Pattern 1: Verify Email Template

**Use case**: User registration email verification

**Pattern from**: `verify-token-template.ts`

**Key features**:
- Simple, clear call-to-action
- Token in URL query parameter
- Expiration warning
- Minimal styling

```typescript
const verifyEmailHtml = `
  <p>Hello,</p>
  <p>Click this <a href="%url%/verify-email?token=%token%">link</a> to verify your email address. This link will expire at %expired_at%.</p>
  <p>If you did not request this, please ignore this email.</p>
  <p>Best,</p>
  <p>OrderSketch</p>
`;
```

#### Pattern 2: Password Reset Template

**Use case**: Forgot password flow

**Pattern from**: `verify-token-template.ts`

**Key features**:
- Clear security warning
- Limited-time link
- Alternative contact info

```typescript
const resetPasswordHtml = `
  <p>Hello,</p>
  <p>Click this <a href="%url%/reset-password?token=%token%">link</a> to reset your password. This link will expire at %expired_at%.</p>
  <p>If you did not request this, please ignore this email.</p>
  <p>Best,</p>
  <p>OrderSketch</p>
`;
```

#### Pattern 3: Styled Template with Button

**Use case**: Professional transactional emails

**Key features**:
- Responsive design
- Prominent CTA button
- Footer with company info

```typescript
const styledHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #007bff;
          color: #ffffff;
          text-decoration: none;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Action Required</h2>
        <p>Hello %email%,</p>
        <p>Please click the button below to complete your action:</p>
        <a href="%url%/action?token=%token%" class="button">Take Action</a>
        <p>This link expires at %expired_at%</p>
      </div>
    </body>
  </html>
`;
```

#### Pattern 4: Multi-Language Support

**Use case**: Internationalized emails

```typescript
type I18nTemplate = {
  email: string;
  url: string;
  token: string;
  expired_at: string;
  language: 'en' | 'es' | 'fr'; // Add supported languages
};

const templates = {
  en: {
    html: `<p>Hello,</p><p>Click <a href="%url%?token=%token%">here</a>...</p>`,
    subject: 'Email Verification',
  },
  es: {
    html: `<p>Hola,</p><p>Haga clic <a href="%url%?token=%token%">aquí</a>...</p>`,
    subject: 'Verificación de correo electrónico',
  },
};

// Usage
const { html, subject } = templates[data.language];
const content = stringReplacer(html, data);
```

## Output Format

After successful implementation, output:

```
✅ Email Template Created: <TemplateName>

📁 Files Created/Modified:
  - src/common/mail/templates/<template-name>-template.ts (NEW)
  - src/common/mail/services/mail.service.ts (MODIFIED)
  - src/auth/constants/auth.enum.ts (MODIFIED) - if using enum

📧 Template Details:
  Type: <TemplateName>Template
  Subject: "<Email Subject>"
  Variables: email, url, token, expired_at [+ custom]

🔧 Integration:
  - Template added to MailService.templateMap
  - Helper method: mailService.send<TemplateName>()
  - OR use: mailService.sendEmailToken(data, EEmailTokenType.<TEMPLATE_NAME>)

📝 Next Steps:
  1. Customize HTML content and styling
  2. Update variable list if needed
  3. Test with sample data
  4. Verify email rendering in email clients
  5. Test on mobile devices

💡 Usage Example:
  ```typescript
  this.mailService.send<TemplateName>({
    email: 'user@example.com',
    url: 'https://example.com',
    token: 'abc123',
    expired_at: new Date().toISOString(),
  });
  ```
```

## Notes and Best Practices

### Template Design

1. **Keep It Simple**:
   - Avoid complex layouts (email clients have limited CSS support)
   - Use table-based layouts for better compatibility
   - Test in multiple email clients (Gmail, Outlook, Apple Mail)

2. **Inline Styles**:
   - Email clients strip `<style>` tags
   - Use inline styles for production emails
   - Consider using email template builders (MJML, Foundation for Emails)

3. **Responsive Design**:
   - Use `max-width` instead of fixed widths
   - Use `@media` queries for mobile optimization
   - Test on various screen sizes

4. **Images**:
   - Host images on CDN (don't embed)
   - Always include `alt` text
   - Use absolute URLs, not relative

5. **Links**:
   - Always use absolute URLs
   - Make buttons large enough for mobile (min 44x44px)
   - Include text version of link for accessibility

### Variable Interpolation

1. **Naming Convention**:
   - Use descriptive variable names: `%user_name%` not `%n%`
   - Keep consistent with type definition
   - Use snake_case for multi-word variables

2. **Required vs Optional**:
   - Mark optional variables in type definition with `?`
   - Provide defaults for optional variables
   - Don't leave undefined variables in template

3. **Security**:
   - Never interpolate user-generated HTML (XSS risk)
   - Escape HTML entities in user data
   - Sanitize URLs before interpolation

4. **Testing**:
   - Test with all variables populated
   - Test with missing optional variables
   - Verify no %var% remains in output

### MailService Integration

1. **Error Handling**:
   - Always wrap in try-catch
   - Log errors with context (email, template type)
   - Don't throw errors that stop execution
   - Use `.catch()` for async operations

2. **Queue Integration**:
   - Always use `_sendMail()` for queue integration
   - Don't call `sendNoReply()` directly in templates
   - Let queue handle retries and failures

3. **Template Map**:
   - Use Map for O(1) lookup performance
   - Define template map in constructor (not on each call)
   - Use ReadonlyMap to prevent modifications

4. **Logging**:
   - Log when email is queued
   - Log failures with stack traces
   - Include recipient email in logs (but not sensitive data)

### Token-Based Templates

1. **Token Generation**:
   - Use cryptographically secure random strings
   - Use utility: `generateCode()` from string.util
   - Include expiration in token payload or database

2. **Token Expiration**:
   - Always include expiration timestamp
   - Display in user-friendly format
   - Consider timezone differences

3. **Token URLs**:
   - Use query parameters: `?token=xxx`
   - Don't expose tokens in URL fragments
   - Use HTTPS always

4. **Security**:
   - Tokens should be single-use
   - Invalidate token after use
   - Implement rate limiting on verification endpoints

### Performance

1. **Queue Usage**:
   - Always queue emails (don't send synchronously)
   - Configure retry strategy (attempts, backoff)
   - Clean up completed jobs (`removeOnComplete: true`)

2. **Template Compilation**:
   - Pre-compile templates (don't generate HTML on each send)
   - Use template map for fast lookup
   - Cache compiled templates if needed

3. **Bulk Emails**:
   - Send to one recipient per job (allows individual retry)
   - Don't loop synchronously (use queue batch operations)
   - Consider rate limiting for large volumes

### Testing

1. **Development**:
   - Use Mailtrap or MailHog to capture emails
   - Don't send to real addresses in development
   - Use environment variables to toggle providers

2. **HTML Rendering**:
   - Save interpolated HTML to file for inspection
   - Use browser to preview
   - Use email testing tools (Email on Acid, Litmus)

3. **Variables**:
   - Test with realistic data
   - Test with edge cases (long strings, special chars)
   - Verify all variables are replaced

4. **Integration**:
   - Test queue integration (job creation)
   - Test retry mechanism (force failures)
   - Test email delivery (check inbox)

## Real-World Examples

### Example 1: Email Verification

**Scenario**: User signs up, needs to verify email

**Template**:
```typescript
type VerifyEmailTemplate = {
  email: string;
  url: string;
  token: string;
  expired_at: string;
};

const html = `
  <p>Hello,</p>
  <p>Click this <a href="%url%/verify-email?token=%token%">link</a> to verify your email address.</p>
  <p>This link will expire at %expired_at%.</p>
  <p>If you did not request this, please ignore this email.</p>
`;
```

**Usage**:
```typescript
await this.mailService.sendEmailToken(
  {
    email: user.email,
    url: this.frontendUrl,
    token: await this.authService.createVerifyToken(user),
    expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  EEmailTokenType.VERIFY_EMAIL,
);
```

### Example 2: Password Reset

**Scenario**: User forgot password

**Template**:
```typescript
const html = `
  <p>Hello,</p>
  <p>You requested a password reset. Click <a href="%url%/reset-password?token=%token%">here</a>.</p>
  <p>This link expires at %expired_at%.</p>
  <p><strong>If you did not request this, please secure your account immediately.</strong></p>
`;
```

### Example 3: Welcome Email (Blank Template)

**Scenario**: Send welcome email after signup

**Template**:
```typescript
type WelcomeTemplate = {
  email: string[];
  content: string;
  subject: string;
};

// Usage
const welcomeHtml = `
  <h2>Welcome to Our Platform!</h2>
  <p>We're excited to have you on board.</p>
  <p>Get started by exploring our features...</p>
`;

this.mailService.sendWelcome({
  email: [user.email],
  content: welcomeHtml,
  subject: 'Welcome to Our Platform',
});
```

### Example 4: Transactional Email with Data

**Scenario**: Order confirmation with details

**Template**:
```typescript
type OrderConfirmationTemplate = {
  email: string;
  order_id: string;
  total: string;
  items: string; // HTML list
  shipping_address: string;
};

const html = `
  <h2>Order Confirmation</h2>
  <p>Thank you for your order #%order_id%</p>
  <p><strong>Total:</strong> $%total%</p>
  <h3>Items:</h3>
  %items%
  <h3>Shipping Address:</h3>
  <p>%shipping_address%</p>
`;
```

## Troubleshooting

### Variables Not Replaced

**Symptoms**: Email shows `%variable%` instead of actual value

**Checks**:
1. Variable name matches between template and data object
2. stringReplacer() is called before sending
3. Variable exists in data object (not undefined)
4. Variable name uses correct case (case-sensitive)

**Solution**:
```typescript
// Debug: Log data and template
console.log('Template:', html);
console.log('Data:', data);
const content = stringReplacer(html, data);
console.log('Result:', content);
```

### Email Not Sent

**Symptoms**: No email in inbox, no errors

**Checks**:
1. SMTP configuration in .env
2. MailService initialized (check onModuleInit)
3. Mail queue is registered
4. SendMailProcessor is running
5. Redis is running (for queue)

**Solution**: Check logs for errors, verify SMTP credentials.

### HTML Rendering Issues

**Symptoms**: Email looks broken in some clients

**Checks**:
1. Use table-based layout, not flexbox/grid
2. Inline all styles (no `<style>` tags)
3. Use absolute URLs for images
4. Test in multiple email clients

**Solution**: Use email template frameworks (MJML) or test with Litmus.

### Template Not in Map

**Symptoms**: "Template not found" error

**Checks**:
1. Template imported in MailService
2. Enum value matches templateMap key
3. Template added to map in constructor

**Solution**:
```typescript
// Verify map has template
console.log(this.templateMap.has(EEmailTokenType.YOUR_TYPE));
```

---

**End of Skill: gqlify:add-mail-template**

This skill creates production-ready email templates with variable interpolation following the NestJS GraphQL boilerplate patterns. All code examples are based on actual implementations from the boilerplate at `/Users/cuongnq/Desktop/Learning.nosync/NESTJS/nestjs-graphql-boilerplate`.
