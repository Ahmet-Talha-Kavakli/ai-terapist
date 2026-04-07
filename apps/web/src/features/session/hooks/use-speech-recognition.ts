'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useSessionStore } from '../session.store';

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

// TypeScript doesn't include the Web Speech API by default
declare global {
  interface Window {
    SpeechRecognition:       SpeechRecognitionCtor | undefined;
    webkitSpeechRecognition: SpeechRecognitionCtor | undefined;
  }
}

interface UseSpeechRecognitionOptions {
  /** Called when a final (committed) transcript arrives. */
  onFinalTranscript: (text: string) => void;
  /** Language tag, e.g. "en-US" or "tr-TR". */
  lang?: string;
}

/**
 * Wraps the Web Speech API (SpeechRecognition) for continuous dictation.
 *
 * - Starts/stops automatically based on session phase + mic mute state.
 * - Sets the live interim transcript in session store (for the UI).
 * - Calls onFinalTranscript when the user stops speaking (for sending to AI).
 * - Auto-restarts on `end` event to keep continuous recognition alive.
 * - Is a no-op in browsers that don't support the API.
 */
export function useSpeechRecognition({
  onFinalTranscript,
  lang = 'en-US',
}: UseSpeechRecognitionOptions) {
  const phase       = useSessionStore((s) => s.phase);
  const setTranscript = useSessionStore((s) => s.setTranscript);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const activeRef      = useRef(false);
  const [muted, setMuted] = useState(false);

  const isSupported = useCallback(() => {
    return typeof window !== 'undefined' &&
      (window.SpeechRecognition ?? window.webkitSpeechRecognition) != null;
  }, []);

  const start = useCallback(() => {
    if (!isSupported() || activeRef.current) return;

    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition!;
    const recognition = new Ctor();
    recognitionRef.current = recognition;

    recognition.lang           = lang;
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final   = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += (result[0].transcript as string);
        } else {
          interim += (result[0].transcript as string);
        }
      }

      // Show interim in the UI
      if (interim) setTranscript(interim);

      // Only fire callback on final (committed) speech
      if (final.trim()) {
        setTranscript(final.trim());
        onFinalTranscript(final.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' is expected in quiet periods — suppress it
      if (event.error !== 'no-speech') {
        console.warn('[STT] error:', event.error);
      }
    };

    // Auto-restart so recognition doesn't stop after a pause
    recognition.onend = () => {
      activeRef.current = false;
      if (phase === 'active' && !muted) {
        // Small delay to avoid hammering on rapid end-restart cycles
        setTimeout(() => start(), 200);
      }
    };

    recognition.start();
    activeRef.current = true;
  }, [isSupported, lang, phase, muted, setTranscript, onFinalTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    activeRef.current = false;
  }, []);

  // Start/stop based on session phase
  useEffect(() => {
    if (phase === 'active' && !muted) {
      start();
    } else {
      stop();
    }
    return stop;
  }, [phase, muted, start, stop]);

  return { muted, setMuted, isSupported };
}
