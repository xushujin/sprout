import type { SoundPreferences } from '../lib/game-sound';
import { Icon } from './Icons';

export function SoundControls({
  value,
  onChange,
}: {
  value: SoundPreferences;
  onChange: (value: SoundPreferences) => void;
}) {
  return (
    <div className="sound-controls" role="group" aria-label="游戏声音">
      <button
        type="button"
        className="sound-toggle"
        aria-label="背景音乐"
        aria-pressed={value.music}
        onClick={() => onChange({ ...value, music: !value.music })}
      >
        <Icon name="music" size={18} />
        <span>音乐{value.music ? '开' : '关'}</span>
      </button>
      <button
        type="button"
        className="sound-toggle"
        aria-label="答题音效"
        aria-pressed={value.effects}
        onClick={() => onChange({ ...value, effects: !value.effects })}
      >
        <Icon name="sound" size={18} />
        <span>音效{value.effects ? '开' : '关'}</span>
      </button>
    </div>
  );
}
