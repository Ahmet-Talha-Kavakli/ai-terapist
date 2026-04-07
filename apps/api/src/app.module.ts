import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuditLogMiddleware } from './shared/middleware/audit-log.middleware';
import { SessionModule } from './modules/session/session.module';
import { AiTherapistModule } from './modules/ai-therapist/ai-therapist.module';
import { VisionModule } from './modules/vision/vision.module';
import { MemoryModule } from './modules/memory/memory.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 3_600_000, limit: 5 }]), // 5 req/hour per IP
    PrismaModule,
    SessionModule,
    AiTherapistModule,
    VisionModule,
    MemoryModule,
    UserModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditLogMiddleware).forRoutes('*path');
  }
}
