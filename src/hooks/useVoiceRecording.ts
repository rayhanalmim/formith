import { useState, useRef, useCallback, useEffect } from 'react';
import { createWavRecorder, type WavRecorderControls } from '@/lib/audio/wav-recorder';

export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  errorAr: string | null;
}

export interface UseVoiceRecordingReturn extends VoiceRecordingState {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;
  getAudioFile: () => File | null;
}

const MAX_DURATION = 300; // 5 minutes max

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
    errorAr: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wavRecorderRef = useRef<WavRecorderControls | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const isStartingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    if (wavRecorderRef.current) {
      wavRecorderRef.current.cancel();
      wavRecorderRef.current = null;
    }
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
  }, [state.audioUrl]);

  const requestMicStream = useCallback(async () => {
    // Most compatible path: request a plain audio stream first.
    // Then try to apply "nice-to-have" constraints (some browsers/devices fail when requesting them up-front).
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const track = stream.getAudioTracks?.()?.[0];
    if (track?.applyConstraints) {
      try {
        await track.applyConstraints({
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } as MediaTrackConstraints);
      } catch {
        // Ignore: keep working stream even if constraints can't be applied.
      }
    }

    return stream;
  }, []);

  const startRecording = useCallback(async () => {
    if (isStartingRef.current || state.isRecording) return;
    isStartingRef.current = true;

    try {
      // Ensure any prior session is fully released (some browsers need a tiny delay)
      cleanup();
      chunksRef.current = [];
      pausedDurationRef.current = 0;
      await sleep(150);

      // Request microphone access (retry once on transient NotReadableError)
      let stream: MediaStream;
      try {
        stream = await requestMicStream();
      } catch (err: any) {
        if (err?.name === 'NotReadableError') {
          await sleep(400);
          stream = await requestMicStream();
        } else {
          throw err;
        }
      }

      streamRef.current = stream;

      // Determine best audio format (and gracefully fallback if constructor rejects mimeType)
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      const supported = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t));
      const mimeType = supported || '';

      console.log('Voice recording using codec:', mimeType || '(browser default)');

      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = mimeType
          ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 })
          : new MediaRecorder(stream);
      } catch {
        // Some browsers (notably mobile Safari) are picky about mimeType.
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const finalType = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: finalType });
        const audioUrl = URL.createObjectURL(audioBlob);

        setState((prev) => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioBlob,
          audioUrl,
        }));

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.onerror = () => {
        setState((prev) => ({
          ...prev,
          error: 'Recording error occurred',
          errorAr: prev.errorAr,
          isRecording: false,
        }));
        cleanup();
      };

      try {
        mediaRecorder.start(1000); // Capture in 1-second chunks
      } catch (err: any) {
        // On some devices this can throw NotReadableError: "Could not start audio source"
        if (err?.name === 'NotReadableError') {
          cleanup();
          await sleep(400);
          try {
            const retryStream = await requestMicStream();
            streamRef.current = retryStream;
            mediaRecorder = new MediaRecorder(retryStream);
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            mediaRecorder.onstop = () => {
              const finalType = mediaRecorder.mimeType || 'audio/webm';
              const audioBlob = new Blob(chunksRef.current, { type: finalType });
              const audioUrl = URL.createObjectURL(audioBlob);
              setState((prev) => ({ ...prev, isRecording: false, isPaused: false, audioBlob, audioUrl }));
              if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
            };
            mediaRecorder.start(1000);
          } catch {
            // Final fallback: WebAudio WAV recorder (works where MediaRecorder can't start).
            const fallbackStream = streamRef.current || (await requestMicStream());
            streamRef.current = fallbackStream;
            wavRecorderRef.current = await createWavRecorder(fallbackStream);
          }
        } else {
          throw err;
        }
      }

      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const currentDuration = Math.floor((Date.now() - startTimeRef.current + pausedDurationRef.current) / 1000);

        if (currentDuration >= MAX_DURATION) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // Avoid referencing stopRecording before declaration.
          if (mediaRecorderRef.current) {
            try {
              mediaRecorderRef.current.stop();
            } catch {
              // ignore
            }
          }
        } else {
          setState((prev) => ({
            ...prev,
            duration: currentDuration,
          }));
        }
      }, 100);

      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        audioUrl: null,
        error: null,
        errorAr: null,
      });

    } catch (error: any) {
      console.error('Failed to start recording:', error);
      let errorMessage = 'Could not access microphone';
      let errorMessageAr = 'تعذر الوصول إلى الميكروفون';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
        errorMessageAr = 'تم رفض إذن الميكروفون. يرجى السماح بالوصول إلى الميكروفون في إعدادات المتصفح.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
        errorMessageAr = 'لم يتم العثور على ميكروفون. يرجى توصيل ميكروفون والمحاولة مرة أخرى.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is in use by another application or unavailable. Please close other apps using the microphone.';
        errorMessageAr = 'الميكروفون قيد الاستخدام من قبل تطبيق آخر أو غير متاح. يرجى إغلاق التطبيقات الأخرى التي تستخدم الميكروفون.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Microphone does not support the required settings. Trying with default settings...';
        errorMessageAr = 'الميكروفون لا يدعم الإعدادات المطلوبة. جاري المحاولة بالإعدادات الافتراضية...';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Microphone access blocked due to security settings.';
        errorMessageAr = 'تم حظر الوصول إلى الميكروفون بسبب إعدادات الأمان.';
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        errorAr: errorMessageAr,
        isRecording: false,
      }));

    } finally {
      isStartingRef.current = false;
    }
  }, [cleanup, requestMicStream, state.isRecording]);

  const stopRecording = useCallback(() => {
    if (!state.isRecording) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // WebAudio fallback
    if (wavRecorderRef.current) {
      const recorder = wavRecorderRef.current;
      wavRecorderRef.current = null;
      recorder
        .stop()
        .then((blob) => {
          if (!blob || blob.size === 0) return;
          const audioUrl = URL.createObjectURL(blob);
          setState((prev) => ({
            ...prev,
            isRecording: false,
            isPaused: false,
            audioBlob: blob,
            audioUrl,
          }));
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
          }
        })
        .catch(() => {
          setState((prev) => ({ ...prev, isRecording: false }));
          cleanup();
        });
      return;
    }

    if (mediaRecorderRef.current) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      mediaRecorderRef.current.stop();
    }
  }, [state.isRecording, cleanup]);

  const pauseRecording = useCallback(() => {
    if (wavRecorderRef.current && state.isRecording && !state.isPaused) {
      wavRecorderRef.current.pause();
      pausedDurationRef.current += Date.now() - startTimeRef.current;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setState((prev) => ({ ...prev, isPaused: true }));
      return;
    }
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      pausedDurationRef.current += Date.now() - startTimeRef.current;
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setState(prev => ({
        ...prev,
        isPaused: true,
      }));
    }
  }, [state.isRecording, state.isPaused]);

  const resumeRecording = useCallback(() => {
    if (wavRecorderRef.current && state.isRecording && state.isPaused) {
      wavRecorderRef.current.resume();
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const currentDuration = Math.floor(
          (Date.now() - startTimeRef.current + pausedDurationRef.current) / 1000
        );

        if (currentDuration >= MAX_DURATION) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          try {
            wavRecorderRef.current?.stop();
          } catch {}
        } else {
          setState((prev) => ({
            ...prev,
            duration: currentDuration,
          }));
        }
      }, 100);

      setState((prev) => ({ ...prev, isPaused: false }));
      return;
    }
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const currentDuration = Math.floor(
          (Date.now() - startTimeRef.current + pausedDurationRef.current) / 1000
        );
        
        if (currentDuration >= MAX_DURATION) {
          stopRecording();
        } else {
          setState(prev => ({
            ...prev,
            duration: currentDuration,
          }));
        }
      }, 100);

      setState(prev => ({
        ...prev,
        isPaused: false,
      }));
    }
  }, [state.isRecording, state.isPaused, stopRecording]);

  const cancelRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (wavRecorderRef.current) {
      wavRecorderRef.current.cancel();
      wavRecorderRef.current = null;
    } else if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }

    cleanup();
    chunksRef.current = [];

    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      error: null,
      errorAr: null,
    });
  }, [state.isRecording, cleanup]);

  const getAudioFile = useCallback((): File | null => {
    if (!state.audioBlob) return null;

    const extension = state.audioBlob.type.includes('webm') ? 'webm' : 
                      state.audioBlob.type.includes('ogg') ? 'ogg' : 'mp4';
    
    return new File(
      [state.audioBlob],
      `voice-message-${Date.now()}.${extension}`,
      { type: state.audioBlob.type }
    );
  }, [state.audioBlob]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    getAudioFile,
  };
}

/**
 * Format duration in MM:SS format
 */
export function formatVoiceDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
