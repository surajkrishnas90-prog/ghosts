import { useEffect, useState } from 'react';
import { soundEngine } from '../audio/soundEngine.js';
import '../styles/audio-controller.css';

const STORAGE_KEY = 'ghosts:audio-settings';
const MIX = { masterVolume: 0.78, musicVolume: 0.58, effectsVolume: 0.58 };

function readAudioPreference() {
  try {
    return Boolean(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')?.master);
  } catch {
    return false;
  }
}

export default function AudioController({ scene = 'home' }) {
  const [requestedOn, setRequestedOn] = useState(readAudioPreference);
  const [active, setActive] = useState(() => soundEngine.active);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ master: requestedOn })); } catch { /* Storage may be disabled. */ }
    soundEngine.setPreferences({ master: requestedOn, muted: false, music: true, effects: true, ...MIX });
  }, [requestedOn]);

  useEffect(() => {
    soundEngine.setScene(scene);
  }, [scene]);

  useEffect(() => {
    const onEffect = (event) => soundEngine.playEffect(event.detail?.name);
    const onScene = (event) => soundEngine.setScene(event.detail?.scene);
    window.addEventListener('ghosts-audio-effect', onEffect);
    window.addEventListener('ghosts-audio-scene', onScene);
    return () => {
      window.removeEventListener('ghosts-audio-effect', onEffect);
      window.removeEventListener('ghosts-audio-scene', onScene);
    };
  }, []);

  async function toggleAudio() {
    setUnavailable(false);
    if (active && requestedOn) {
      setRequestedOn(false);
      return;
    }
    try {
      await soundEngine.unlock();
      setActive(true);
      setRequestedOn(true);
    } catch {
      setUnavailable(true);
      setRequestedOn(false);
    }
  }

  const playing = active && requestedOn;
  return (
    <div className="audio-dock" data-audio-playing={playing ? 'true' : 'false'}>
      <button
        className="audio-dock__toggle"
        type="button"
        aria-label={unavailable ? 'Audio unavailable; turn audio on' : `Turn audio ${playing ? 'off' : 'on'}`}
        aria-pressed={playing}
        title={unavailable ? 'Audio is unavailable in this browser' : undefined}
        onClick={toggleAudio}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10" className={playing ? '' : 'is-muted'}/></svg>
        <span>{playing ? 'AUDIO ON' : 'AUDIO OFF'}</span>
      </button>
    </div>
  );
}
