'use client';

import { useState, useRef } from 'react';

interface VoiceRecorderProps {
  onResponse: (audioUrl?: string, textResponse?: string) => Promise<void>;
  isLoading: boolean;
}

export function VoiceRecorder({ onResponse, isLoading }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textResponse, setTextResponse] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        // const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        // TODO: Upload to Uploadthing and get URL
        // For now, we'll just submit as text
        await onResponse(undefined, 'Voice recording placeholder');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setShowTextInput(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const handleTextSubmit = async () => {
    if (textResponse.trim()) {
      await onResponse(undefined, textResponse.trim());
      setTextResponse('');
      setShowTextInput(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showTextInput) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-[--color-text-secondary] text-sm mb-4">
            Share your thoughts by typing:
          </p>
          <textarea
            value={textResponse}
            onChange={(e) => setTextResponse(e.target.value)}
            placeholder="What comes to mind when you think about this?"
            className="w-full p-4 border border-[--color-border] rounded-[--border-radius-lg] resize-none focus:outline-none focus:ring-2 focus:ring-[--color-primary] focus:border-transparent"
            rows={3}
            maxLength={500}
          />
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => setShowTextInput(false)}
              className="text-[--color-text-tertiary] hover:text-[--color-text-secondary] text-sm"
            >
              Try voice instead
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[--color-text-tertiary]">
                {textResponse.length}/500
              </span>
              <button
                onClick={handleTextSubmit}
                disabled={!textResponse.trim() || isLoading}
                className="px-4 py-2 bg-[--color-primary] text-white rounded-[--border-radius-md] font-medium hover:bg-[--color-primary-hover] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Submitting...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <p className="text-[--color-text-secondary] text-sm">
        {isRecording ? 'Listening...' : 'Hold the button and share your thoughts'}
      </p>

      {/* Recording Timer */}
      {isRecording && (
        <div className="flex items-center justify-center space-x-2 text-[--color-primary]">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
        </div>
      )}

      {/* Voice Recording Button */}
      <div className="relative">
        <button
          onMouseDown={!isRecording ? startRecording : undefined}
          onMouseUp={isRecording ? stopRecording : undefined}
          onTouchStart={!isRecording ? startRecording : undefined}
          onTouchEnd={isRecording ? stopRecording : undefined}
          disabled={isLoading}
          className={`
            w-20 h-20 rounded-full font-semibold transition-all duration-200 transform active:scale-95
            ${isRecording 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-[--color-primary] hover:bg-[--color-primary-hover] text-white'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {isRecording ? '🛑' : '🎤'}
        </button>
        
        {/* Ripple effect */}
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-[--color-primary] animate-ping opacity-20"></div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-[--color-text-tertiary]">
          {isRecording ? 'Release to stop' : 'Hold to record'}
        </p>
        
        <button
          onClick={() => setShowTextInput(true)}
          className="text-[--color-text-tertiary] hover:text-[--color-text-secondary] text-sm underline"
        >
          Prefer to type?
        </button>
      </div>
    </div>
  );
} 