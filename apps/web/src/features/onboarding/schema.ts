import { z } from 'zod';

export const GOAL_OPTIONS = [
  'Manage anxiety',
  'Cope with depression',
  'Improve relationships',
  'Work through trauma',
  'Build self-confidence',
  'Stress management',
  'Personal growth',
  'Grief support',
  'Sleep improvement',
  'Anger management',
] as const;

export const intakeSchema = z.object({
  primaryGoals: z
    .array(z.string())
    .min(1, 'Please select at least one goal')
    .max(5, 'Select up to 5 goals'),

  currentChallenges: z
    .string()
    .min(10, 'Please describe your challenges in a few words')
    .max(1000, 'Please keep this under 1000 characters'),

  previousTherapyExperience: z.enum(['none', 'some', 'extensive'], {
    error: 'Please select your experience level',
  }),

  currentMedications: z.string().max(500).optional(),

  emergencyContactName: z.string().max(100).optional(),

  emergencyContactPhone: z.string().max(20).optional(),

  preferredSessionLength: z.enum(['30', '45', '60'], {
    error: 'Please select a session length',
  }),

  preferredCommunicationStyle: z.enum(['direct', 'gentle', 'collaborative'], {
    error: 'Please select a communication style',
  }),
});

export type TIntakeFormData = z.infer<typeof intakeSchema>;
