import type { Word } from '../data/words';
import { gameSound } from './game-sound';
let currentAudio: HTMLAudioElement | undefined;
let playbackId = 0;

export function stopAudio() {
  playbackId++;
  currentAudio?.pause();
  window.speechSynthesis?.cancel();
  gameSound.setNarrating(false);
}

export async function speak(word: Word): Promise<boolean> {
  stopAudio();
  const id = playbackId;
  const ended = () => {
    if (id === playbackId) gameSound.setNarrating(false);
  };
  gameSound.setNarrating(true);
  // Built-in, licensed MP3s ship with Pages. No Worker/TTS/R2 request is needed.
  // TODO: add <id>.mp3 for new words; override the base only for an audio CDN.
  const base = import.meta.env.VITE_AUDIO_BASE_URL?.replace(/\/$/, '') || '/audio';
  // Reuse the element and call play() directly during the tap, for mobile Safari.
  currentAudio ??= new Audio();
  currentAudio.preload = 'auto';
  currentAudio.onended = ended;
  currentAudio.onerror = ended;
  currentAudio.src = `${base}/${encodeURIComponent(word.audioId ?? word.id)}.mp3?v=1`;
  let timer: number | undefined;
  try {
    await Promise.race([
      currentAudio.play(),
      new Promise<never>((_, reject) => {
        timer = window.setTimeout(() => reject(new Error('Audio timeout')), 8_000);
      }),
    ]);
    return true;
  } catch {
    if (id !== playbackId) return true; // A new tap or answer canceled this play.
    currentAudio.pause();
  } finally {
    window.clearTimeout(timer);
  }
  // Optional offline fallback. MP3 playback never depends on speechSynthesis.
  if (
    typeof window.speechSynthesis === 'undefined' ||
    typeof SpeechSynthesisUtterance === 'undefined'
  ) {
    ended();
    return false;
  }
  gameSound.setNarrating(true);
  const voice = new SpeechSynthesisUtterance(word.en);
  voice.lang = 'en-US';
  voice.rate = 0.8;
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      if (id === playbackId) window.speechSynthesis.cancel();
      ended();
      resolve(id !== playbackId);
    }, 5_000);
    voice.onstart = () => {
      window.clearTimeout(timeout);
      resolve(true);
    };
    voice.onerror = () => {
      window.clearTimeout(timeout);
      resolve(id !== playbackId);
      ended();
    };
    voice.onend = ended;
    try {
      window.speechSynthesis.speak(voice);
    } catch {
      window.clearTimeout(timeout);
      resolve(false);
      ended();
    }
  });
}
