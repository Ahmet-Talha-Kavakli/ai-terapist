'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { intakeSchema, GOAL_OPTIONS, type TIntakeFormData } from '../schema';

interface IntakeFormProps {
  onSubmit: (data: TIntakeFormData) => Promise<void>;
}

export function IntakeForm({ onSubmit }: IntakeFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TIntakeFormData>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      primaryGoals: [],
      preferredSessionLength: '45',
      preferredCommunicationStyle: 'collaborative',
      previousTherapyExperience: 'none',
    },
  });

  const selectedGoals = watch('primaryGoals') ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Tell us about yourself</h2>
        <p className="mt-2 text-sm text-gray-400">
          This helps your AI therapist understand you from the very first session.
        </p>
      </div>

      {/* Goals */}
      <div>
        <label className="mb-3 block font-medium text-white">
          What are your primary goals?{' '}
          <span className="text-sm text-gray-400">(select 1–5)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_OPTIONS.map((goal) => {
            const isSelected = selectedGoals.includes(goal);
            return (
              <label
                key={goal}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                  isSelected
                    ? 'border-blue-500/50 bg-blue-950/30 text-white'
                    : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  value={goal}
                  {...register('primaryGoals')}
                  className="h-4 w-4 accent-blue-500"
                />
                <span className="text-sm">{goal}</span>
              </label>
            );
          })}
        </div>
        {errors.primaryGoals && (
          <p className="mt-2 text-sm text-red-400">{errors.primaryGoals.message}</p>
        )}
      </div>

      {/* Current challenges */}
      <div>
        <label className="mb-2 block font-medium text-white">
          What challenges are you currently facing?
        </label>
        <textarea
          {...register('currentChallenges')}
          rows={4}
          placeholder="Describe what's been on your mind lately — there are no wrong answers..."
          className="w-full rounded-xl border border-gray-700 bg-gray-900 p-4 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        {errors.currentChallenges && (
          <p className="mt-1 text-sm text-red-400">{errors.currentChallenges.message}</p>
        )}
      </div>

      {/* Previous experience */}
      <div>
        <label className="mb-2 block font-medium text-white">
          Previous therapy experience
        </label>
        <select
          {...register('previousTherapyExperience')}
          className="w-full rounded-xl border border-gray-700 bg-gray-900 p-3 text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="none">No previous experience</option>
          <option value="some">Some experience (1–5 sessions)</option>
          <option value="extensive">Extensive experience (ongoing or long-term)</option>
        </select>
      </div>

      {/* Communication style */}
      <div>
        <label className="mb-3 block font-medium text-white">
          Preferred communication style
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              value: 'gentle',
              label: 'Gentle',
              desc: 'Soft, warm, supportive',
              icon: '🌸',
            },
            {
              value: 'collaborative',
              label: 'Collaborative',
              desc: 'Explore together',
              icon: '🤝',
            },
            {
              value: 'direct',
              label: 'Direct',
              desc: 'Clear and structured',
              icon: '🎯',
            },
          ].map((style) => (
            <label
              key={style.value}
              className="flex cursor-pointer flex-col items-center rounded-xl border border-gray-700 bg-gray-900 p-4 text-center transition hover:border-gray-600 has-[:checked]:border-blue-500/50 has-[:checked]:bg-blue-950/30"
            >
              <input
                type="radio"
                value={style.value}
                {...register('preferredCommunicationStyle')}
                className="sr-only"
              />
              <span className="text-2xl">{style.icon}</span>
              <span className="mt-2 font-medium text-white">{style.label}</span>
              <span className="mt-1 text-xs text-gray-400">{style.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Session length */}
      <div>
        <label className="mb-2 block font-medium text-white">Preferred session length</label>
        <div className="flex gap-3">
          {(['30', '45', '60'] as const).map((len) => (
            <label
              key={len}
              className="flex flex-1 cursor-pointer flex-col items-center rounded-xl border border-gray-700 bg-gray-900 py-3 transition hover:border-gray-600 has-[:checked]:border-blue-500/50 has-[:checked]:bg-blue-950/30"
            >
              <input
                type="radio"
                value={len}
                {...register('preferredSessionLength')}
                className="sr-only"
              />
              <span className="text-xl font-bold text-white">{len}</span>
              <span className="text-xs text-gray-400">minutes</span>
            </label>
          ))}
        </div>
      </div>

      {/* Emergency contact (optional) */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
        <p className="mb-3 font-medium text-white">
          Emergency contact{' '}
          <span className="text-sm font-normal text-gray-400">(optional)</span>
        </p>
        <p className="mb-4 text-sm text-gray-400">
          In case of a crisis, we can notify someone you trust — only with your explicit consent
          at that moment.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input
            {...register('emergencyContactName')}
            placeholder="Contact name"
            className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          <input
            {...register('emergencyContactPhone')}
            placeholder="Phone number"
            type="tel"
            className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Begin my therapy journey →'}
      </button>
    </form>
  );
}
