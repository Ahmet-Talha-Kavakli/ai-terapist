import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.headers['x-clerk-user-id'] as string | undefined;

    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    return true;
  }
}
