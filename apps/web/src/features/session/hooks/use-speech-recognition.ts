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

declare global {
  interface Window {
    SpeechRecognition:       SpeechRecognitionCtor | undefined;
    webkitSpeechRecognition: SpeechRecognitionCtor | undefined;
  }
}

interface UseSpeechRecognitionOptions {
  onFinalTranscript: (text: string) => void;
  lang?: string;
}

export function useSpeechRecognition({
  onFinalTranscript,
  lang = 'en-US',
}: UseSpeechRecognitionOptions) {
  const phase         = useSessionStore((s) => s.phase);
  const setTranscript = useSessionStore((s) => s.setTranscript);

  const recognitionRef           = useRef<SpeechRecognitionInstance | null>(null);
  const activeRef                = useRef(false);
  const phaseRef                 = useRef(phase);
  const [muted, setMuted]        = useState(false);
  const mutedRef                 = useRef(muted);
  const onFinalTranscriptRef     = useRef(onFinalTranscript);
  const setTranscriptRef         = useRef(setTranscript);
  // Prevents onend from auto-restarting when stop() is called intentionally
  const intentionalStopRef       = useRef(false);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { onFinalTranscriptRef.current = onFinalTranscript; }, [onFinalTranscript]);
  useEffect(() => { setTranscriptRef.current = setTranscript; }, [setTranscript]);

  const isSupported = useCallback(() => {
    return typeof window !== 'undefined' &&
      (window.SpeechRecognition ?? window.webkitSpeechRecognition) != null;
  }, []);

  const start = useCallback(() => {
    if (!isSupported() || activeRef.current) return;

    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition!;
    const recognition = new Ctor();
    recognitionRef.current = recognition;

    recognition.lang            = lang;
    recognition.continuous      = true;
    recognition.interimResults  = true;
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

      if (interim) setTranscriptRef.current(interim);

      if (final.trim()) {
        setTranscriptRef.current(final.trim());
        onFinalTranscriptRef.current(final.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('[STT] error:', event.error);
      }
    };

    recognition.onend = () => {
      activeRef.current = false;
      const wasIntentional = intentionalStopRef.current;
      intentionalStopRef.current = false;
      if (!wasIntentional && phaseRef.current === 'active' && !mutedRef.current) {
        setTimeout(() => start(), 200);
      }
    };

    recognition.start();
    activeRef.current = true;
  }, [isSupported, lang]);

  const stop = useCallback(() => {
    intentionalStopRef.current = true;
    activeRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  // Restart when phase, muted, or lang changes
  useEffect(() => {
    if (phase === 'active' && !muted) {
      start();
    } else {
      stop();
    }
    return stop;
  }, [phase, muted, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return { muted, setMuted, isSupported };
}
