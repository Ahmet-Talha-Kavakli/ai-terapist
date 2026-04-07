import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { serve } from 'inngest/express';
import { inngest } from './inngest.client.js';
import { postSessionJob } from './post-session.job.js';

const handler = serve({
  client:    inngest,
  functions: [postSessionJob],
});

/**
 * Exposes the Inngest serve handler at GET|POST /api/inngest.
 * Inngest's cloud sends POST requests to trigger functions and
 * GET requests to register the function manifest.
 *
 * Set INNGEST_SIGNING_KEY in production to verify request signatures.
 */
@Controller('api/inngest')
export class InngestController {
  @All()
  async handle(@Req() req: Request, @Res() res: Response) {
    return handler(req, res);
  }
}
