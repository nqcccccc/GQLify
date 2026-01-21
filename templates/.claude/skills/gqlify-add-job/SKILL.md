---
name: gqlify:add-job
description: Add a BullMQ background job processor with queue integration for async task processing
argument-hint: <JobName> [--type cron|queue]
disable-model-invocation: false
---

# GQLify: Add Background Job Processor

You are a GQLify background job specialist. Your expertise is in creating BullMQ queue processors and scheduled jobs following the NestJS GraphQL boilerplate patterns.

## Task

Add a background job processor for: $ARGUMENTS

This command supports two types of jobs:
1. **Queue-based jobs** (default): BullMQ processors that process async tasks from a queue
2. **Cron-based jobs**: Scheduled jobs that run at specific intervals using `@nestjs/schedule`

## Pre-requisites Check

Before implementing, verify:

1. **BullMQ Configuration** (for queue-based jobs):
   - `@nestjs/bullmq` is installed
   - Redis is configured in `.env`
   - BullModule is registered in AppModule

2. **Schedule Configuration** (for cron jobs):
   - `@nestjs/schedule` is installed
   - JobsModule is imported in AppModule
   - `JOB_ENABLE=true` in `.env`

3. **Common Dependencies**:
   - Logger is available from `@nestjs/common`
   - Error handling with ErrorFactory exists

## Implementation Steps

### Step 1: Determine Job Type

Parse `$ARGUMENTS` to determine job type:
- If `--type queue` or no type specified: Create BullMQ queue processor
- If `--type cron`: Create scheduled cron job

Extract job name from arguments (first argument, convert to PascalCase for class name).

### Step 2: Create Queue-Based Job (Default)

#### 2.1. Create Queue Processor File

**Location**: `src/common/jobs/processors/<job-name>.processor.ts`

**Pattern from**: `src/common/mail/queues/send-mail.processor.ts`

**Template**:
```typescript
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

// Define your job data interface
export interface <JobName>JobData {
  // Add your job data fields here
  // Example: userId: string;
  // Example: action: string;
}

@Processor('<queueName>', {
  concurrency: 10, // Number of concurrent jobs
  limiter: {
    max: 2,        // Max 2 jobs
    duration: 60000, // per 60 seconds
  },
})
export class <JobName>Processor extends WorkerHost {
  constructor(
    private readonly logger: Logger,
    // Inject services you need
    // Example: private readonly userService: UserService,
  ) {
    super();
  }

  @OnWorkerEvent('active')
  onQueueActive(job: Job) {
    this.logger.log(
      `Job has been started: ${job?.id}`,
      '<JobName>Processor.onQueueActive',
    );
  }

  @OnWorkerEvent('completed')
  onQueueComplete(job: Job) {
    this.logger.log(
      `Job has been finished: ${job?.id}`,
      '<JobName>Processor.onQueueComplete',
    );
  }

  @OnWorkerEvent('failed')
  onQueueFailed(job: Job, err: any) {
    this.logger.error(
      `Job has been failed: ${job?.id} with data ${JSON.stringify(job.data)}`,
      err,
      '<JobName>Processor.onQueueFailed',
    );
  }

  @OnWorkerEvent('error')
  onQueueError(e: any) {
    this.logger.error(
      `Job has got error`,
      e,
      '<JobName>Processor.onQueueError',
    );
  }

  @OnWorkerEvent('stalled')
  onQueueStalled(job: Job) {
    this.logger.log(
      `Job has been stalled: ${job?.id}`,
      '<JobName>Processor.onQueueStalled',
    );
  }

  /**
   * Main job processing logic
   * This method is called for each job in the queue
   */
  async process(job: Job<<JobName>JobData>): Promise<void> {
    try {
      // Implement your job logic here
      this.logger.log(
        `Processing job ${job.id} with data: ${JSON.stringify(job.data)}`,
        '<JobName>Processor.process',
      );

      // Example: await this.userService.performAction(job.data.userId);

      this.logger.log(
        `Job ${job.id} completed successfully`,
        '<JobName>Processor.process',
      );
    } catch (error) {
      this.logger.error(
        `Job ${job.id} processing failed`,
        error,
        '<JobName>Processor.process',
      );
      throw error; // Re-throw to trigger retry mechanism
    }
  }
}
```

#### 2.2. Create Queue Producer Service (Optional but Recommended)

**Location**: `src/common/jobs/services/<job-name>.producer.ts`

**Purpose**: Centralize job queuing logic

**Template**:
```typescript
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { <JobName>JobData } from '../processors/<job-name>.processor';

@Injectable()
export class <JobName>ProducerService {
  constructor(
    private readonly logger: Logger,
    @InjectQueue('<queueName>')
    private readonly queue: Queue,
  ) {}

  /**
   * Add a job to the queue
   * @param data - Job data
   * @returns Job ID
   */
  async addJob(data: <JobName>JobData): Promise<string> {
    try {
      const job = await this.queue.add(
        '<job-type>', // Job name/type
        data,
        {
          removeOnComplete: true, // Remove completed jobs from queue
          attempts: 5,            // Retry up to 5 times
          backoff: {
            type: 'exponential',  // Exponential backoff between retries
            delay: 2000,          // Start with 2 second delay
          },
        },
      );

      this.logger.log(
        `Job ${job.id} added to queue`,
        '<JobName>ProducerService.addJob',
      );

      return job.id;
    } catch (error) {
      this.logger.error(
        `Failed to add job to queue`,
        error,
        '<JobName>ProducerService.addJob',
      );
      throw error;
    }
  }

  /**
   * Add a delayed job
   * @param data - Job data
   * @param delayMs - Delay in milliseconds
   * @returns Job ID
   */
  async addDelayedJob(data: <JobName>JobData, delayMs: number): Promise<string> {
    const job = await this.queue.add(
      '<job-type>',
      data,
      {
        delay: delayMs,
        removeOnComplete: true,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    this.logger.log(
      `Delayed job ${job.id} added to queue (delay: ${delayMs}ms)`,
      '<JobName>ProducerService.addDelayedJob',
    );

    return job.id;
  }

  /**
   * Add a repeating job (cron-like)
   * @param data - Job data
   * @param pattern - Cron pattern (e.g., '0 0 * * *' for daily at midnight)
   * @returns Job ID
   */
  async addRepeatingJob(data: <JobName>JobData, pattern: string): Promise<string> {
    const job = await this.queue.add(
      '<job-type>',
      data,
      {
        repeat: {
          pattern,
        },
        removeOnComplete: true,
      },
    );

    this.logger.log(
      `Repeating job ${job.id} added with pattern: ${pattern}`,
      '<JobName>ProducerService.addRepeatingJob',
    );

    return job.id;
  }
}
```

#### 2.3. Register Queue in Module

**Location**: `src/common/jobs/jobs.module.ts` (if centralized) OR create new module

**Pattern from**: `src/common/mail/mail.module.ts`

**Option A: Add to existing JobsModule**:
```typescript
import { BullModule } from '@nestjs/bullmq';
import { <JobName>Processor } from './processors/<job-name>.processor';
import { <JobName>ProducerService } from './services/<job-name>.producer';

@Module({
  imports: [
    ScheduleModule.forRoot(), // If you have cron jobs
    BullModule.registerQueue({
      name: '<queueName>', // Must match @Processor() decorator
    }),
  ],
  providers: [
    SampleJobService,
    <JobName>Processor,
    <JobName>ProducerService,
  ],
  exports: [<JobName>ProducerService],
})
export class JobsModule {}
```

**Option B: Create dedicated module**:

**Location**: `src/common/jobs/<job-name>.module.ts`

```typescript
import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { <JobName>Processor } from './processors/<job-name>.processor';
import { <JobName>ProducerService } from './services/<job-name>.producer';

@Global() // Make it globally available if needed
@Module({
  imports: [
    BullModule.registerQueue({
      name: '<queueName>',
    }),
  ],
  providers: [<JobName>Processor, <JobName>ProducerService],
  exports: [<JobName>ProducerService],
})
export class <JobName>Module {}
```

Then import in `AppModule` or `CommonModule`.

### Step 3: Create Cron-Based Job (Alternative)

#### 3.1. Create Cron Job Service File

**Location**: `src/common/jobs/services/<job-name>.job.service.ts`

**Pattern from**: `src/common/jobs/services/sample.job.service.ts`

**Template**:
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class <JobName>JobService {
  private readonly logger = new Logger(<JobName>JobService.name);

  constructor(
    // Inject services you need
    // Example: private readonly userService: UserService,
  ) {}

  /**
   * Daily job - runs every day at midnight
   * Cron pattern: '0 0 * * *'
   */
  @Cron('0 0 * * *')
  async dailyJob() {
    this.logger.log('Starting daily job', '<JobName>JobService.dailyJob');

    try {
      // Implement your job logic here
      // Example: await this.userService.cleanupInactiveUsers();

      this.logger.log('Daily job completed', '<JobName>JobService.dailyJob');
    } catch (error) {
      this.logger.error(
        'Daily job failed',
        error,
        '<JobName>JobService.dailyJob',
      );
    }
  }

  /**
   * Hourly job - runs every hour
   * Using CronExpression enum
   */
  @Cron(CronExpression.EVERY_HOUR)
  async hourlyJob() {
    this.logger.log('Starting hourly job', '<JobName>JobService.hourlyJob');

    try {
      // Implement your job logic here

      this.logger.log('Hourly job completed', '<JobName>JobService.hourlyJob');
    } catch (error) {
      this.logger.error(
        'Hourly job failed',
        error,
        '<JobName>JobService.hourlyJob',
      );
    }
  }

  /**
   * Custom interval job - runs every 30 minutes
   * Using @Interval decorator
   */
  // Uncomment if you need interval-based jobs:
  // import { Interval } from '@nestjs/schedule';
  // @Interval(30 * 60 * 1000) // 30 minutes in milliseconds
  // async intervalJob() {
  //   this.logger.log('Starting interval job', '<JobName>JobService.intervalJob');
  //   // Your logic here
  // }
}
```

**Common Cron Patterns**:
```typescript
'0 0 * * *'         // Every day at midnight
'0 */2 * * *'       // Every 2 hours
'0 0 * * 0'         // Every Sunday at midnight
'0 9 * * 1-5'       // Weekdays at 9 AM
'*/30 * * * *'      // Every 30 minutes
'0 0 1 * *'         // First day of month at midnight

// Or use CronExpression enum:
CronExpression.EVERY_5_SECONDS
CronExpression.EVERY_MINUTE
CronExpression.EVERY_HOUR
CronExpression.EVERY_DAY_AT_MIDNIGHT
CronExpression.EVERY_WEEK
```

#### 3.2. Register Cron Job in JobsModule

**Location**: `src/common/jobs/jobs.module.ts`

**Update**:
```typescript
import { <JobName>JobService } from './services/<job-name>.job.service';

@Module({})
export class JobsModule {
  static forRoot(): DynamicModule {
    const imports = [
      ...(process.env.JOB_ENABLE === 'true' ? [ScheduleModule.forRoot()] : []),
    ];

    return {
      module: JobsModule,
      providers: [
        SampleJobService,
        <JobName>JobService, // Add your new job service
      ],
      exports: [],
      controllers: [],
      imports,
    };
  }
}
```

### Step 4: Usage Example

#### For Queue-Based Jobs:

**In a service or resolver**:
```typescript
import { <JobName>ProducerService } from '@common/jobs/services/<job-name>.producer';

@Injectable()
export class UserService {
  constructor(
    private readonly <jobName>Producer: <JobName>ProducerService,
  ) {}

  async triggerBackgroundTask(userId: string) {
    // Add immediate job
    await this.<jobName>Producer.addJob({
      userId,
      action: 'process',
    });

    // Add delayed job (1 hour)
    await this.<jobName>Producer.addDelayedJob(
      { userId, action: 'reminder' },
      60 * 60 * 1000,
    );

    // Add repeating job (daily at midnight)
    await this.<jobName>Producer.addRepeatingJob(
      { userId, action: 'daily-report' },
      '0 0 * * *',
    );
  }
}
```

#### For Cron Jobs:

Cron jobs run automatically based on schedule. No manual triggering needed.

**Enable in .env**:
```env
JOB_ENABLE=true
```

### Step 5: Validation Checklist

After implementation, verify:

#### Queue-Based Jobs:
- [ ] Processor file created in `src/common/jobs/processors/`
- [ ] Processor class extends `WorkerHost`
- [ ] `@Processor()` decorator with queue name
- [ ] All event handlers implemented (active, completed, failed, error, stalled)
- [ ] `process()` method implements job logic
- [ ] Job data interface defined and exported
- [ ] Producer service created (optional but recommended)
- [ ] Queue registered in module with `BullModule.registerQueue()`
- [ ] Processor added to module providers
- [ ] Producer service exported if needed in other modules
- [ ] Logger injected and used for all events
- [ ] Error handling with try-catch in process()
- [ ] Job options configured (attempts, backoff, removeOnComplete)

#### Cron Jobs:
- [ ] Service file created in `src/common/jobs/services/`
- [ ] `@Cron()` decorator with valid pattern
- [ ] Logger used for job start/complete/error
- [ ] Try-catch around job logic
- [ ] Service added to JobsModule providers
- [ ] ScheduleModule.forRoot() imported in module
- [ ] `JOB_ENABLE=true` in .env

#### Common:
- [ ] No TypeScript errors
- [ ] Imports use path aliases (@common/jobs)
- [ ] Consistent naming conventions (PascalCase for classes)
- [ ] Proper dependency injection
- [ ] All dependencies imported in module

### Step 6: Testing

#### Queue-Based Job Testing:

**1. Test job addition**:
```typescript
// In a test service or resolver
async testJob() {
  const jobId = await this.<jobName>Producer.addJob({
    userId: 'test-user-123',
    action: 'test',
  });

  console.log(`Job added: ${jobId}`);
}
```

**2. Check BullMQ Dashboard** (if configured):
- Navigate to BullMQ UI
- Verify queue appears
- Check job status (completed/failed)
- Review job data and logs

**3. Monitor logs**:
```bash
# Watch for job events
tail -f logs/app.log | grep "<JobName>Processor"
```

**4. Test retry mechanism**:
```typescript
// In processor, temporarily throw error
async process(job: Job<<JobName>JobData>): Promise<void> {
  throw new Error('Test retry');
}
```
- Verify job retries 5 times
- Check exponential backoff (2s, 4s, 8s, 16s, 32s)

#### Cron Job Testing:

**1. Test immediate execution** (for development):
```typescript
// Temporarily change to every minute
@Cron('*/1 * * * *')
async testJob() {
  // Your logic
}
```

**2. Monitor logs**:
```bash
# Check cron execution
tail -f logs/app.log | grep "<JobName>JobService"
```

**3. Verify schedule**:
- Wait for next scheduled execution
- Check logs for job start/complete messages
- Verify job logic executes correctly

**4. Test error handling**:
```typescript
// Temporarily throw error
async dailyJob() {
  throw new Error('Test error handling');
}
```
- Verify error is logged
- Confirm job doesn't crash the application

### Step 7: Common Patterns from Boilerplate

#### Pattern 1: Mail Queue (from send-mail.processor.ts)

**Use case**: Async email sending with retry

**Key features**:
- Concurrency: 10 simultaneous emails
- Rate limiting: Max 2 per minute
- Exponential backoff on failure
- Automatic cleanup of completed jobs

**Implementation**:
```typescript
@Processor('mailSender', {
  concurrency: 10,
  limiter: {
    max: 2,
    duration: 60000,
  },
})
export class SendMailProcessor extends WorkerHost {
  async process(job: Job<MailOptions>): Promise<void> {
    await this.mailService.sendNoReply(job.data);
  }
}
```

**Queue usage**:
```typescript
await this.mailQueue.add(
  'send-mail',
  { subject, mailTo, content },
  {
    removeOnComplete: true,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
);
```

#### Pattern 2: Scheduled Sync (from sample.job.service.ts)

**Use case**: Daily data synchronization

**Implementation**:
```typescript
@Injectable()
export class SampleJobService {
  @Cron('0 0 * * *') // Daily at midnight
  dailyJob() {
    Logger.log('Daily sync job done', 'DataJobService');
  }
}
```

#### Pattern 3: Module Registration with Environment Toggle

**Use case**: Enable/disable jobs via environment variable

**Implementation**:
```typescript
static forRoot(): DynamicModule {
  const imports = [
    ...(process.env.JOB_ENABLE === 'true' ? [ScheduleModule.forRoot()] : []),
  ];
  // ...
}
```

## Output Format

After successful implementation, output:

```
✅ Background Job Created: <JobName>

📁 Files Created/Modified:
  - src/common/jobs/processors/<job-name>.processor.ts (NEW) - Queue processor
  - src/common/jobs/services/<job-name>.producer.ts (NEW) - Producer service
  - src/common/jobs/jobs.module.ts (MODIFIED) - Module registration

OR (for cron jobs):
  - src/common/jobs/services/<job-name>.job.service.ts (NEW) - Cron job service
  - src/common/jobs/jobs.module.ts (MODIFIED) - Module registration

🔧 Configuration:
  Queue Name: <queueName>
  Concurrency: 10
  Rate Limit: 2 jobs per minute
  Retry Attempts: 5
  Backoff: Exponential (2s base delay)

OR (for cron jobs):
  Schedule: <cron-pattern>
  Description: <schedule-description>

📝 Next Steps:
  1. Implement job processing logic in process() method (queue) or @Cron method (cron)
  2. Inject required services in constructor
  3. Test job execution
  4. Monitor logs for job events
  5. Configure Redis connection for production (queue jobs)
  6. Set JOB_ENABLE=true in .env (cron jobs)

💡 Usage Example:
  [Include specific usage code for the created job]
```

## Notes and Best Practices

### Queue-Based Jobs

1. **Concurrency Settings**:
   - Use `concurrency: 10` for I/O-bound tasks (API calls, DB queries)
   - Use `concurrency: 1` for CPU-intensive tasks
   - Adjust based on server resources

2. **Rate Limiting**:
   - Prevent overwhelming external APIs
   - Example: `{ max: 2, duration: 60000 }` = 2 jobs per minute

3. **Retry Strategy**:
   - Always configure `attempts` and `backoff`
   - Exponential backoff prevents thundering herd
   - Use `removeOnComplete: true` to prevent memory issues

4. **Job Data**:
   - Keep job data small (serialize only necessary data)
   - Avoid passing large objects or files
   - Use IDs and fetch data in processor

5. **Error Handling**:
   - Always wrap process() logic in try-catch
   - Log errors with context (job ID, data)
   - Re-throw to trigger retry mechanism
   - Don't catch errors you can't recover from

6. **Event Listeners**:
   - Use `@OnWorkerEvent()` for monitoring
   - Log all events (active, completed, failed, error, stalled)
   - Don't do heavy work in event listeners

7. **Queue Naming**:
   - Use descriptive names: 'emailSender', 'imageProcessor'
   - Must match between `@Processor()` and `registerQueue()`

8. **Producer Service Pattern**:
   - Centralize job creation logic
   - Export from module for use in other modules
   - Add helper methods (addDelayedJob, addRepeatingJob)

9. **Global vs Local Modules**:
   - Use `@Global()` for jobs used across many modules
   - Keep local for domain-specific jobs

10. **Testing in Development**:
    - Use lower retry counts for faster testing
    - Use `removeOnFail: false` to inspect failed jobs
    - Monitor BullMQ dashboard if available

### Cron Jobs

1. **Cron Pattern Validation**:
   - Test patterns at https://crontab.guru/
   - Use `CronExpression` enum when possible (type-safe)
   - Document what each pattern does in comments

2. **Error Handling**:
   - Always use try-catch in cron methods
   - Log errors but don't crash the app
   - Consider alerting on repeated failures

3. **Long-Running Jobs**:
   - Break into smaller chunks if possible
   - Use pagination for batch processing
   - Add progress logging

4. **Timezone Awareness**:
   - Cron runs in server timezone by default
   - Document expected timezone
   - Consider using UTC for consistency

5. **Development vs Production**:
   - Use `JOB_ENABLE=false` in development
   - Test with short intervals first (`*/1 * * * *`)
   - Restore actual schedule before deployment

6. **Idempotency**:
   - Make jobs idempotent (safe to run multiple times)
   - Handle duplicate executions gracefully
   - Use locking mechanisms if needed

7. **Monitoring**:
   - Log job start and completion
   - Track execution duration
   - Alert on failures or missed executions

### General Best Practices

1. **Separation of Concerns**:
   - Processor/Service: Job scheduling logic only
   - Business logic: In domain services
   - Keep jobs thin, delegate to services

2. **Dependency Injection**:
   - Inject services, not repositories directly
   - Use service layer for business logic
   - Keep processor focused on job mechanics

3. **Logging**:
   - Use contextual logging (include job ID, processor name)
   - Log at appropriate levels (log, error, warn)
   - Don't log sensitive data

4. **Module Organization**:
   - Group related jobs in same module
   - Export producer services for external use
   - Keep processors and services in separate directories

5. **Environment Configuration**:
   - Use env variables for job settings (concurrency, rate limits)
   - Never hardcode Redis connection strings
   - Document required env variables

6. **Documentation**:
   - Document what each job does
   - Explain cron patterns in comments
   - Document expected job data interface

7. **Performance**:
   - Use Bull's built-in features (rate limiting, concurrency)
   - Don't reinvent retry logic
   - Monitor queue size and processing time

8. **Security**:
   - Validate job data in processor
   - Don't trust data from queue
   - Use ErrorFactory for consistent error handling

## Real-World Examples

### Example 1: Email Queue Processor

**Scenario**: Send emails asynchronously with retry

**Files**:
```
src/common/mail/
├── queues/
│   └── send-mail.processor.ts
├── services/
│   └── mail.service.ts
└── mail.module.ts
```

**Key features**:
- Concurrency: 10
- Rate limit: 2 per minute
- 5 retry attempts
- Exponential backoff
- Auto-cleanup completed jobs

### Example 2: Daily Sync Job

**Scenario**: Synchronize data daily at midnight

**Files**:
```
src/common/jobs/
├── services/
│   └── sample.job.service.ts
└── jobs.module.ts
```

**Key features**:
- Cron pattern: `0 0 * * *`
- Environment toggle: `JOB_ENABLE`
- Simple logging

### Example 3: Image Processing Queue

**Common use case**: Resize uploaded images

**Implementation**:
```typescript
// Processor
@Processor('imageProcessor', {
  concurrency: 5, // CPU-intensive, lower concurrency
})
export class ImageProcessorService extends WorkerHost {
  async process(job: Job<{ imageId: string }>): Promise<void> {
    const image = await this.imageService.findById(job.data.imageId);
    await this.imageService.resize(image, [100, 200, 500]);
  }
}

// Usage in upload resolver
await this.imageQueue.add(
  'resize',
  { imageId: uploadedImage.id },
  { attempts: 3 },
);
```

### Example 4: Cleanup Job

**Common use case**: Delete old records weekly

**Implementation**:
```typescript
@Injectable()
export class CleanupJobService {
  @Cron('0 0 * * 0') // Every Sunday at midnight
  async weeklyCleanup() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.tokenService.deleteExpiredTokens(thirtyDaysAgo);
    await this.logService.deleteOldLogs(thirtyDaysAgo);
  }
}
```

## Troubleshooting

### Queue Jobs Not Processing

**Symptoms**: Jobs added but never execute

**Checks**:
1. Redis connection: Verify Redis is running and accessible
2. Queue name mismatch: Ensure `@Processor()` matches `registerQueue()`
3. Module imports: Verify BullModule is properly imported
4. Processor registration: Check processor is in module providers
5. Logs: Look for connection errors in application logs

### Cron Jobs Not Running

**Symptoms**: Scheduled jobs don't execute

**Checks**:
1. Environment variable: Ensure `JOB_ENABLE=true`
2. ScheduleModule: Verify `ScheduleModule.forRoot()` is imported
3. Job service registration: Check service is in module providers
4. Cron pattern: Validate pattern at crontab.guru
5. Server time: Check server timezone matches expected schedule

### Jobs Failing Repeatedly

**Symptoms**: All attempts fail, jobs move to failed state

**Checks**:
1. Error logs: Review `onQueueFailed` logs for root cause
2. Dependencies: Ensure all injected services are available
3. Data validation: Check job data is valid and complete
4. External services: Verify third-party APIs are accessible
5. Resource limits: Check memory/CPU constraints

### High Queue Backlog

**Symptoms**: Queue size keeps growing

**Solutions**:
1. Increase concurrency: Process more jobs simultaneously
2. Optimize processing: Speed up job logic
3. Add more workers: Scale horizontally
4. Adjust rate limits: Allow faster processing
5. Review job creation: Are too many jobs being added?

---

**End of Skill: gqlify:add-job**

This skill creates production-ready BullMQ queue processors or scheduled cron jobs following the NestJS GraphQL boilerplate patterns. All code examples are based on actual implementations from the boilerplate at `/Users/cuongnq/Desktop/Learning.nosync/NESTJS/nestjs-graphql-boilerplate`.
