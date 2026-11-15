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
    render_cross_voices(kokoro, out)


def render_cross_voices(kokoro, out):
    """Each lesson's professor lines in the other professor's voice, named <voice>-from-<lesson>-...

    Synthetic sections build one lesson from steps of both lessons, so every step needs both voices.
    Student questions keep their original voice.
    """
    data = lessons()
    for key in data:
        for voice_key in VOICES:
            if voice_key == key:
                continue
            voice, speed = VOICES[voice_key]["prof"]
            for i, step in enumerate(data[key]["steps"]):
                for part in ("say", "then"):
                    for n, sentence in enumerate(sentences(step.get(part, ""))):
                        samples, rate = kokoro.create(sentence, voice=voice, speed=speed, lang="en-us")
                        sf.write(out / f"{voice_key}-from-{key}-{i}-{part}-{n}.mp3", samples, rate, format="MP3")
                        print(f"{voice_key} voice, lesson {key} step {i} {part} {n}")


COURSE_VOICES = {"f": ("af_heart", 0.98), "m": ("am_michael", 1.06)}


def render_courses(kokoro, only=None):
    """Course lessons from courses.json: every professor line in both voices, student questions in one voice.

    Files: audio/courses/<course>/<f|m>-<role>-<say|then>-<n>.mp3 and .../student-<role>-ask-<n>.mp3
    Clips that already exist are skipped, so several processes can each take one course.
    """
    courses = json.loads((HERE / "courses.json").read_text(encoding="utf-8"))
    for course_id, course in courses.items():
        if only and course_id != only:
            continue
        out = HERE / "audio" / "courses" / course_id
        out.mkdir(parents=True, exist_ok=True)
        for role, step in course["roles"].items():
            for part in ("say", "then"):
                for n, sentence in enumerate(sentences(step.get(part, ""))):
                    for gender, (voice, speed) in COURSE_VOICES.items():
                        samples, rate = kokoro.create(sentence, voice=voice, speed=speed, lang="en-us")
                        sf.write(out / f"{gender}-{role}-{part}-{n}.mp3", samples, rate, format="MP3")
            for n, sentence in enumerate(sentences(step.get("ask", ""))):
                samples, rate = kokoro.create(sentence, voice=course["studentVoice"], speed=1.05, lang="en-us")
                sf.write(out / f"student-{role}-ask-{n}.mp3", samples, rate, format="MP3")
        print(f"{course_id}: done")


if __name__ == "__main__":
    model_dir = Path(sys.argv[1])
    if len(sys.argv) > 2 and sys.argv[2] == "courses":
        only = sys.argv[3] if len(sys.argv) > 3 else None
        render_courses(Kokoro(str(model_dir / "kokoro-v1.0.onnx"), str(model_dir / "voices-v1.0.bin")), only)
    else:
        main(sys.argv[1])
