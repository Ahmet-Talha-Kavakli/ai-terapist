import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

const SENSITIVE_RESOURCES = ['/user', '/session', '/profile', '/memory', '/crisis'];

@Injectable()
export class AuditLogMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const userId = req.headers['x-clerk-user-id'] as string | undefined;
    const isSensitive = SENSITIVE_RESOURCES.some((r) => req.path.startsWith(r));

    if (userId && isSensitive) {
      await this.prisma.auditLog.create({
        data: {
          actorId: userId,
          action: req.method,
          resource: req.path,
          ipAddress: req.ip,
        },
      });
    }

    next();
  }
}
