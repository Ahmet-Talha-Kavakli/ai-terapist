import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import type { IUserProfile, IMemoryChunk } from '@ai-therapist/types';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a session record and return its ID. */
  async startSession(userId: string): Promise<string> {
    const session = await this.prisma.session.create({
      data: { userId, status: 'active', sessionType: 'regular' },
      select: { id: true },
    });
    return session.id;
  }

  /** Mark session as ended and record duration. */
  async endSession(sessionId: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where:  { id: sessionId },
      select: { startedAt: true },
    });
    if (!session) return;

    const durationSeconds = Math.round(
      (Date.now() - session.startedAt.getTime()) / 1000,
    );

    await this.prisma.session.update({
      where: { id: sessionId },
      data:  { endedAt: new Date(), durationSeconds, status: 'completed' },
    });
  }

  /**
   * Fetch the user's Prisma profile (cast to IUserProfile shape).
   * Returns null if profile not found (e.g. onboarding incomplete).
   */
  async getUserProfile(userId: string): Promise<IUserProfile | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });
    if (!profile) return null;

    return {
      id:                  profile.id,
      userId:              profile.userId,
      goals:               profile.goals,
      mentalHealthHistory: profile.mentalHealthHistory as Record<string, unknown>,
      therapyPreferences:  profile.therapyPreferences  as Record<string, unknown>,
      personalitySnapshot: profile.personalitySnapshot as Record<string, unknown>,
      riskLevel:           profile.riskLevel as IUserProfile['riskLevel'],
      disclaimerAcceptedAt: profile.disclaimerAcceptedAt,
      updatedAt:           profile.updatedAt,
    };
  }

  /** Count completed sessions for a user (for session number in prompt). */
  async getSessionCount(userId: string): Promise<number> {
    return this.prisma.session.count({
      where: { userId, status: 'completed' },
    });
  }

  /**
   * Fetch the N most recent memory chunks for context injection.
   * Ordered by recency — semantic search (pgvector) is done in MemoryModule (Phase 9).
   */
  async getRecentMemories(userId: string, limit = 5): Promise<IMemoryChunk[]> {
    const rows = await this.prisma.sessionMemory.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      take:    limit,
      select:  { id: true, userId: true, sessionId: true, content: true, memoryType: true, createdAt: true },
    });

    return rows.map((r) => ({
      id:         r.id,
      userId:     r.userId,
      sessionId:  r.sessionId,
      content:    r.content,
      memoryType: r.memoryType as IMemoryChunk['memoryType'],
      createdAt:  r.createdAt,
    }));
  }
}
