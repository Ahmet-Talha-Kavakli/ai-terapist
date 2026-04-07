import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

interface ConsentItem {
  consentType: string;
  granted: boolean;
  version: string;
}

interface OnboardingData {
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

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureUserExists(clerkId: string, email?: string) {
    return this.prisma.user.upsert({
      where: { clerkId },
      create: { clerkId, email },
      update: { email },
    });
  }

  async saveOnboarding(clerkId: string, data: OnboardingData) {
    const user = await this.ensureUserExists(clerkId);

    await this.prisma.$transaction([
      // Save psychological profile
      this.prisma.userProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          goals: data.intake.primaryGoals,
          mentalHealthHistory: {
            currentChallenges: data.intake.currentChallenges,
            previousTherapyExperience: data.intake.previousTherapyExperience,
            currentMedications: data.intake.currentMedications ?? null,
          },
          therapyPreferences: {
            communicationStyle: data.intake.preferredCommunicationStyle,
            sessionLength: parseInt(data.intake.preferredSessionLength, 10),
            emergencyContact: data.intake.emergencyContactName
              ? {
                  name: data.intake.emergencyContactName,
                  phone: data.intake.emergencyContactPhone,
                }
              : null,
          },
          disclaimerAcceptedAt: new Date(data.disclaimerAcceptedAt),
        },
        update: {
          goals: data.intake.primaryGoals,
          mentalHealthHistory: {
            currentChallenges: data.intake.currentChallenges,
            previousTherapyExperience: data.intake.previousTherapyExperience,
            currentMedications: data.intake.currentMedications ?? null,
          },
          therapyPreferences: {
            communicationStyle: data.intake.preferredCommunicationStyle,
            sessionLength: parseInt(data.intake.preferredSessionLength, 10),
          },
          disclaimerAcceptedAt: new Date(data.disclaimerAcceptedAt),
        },
      }),

      // Delete existing consents and re-create
      this.prisma.userConsent.deleteMany({ where: { userId: user.id } }),
    ]);

    // Create new consents (after deleteMany in transaction)
    await this.prisma.userConsent.createMany({
      data: data.consents.map((c) => ({
        userId: user.id,
        consentType: c.consentType,
        granted: c.granted,
        grantedAt: c.granted ? new Date() : null,
        version: c.version,
      })),
    });
  }
}
