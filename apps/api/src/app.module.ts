import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './shared/prisma/prisma.module.js';
import { AuditLogMiddleware } from './shared/middleware/audit-log.middleware.js';
import { SessionModule } from './modules/session/session.module.js';
import { AiTherapistModule } from './modules/ai-therapist/ai-therapist.module.js';
import { MemoryModule } from './modules/memory/memory.module.js';
import { UserModule } from './modules/user/user.module.js';
import { InngestModule } from './inngest/inngest.module.js';
import { AppController } from './app.controller.js';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 3_600_000, limit: 5 }]),
    PrismaModule,
    SessionModule,
    AiTherapistModule,
    MemoryModule,
    UserModule,
    InngestModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditLogMiddleware).forRoutes('*path');
  }
}
