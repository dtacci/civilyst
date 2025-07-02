'use client';

import * as React from 'react';
import { Mic, MicOff, VolumeX } from 'lucide-react';
import { Button } from './button';
import { cn } from '~/lib/utils';

interface VoiceInputProps {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  placeholder?: string;
  className?: string;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  disabled?: boolean;
  autoStart?: boolean;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechGrammarList {
  length: number;
  item(index: number): SpeechGrammar;
  addFromURI(src: string, weight?: number): void;
  addFromString(string: string, weight?: number): void;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
  onnomatch:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function VoiceInput({
  onTranscript,
  onError,
  onStart,
  onEnd,
  placeholder = 'Tap to speak...',
  className,
  language = 'en-US',
  continuous = true,
  interimResults = true,
  maxAlternatives = 1,
  disabled = false,
  autoStart = false,
}: VoiceInputProps) {
  const [isListening, setIsListening] = React.useState(false);
  const [isSupported, setIsSupported] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [interimTranscript, setInterimTranscript] = React.useState('');
  const [audioLevel, setAudioLevel] = React.useState(0);
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animationRef = React.useRef<number | undefined>(undefined);

  // Check for speech recognition support
  React.useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;
      recognition.maxAlternatives = maxAlternatives;

      recognition.onstart = () => {
        setIsListening(true);
        startAudioVisualization().catch((error) =>
          console.error('Audio visualization failed:', error)
        );
        onStart?.();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript);
          onTranscript?.(finalTranscript, true);
        }

        setInterimTranscript(interimTranscript);
        if (interimTranscript) {
          onTranscript?.(interimTranscript, false);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMessage = `Speech recognition error: ${event.error}`;
        onError?.(errorMessage);
        console.error(errorMessage);
      };

      recognition.onend = () => {
        setIsListening(false);
        stopAudioVisualization();
        onEnd?.();
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopAudioVisualization();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    continuous,
    interimResults,
    language,
    maxAlternatives,
    onTranscript,
    onError,
    onStart,
    onEnd,
  ]);

  // Auto-start if enabled
  React.useEffect(() => {
    if (autoStart && isSupported && !disabled) {
      startListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, isSupported, disabled]);

  // Audio visualization
  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (analyserRef.current && isListening) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average =
            dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          setAudioLevel(average / 255);
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopAudioVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const startListening = () => {
    if (!isSupported || disabled || isListening) return;

    try {
      recognitionRef.current?.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      onError?.('Failed to start voice recognition');
    }
  };

  const stopListening = () => {
    if (!isListening) return;
    recognitionRef.current?.stop();
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-4 rounded-[--border-radius-lg]',
          'bg-[--color-warning-light] border-2 border-[--color-warning]',
          'text-[--color-text-primary]',
          className
        )}
      >
        <VolumeX className="h-5 w-5 text-[--color-warning]" />
        <span className="text-[--font-size-sm]">
          Voice input is not supported in this browser
        </span>
      </div>
    );
  }

  const displayText = transcript + interimTranscript || placeholder;

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 p-4 rounded-[--border-radius-lg]',
        'bg-[--color-surface-elevated] border-2 border-[--color-border]',
        'transition-all duration-[--duration-normal]',
        isListening && 'border-[--color-primary] shadow-[--shadow-elevated]',
        className
      )}
    >
      {/* Voice Input Display */}
      <div
        className={cn(
          'min-h-[48px] p-3 rounded-[--border-radius-md]',
          'bg-[--color-surface] border border-[--color-border]',
          'flex items-center',
          'text-[--font-size-base] leading-relaxed',
          !transcript && !interimTranscript && 'text-[--color-text-tertiary]',
          interimTranscript && 'italic opacity-70'
        )}
      >
        {displayText}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Main voice button */}
          <Button
            onClick={toggleListening}
            disabled={disabled}
            variant={isListening ? 'destructive' : 'default'}
            size="icon"
            className={cn(
              'relative overflow-hidden',
              isListening && 'animate-pulse'
            )}
          >
            {isListening ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}

            {/* Audio level indicator */}
            {isListening && audioLevel > 0 && (
              <div
                className="absolute inset-0 bg-[--color-accent] opacity-30 transition-all duration-[--duration-fast]"
                style={{
                  transform: `scale(${1 + audioLevel * 0.5})`,
                }}
              />
            )}
          </Button>

          {/* Audio level bars */}
          {isListening && (
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1 bg-[--color-primary] rounded-full transition-all duration-[--duration-fast]',
                    audioLevel > (i + 1) * 0.2 ? 'h-4' : 'h-2',
                    audioLevel > (i + 1) * 0.2 ? 'opacity-100' : 'opacity-30'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {transcript && (
            <Button
              onClick={clearTranscript}
              variant="ghost"
              size="sm"
              disabled={disabled}
            >
              Clear
            </Button>
          )}

          <div className="text-[--font-size-xs] text-[--color-text-tertiary]">
            {isListening ? 'Listening...' : 'Tap mic to speak'}
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-between text-[--font-size-xs] text-[--color-text-tertiary]">
        <span className="flex items-center gap-1">
          <div
            className={cn(
              'h-2 w-2 rounded-full transition-colors duration-[--duration-normal]',
              isListening
                ? 'bg-[--color-accent] animate-pulse'
                : 'bg-[--color-text-tertiary]'
            )}
          />
          {isListening ? 'Recording' : 'Ready'}
        </span>

        <span>Language: {language}</span>
      </div>
    </div>
  );
}

export default VoiceInput;
