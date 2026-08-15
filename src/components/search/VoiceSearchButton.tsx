// src/components/search/VoiceSearchButton.tsx
// 100% Free Browser-Native Web Speech API Voice Recognition

import React, { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';

interface SpeechRecognitionItem {
  transcript: string;
}

interface SpeechRecognitionResultList {
  [index: number]: {
    [index: number]: SpeechRecognitionItem;
  };
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface VoiceSearchButtonProps {
  onTranscript: (transcript: string) => void;
  className?: string;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onTranscript,
  className = ''
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const getRecognitionConstructor = (): SpeechRecognitionConstructor | null => {
    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return win.SpeechRecognition || win.webkitSpeechRecognition || null;
  };

  useEffect(() => {
    const SpeechRecognition = getRecognitionConstructor();
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = getRecognitionConstructor();
    if (!SpeechRecognition) {
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          onTranscript(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      id="btn-voice-search"
      type="button"
      onClick={toggleListening}
      title={isListening ? 'Arrêter l\'écoute...' : 'Recherche vocale (parlez naturellement)'}
      className={`relative p-2 rounded-xl transition-all ${
        isListening
          ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200'
          : 'text-neutral-500 hover:text-emerald-700 hover:bg-emerald-50'
      } ${className}`}
    >
      {isListening ? (
        <span className="flex items-center gap-1.5 text-xs font-semibold px-1">
          <Mic className="w-4 h-4 animate-bounce" />
          <span>Écoute...</span>
        </span>
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
};
