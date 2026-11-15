"""Renders every lesson line in index.html to speech with Kokoro, an open-weight neural TTS model.

Each sentence becomes its own file (audio/voice/<section>-<step>-<part>-<n>.mp3) so the 3D scene can
start gestures and captions exactly when a sentence starts. Sentences are split with the same rule the
page uses: /[^.!?]+[.!?]*/g.

Setup (once):  pip install kokoro-onnx soundfile
               download kokoro-v1.0.onnx and voices-v1.0.bin from
               https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
Run:           python render_voices.py <folder with the two model files>
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = Path(__file__).parent
VOICES = {
    "A": {"prof": ("am_michael", 1.06), "student": ("af_bella", 1.05)},
    "B": {"prof": ("af_heart", 0.98), "student": ("am_puck", 1.05)},
}
SENTENCE = re.compile(r"[^.!?]+[.!?]*")


def lessons():
    html = (HERE / "index.html").read_text(encoding="utf-8")
    block = re.search(r'<script type="application/json" id="lessons">(.*?)</script>', html, re.S)
    return json.loads(block.group(1))


def sentences(text):
    return [s.strip() for s in SENTENCE.findall(text) if s.strip()]


def main(model_dir):
    kokoro = Kokoro(str(Path(model_dir) / "kokoro-v1.0.onnx"), str(Path(model_dir) / "voices-v1.0.bin"))
    out = HERE / "audio" / "voice"
    out.mkdir(parents=True, exist_ok=True)
    for key, lesson in lessons().items():
        full = []
        for i, step in enumerate(lesson["steps"]):
            for part, who in (("ask", "student"), ("say", "prof"), ("then", "prof")):
                if not step.get(part):
                    continue
                voice, speed = VOICES[key][who]
                for n, sentence in enumerate(sentences(step[part])):
                    samples, rate = kokoro.create(sentence, voice=voice, speed=speed, lang="en-us")
                    sf.write(out / f"{key}-{i}-{part}-{n}.mp3", samples, rate, format="MP3")
                    full.append(samples)
                    full.append(np.zeros(int(rate * 0.35), dtype=samples.dtype))
                    print(f"{key} step {i} {part} {n}: {sentence[:60]}")
        sf.write(HERE / "audio" / f"lesson-{key.lower()}.mp3", np.concatenate(full), rate, format="MP3")


if __name__ == "__main__":
    main(sys.argv[1])
