export type WavRecorderControls = {
  stop: () => Promise<Blob>;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  getMimeType: () => string;
};

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

function encodeWav(buffers: Float32Array[], sampleRate: number) {
  const length = buffers.reduce((sum, b) => sum + b.length, 0);
  const pcmBytes = length * 2;

  const buffer = new ArrayBuffer(44 + pcmBytes);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmBytes, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM
  view.setUint16(20, 1, true); // audio format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, pcmBytes, true);

  let offset = 44;
  for (const chunk of buffers) {
    floatTo16BitPCM(view, offset, chunk);
    offset += chunk.length * 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Fallback recorder that works even when MediaRecorder can't start the audio source.
 * Records mono PCM and returns a WAV blob.
 */
export async function createWavRecorder(stream: MediaStream): Promise<WavRecorderControls> {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) throw new Error('AudioContext not supported');

  const audioContext: AudioContext = new AudioCtx();
  const source = audioContext.createMediaStreamSource(stream);
  // ScriptProcessor is deprecated but still the widest-supported fallback.
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  const buffers: Float32Array[] = [];
  const sampleRate = audioContext.sampleRate;
  let cancelled = false;
  let stopped = false;

  processor.onaudioprocess = (e) => {
    if (stopped || cancelled) return;
    const input = e.inputBuffer.getChannelData(0);
    buffers.push(new Float32Array(input));
  };

  source.connect(processor);
  // Some browsers require connecting to destination for processing to run.
  processor.connect(audioContext.destination);

  const cleanup = async () => {
    try {
      processor.disconnect();
    } catch {}
    try {
      source.disconnect();
    } catch {}
    try {
      await audioContext.close();
    } catch {}
  };

  return {
    getMimeType: () => 'audio/wav',
    pause: () => {
      try {
        audioContext.suspend();
      } catch {}
    },
    resume: () => {
      try {
        audioContext.resume();
      } catch {}
    },
    cancel: () => {
      cancelled = true;
      stopped = true;
      buffers.length = 0;
      void cleanup();
    },
    stop: async () => {
      stopped = true;
      await cleanup();
      if (cancelled) return new Blob([], { type: 'audio/wav' });
      return encodeWav(buffers, sampleRate);
    },
  };
}
