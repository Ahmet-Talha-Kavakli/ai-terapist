import { Controller, Post, Body, Headers, UseGuards, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { ClerkAuthGuard } from '../../shared/guards/clerk-auth.guard';

interface ConsentItem {
  consentType: string;
  granted: boolean;
  version: string;
}

interface OnboardingBody {
  intake: {
    primaryGoals: string[];
    currentChallenges: string;
    previousTherapyExperience: string;
    currentMedications?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    preferredSessionLength: string;
    preferredCommunicationStyle: string;
  };
  consents: ConsentItem[];
  disclaimerAcceptedAt: string;
}

@Controller('user')
@UseGuards(ClerkAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('onboarding')
  async onboarding(
    @Headers('x-clerk-user-id') clerkId: string,
    @Body() body: OnboardingBody,
  ) {
    if (!clerkId) throw new BadRequestException('Missing user ID');
    await this.userService.saveOnboarding(clerkId, body);
    return { success: true };
  }
}
