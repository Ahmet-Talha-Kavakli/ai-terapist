import { Module } from '@nestjs/common';
import { AiTherapistModule } from '../ai-therapist/ai-therapist.module';
import { SessionService } from './session.service';
import { SessionGateway } from './session.gateway';
import { SessionController } from './session.controller';

@Module({
  imports:     [AiTherapistModule],
  controllers: [SessionController],
  providers:   [SessionService, SessionGateway],
  exports:     [SessionService],
})
export class SessionModule {}
