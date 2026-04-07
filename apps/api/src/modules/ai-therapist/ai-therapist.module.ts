import { Module } from '@nestjs/common';
import { TherapistService } from './therapist.service.js';
import { TtsService } from './tts.service.js';

@Module({
  providers: [TherapistService, TtsService],
  exports:   [TherapistService, TtsService],
})
export class AiTherapistModule {}
