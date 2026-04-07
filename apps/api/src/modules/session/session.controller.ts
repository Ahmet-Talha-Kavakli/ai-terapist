import {
  Controller,
  Get,
  Query,
  Headers,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { SessionService } from './session.service.js';
import { ClerkAuthGuard } from '../../shared/guards/clerk-auth.guard.js';

@Controller('session')
@UseGuards(ClerkAuthGuard)
export class SessionController {
  constructor(private readonly sessions: SessionService) {}

  /**
   * GET /session/history?page=1&perPage=20
   * Returns paginated list of completed sessions + SOAP notes for the caller.
   */
  @Get('history')
  async history(
    @Headers('x-clerk-user-id') clerkId: string,
    @Query('page')    page    = '1',
    @Query('perPage') perPage = '20',
  ) {
    if (!clerkId) throw new BadRequestException('Missing user ID');
    return this.sessions.getHistory(
      clerkId,
      Math.max(1, parseInt(page,    10) || 1),
      Math.min(50, parseInt(perPage, 10) || 20),
    );
  }
}
