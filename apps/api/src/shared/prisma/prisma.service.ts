import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma/client.js';

/**
 * Prisma 7 exports PrismaClient as a const (not a class declaration),
 * so we cast to a newable type before extending.
 * This preserves full type-safety on all model accessors ($transaction, .user, etc.)
 * while staying compatible with NestJS lifecycle hooks.
 */
const PrismaBase = PrismaClient as unknown as new () => PrismaClient;

@Injectable()
export class PrismaService extends PrismaBase implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
