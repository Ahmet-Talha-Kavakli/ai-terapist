import { Module } from '@nestjs/common';
import { TherapistService } from './therapist.service';
import { TtsService } from './tts.service';

@Module({
  providers: [TherapistService, TtsService],
  exports:   [TherapistService, TtsService],
})
export class AiTherapistModule {}
