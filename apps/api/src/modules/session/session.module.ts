import { Module } from '@nestjs/common';
import { AiTherapistModule } from '../ai-therapist/ai-therapist.module.js';
import { SessionService } from './session.service.js';
import { SessionGateway } from './session.gateway.js';
import { SessionController } from './session.controller.js';

@Module({
  imports:     [AiTherapistModule],
  controllers: [SessionController],
  providers:   [SessionService, SessionGateway],
  exports:     [SessionService],
})
export class SessionModule {}
