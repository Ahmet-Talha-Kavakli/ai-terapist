import { Inngest } from 'inngest';

/**
 * Shared Inngest client for this application.
 * All functions must be created from this single instance.
 *
 * Event schema is intentionally loose for MVP — tighten with
 * EventSchemas once event names are stable.
 */
export const inngest = new Inngest({ id: 'ai-therapist' });
