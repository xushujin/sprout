"""Offline-only Piper synthesis. Assets are checked in; never run in a Worker."""
import argparse
import json
import subprocess
import wave
from pathlib import Path
from piper import PiperVoice, SynthesisConfig

parser = argparse.ArgumentParser()
parser.add_argument('--model', required=True)
parser.add_argument('--limit', type=int)
parser.add_argument('--reencode', action='store_true')
args = parser.parse_args()
words = json.loads(Path('.wrangler/vocabulary-audio-input.json').read_text())
pending = [word for word in words if not Path(f"public/audio/{word['id']}.mp3").exists()
           or (args.reencode and Path(f".wrangler/tts/{word['id']}.wav").exists())]
if args.limit:
    pending = pending[:args.limit]
voice = PiperVoice.load(args.model)
config = SynthesisConfig(length_scale=1.12, noise_scale=0.4, noise_w_scale=0.5)
scratch = Path('.wrangler/tts')
scratch.mkdir(parents=True, exist_ok=True)
for index, word in enumerate(pending, 1):
    output = Path(f"public/audio/{word['id']}.mp3")
    raw = scratch / f"{word['id']}.wav"
    if not raw.exists():
        with wave.open(str(raw), 'wb') as wav:
            voice.synthesize_wav(word.get('spoken', word['en']) + '.', wav, syn_config=config)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(raw),
                    '-map_metadata', '-1', '-ac', '1', '-ar', '44100', '-af', 'adelay=80,apad=pad_dur=0.12,loudnorm=I=-18:TP=-2:LRA=7',
                    '-codec:a', 'libmp3lame', '-b:a', '64k', str(output)], check=True)
    if output.stat().st_size < 1000:
        raise RuntimeError(f"Empty audio: {word['id']}")
    if index % 20 == 0 or index == len(pending):
        print(f'Generated {index}/{len(pending)}: {word["en"]}', flush=True)
print(f'Complete: {len(pending)} new MP3 files.', flush=True)
