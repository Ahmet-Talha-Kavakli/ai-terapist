import { Module } from '@nestjs/common';
import { AiTherapistModule } from '../ai-therapist/ai-therapist.module.js';
import { SessionService } from './session.service.js';
import { SessionGateway } from './session.gateway.js';

@Module({
  imports:   [AiTherapistModule],
  providers: [SessionService, SessionGateway],
  exports:   [SessionService],
})
export class SessionModule {}
