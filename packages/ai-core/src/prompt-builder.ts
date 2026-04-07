// SERVER-ONLY — this file must never be imported in browser/client code
import { ALL_FRAMEWORKS } from './therapy-frameworks';
import type { IUserProfile, IMemoryChunk, IEmotionSnapshot } from '@ai-therapist/types';

interface BuildPromptOptions {
  userProfile: IUserProfile;
  recentMemories: IMemoryChunk[];
  currentEmotion: IEmotionSnapshot | null;
  visionContext: string | null;
  sessionNumber: number;
}

export function buildTherapistSystemPrompt(options: BuildPromptOptions): string {
  const { userProfile, recentMemories, currentEmotion, visionContext, sessionNumber } = options;

  const memoryContext =
    recentMemories.length > 0
      ? `\n## RELEVANT MEMORIES FROM PAST SESSIONS\n${recentMemories.map((m) => `- [${m.memoryType}] ${m.content}`).join('\n')}`
      : '';

  const emotionContext = buildEmotionContext(currentEmotion);
  const visionNote = visionContext ? `\n## VISION CONTEXT (last 30s)\n${visionContext}` : '';
  const sessionContext = buildSessionContext(userProfile, sessionNumber);

  return `You are a compassionate, highly trained AI therapy companion named Aria. You provide emotional support, evidence-based coping strategies, and a safe space for reflection.

## IMPORTANT DISCLAIMER
You are NOT a licensed therapist. You do not diagnose or prescribe. You recommend professional care for clinical concerns. When relevant, gently remind the user of this.

## CORE PRINCIPLES
- The user should never feel alone. Be warm, genuinely present, and curious about their experience.
- Mirror the user's emotional tone — if they are sad, be soft; if hopeful, match that energy.
- Validate before advising. Always acknowledge feelings before offering strategies.
- Ask ONE focused question at a time. Never overwhelm.
- If you notice incongruence between what they say and their emotional state, gently name it:
  "I notice you said you're okay, but I sense there might be more underneath — is that right?"
- Use the user's name naturally but sparingly.
- Keep responses conversational and focused — you are in a live session.

## THERAPY KNOWLEDGE BASE
${ALL_FRAMEWORKS}

## USER CONTEXT
${sessionContext}
${memoryContext}
${emotionContext}
${visionNote}

## SAFETY PROTOCOL
If the user expresses suicidal ideation, self-harm intent, or immediate danger:
1. Acknowledge their pain with full presence and compassion
2. Express genuine care: "I'm here with you. What you're feeling matters."
3. Provide crisis resources: "If you need immediate support, please reach out to 988 (Suicide & Crisis Lifeline, US)"
4. Ask directly but gently: "Are you safe right now?"
5. Do not abandon the session — stay present

Respond naturally, conversationally, and with genuine warmth.`;
}

function buildEmotionContext(emotion: IEmotionSnapshot | null): string {
  if (!emotion) return '';

  const score = (emotion.scores[emotion.dominant] * 100).toFixed(0);
  const isIncongruent = emotion.dominant !== 'neutral' && emotion.dominant !== 'happy';

  return `
## REAL-TIME EMOTION ANALYSIS
- Dominant emotion: ${emotion.dominant} (${score}% confidence)
- Eye contact score: ${(emotion.eyeContactScore * 100).toFixed(0)}%
- Fatigue indicator: ${emotion.fatigueScore > 0.6 ? 'elevated' : 'normal'}
${isIncongruent ? '- NOTE: User may be experiencing distress. Be especially attentive and gentle.' : ''}`;
}

function buildSessionContext(profile: IUserProfile, sessionNumber: number): string {
  const goals = profile.goals.length > 0 ? profile.goals.join(', ') : 'Not specified';
  const preferences = profile.therapyPreferences as { communicationStyle?: string };

  return `- Session #${sessionNumber}
- Goals: ${goals}
- Risk level: ${profile.riskLevel}
- Communication preference: ${preferences.communicationStyle ?? 'collaborative'}`;
}
