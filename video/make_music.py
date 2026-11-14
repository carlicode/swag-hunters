#!/usr/bin/env python3
"""Música original para el video de SWAG HUNTERS, sintetizada desde cero (sin muestras ni licencias).

Estilo: electrónica minimalista a 120 BPM en La menor. Los sonidos de interfaz (toques, deslizamientos,
escrituras, la notificación) salen de out/events.json, que escribe record.mjs, para que suenen justo
cuando pasa cada cosa en pantalla.

    python3 video/make_music.py <duracion_en_segundos>      -> video/out/music.wav
"""
import array
import json
import math
import os
import random
import sys
import wave

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 48.5
N = int((DUR + 1.0) * SR)
TWO_PI = 2 * math.pi
rnd = random.Random(7)

events = json.load(open(os.path.join(HERE, 'out', 'events.json')))
when = lambda name: [e['t'] for e in events if e['n'] == name]
first = lambda name, default: next(iter(when(name)), default)

T_BEAT = first('introOut', 2.75)            # entra el ritmo cuando aparece el celular
T_SCENES = [e['t'] for e in events if e['n'] == 'scene' and e['name'][:2] in ('02', '03', '04')]
T_OUTRO = first('outro', DUR - 5.5)
T_NOTIF = first('notif', None)
BEAT = 0.5                                   # 120 BPM
STEP = BEAT / 4

drums = [0.0] * N
bass = [0.0] * N
pad = [0.0] * N
arp = [0.0] * N
fx = [0.0] * N


def put(buf, t, sig, gain=1.0):
    i = int(t * SR)
    for k, v in enumerate(sig):
        j = i + k
        if j < 0:
            continue
        if j >= N:
            break
        buf[j] += v * gain


def env_exp(n, rate):
    return [math.exp(-k / SR * rate) for k in range(n)]


def noise_hp(n):
    prev, out = 0.0, []
    for _ in range(n):
        x = rnd.random() * 2 - 1
        out.append(x - prev)
        prev = x
    return out


# ---------- voces ----------
def make_kick():
    n, ph, out = int(0.34 * SR), 0.0, []
    for k in range(n):
        t = k / SR
        ph += TWO_PI * (44 + 120 * math.exp(-t * 30)) / SR
        out.append(math.sin(ph) * math.exp(-t * 8.0))
    for k in range(int(0.003 * SR)):
        out[k] += (rnd.random() * 2 - 1) * 0.45 * (1 - k / (0.003 * SR))
    return out


def make_hat(open_=False):
    n = int((0.16 if open_ else 0.045) * SR)
    e = env_exp(n, 20 if open_ else 75)
    return [a * b for a, b in zip(noise_hp(n), e)]


def make_clap():
    n = int(0.22 * SR)
    ns = noise_hp(n)
    out = []
    for k in range(n):
        t = k / SR
        a = sum(math.exp(-(t - b) * 90) for b in (0, 0.011, 0.023) if t >= b) + 0.45 * math.exp(-t * 16)
        out.append(ns[k] * a * 0.5)
    return out


def tone(freq, dur, harmonics, decay, attack=0.004, detune=0.0):
    n, out = int(dur * SR), []
    for k in range(n):
        t = k / SR
        a = min(1.0, t / attack) * math.exp(-t * decay)
        v = 0.0
        for h, amp in harmonics:
            v += amp * math.sin(TWO_PI * freq * (1 + detune) * h * t)
        out.append(v * a)
    return out


KICK, HAT, OHAT, CLAP = make_kick(), make_hat(), make_hat(True), make_clap()
SAW5 = [(h, 1 / h ** 1.2) for h in range(1, 6)]
SQ3 = [(1, 1.0), (3, 0.33), (5, 0.2)]

# acordes (4 s cada uno): Am - F - C - G
CHORDS = [
    (55.0, [110.0, 130.81, 164.81]),
    (43.65, [87.31, 110.0, 130.81]),
    (65.41, [130.81, 164.81, 196.0]),
    (49.0, [98.0, 123.47, 146.83]),
]
chord_at = lambda t: CHORDS[int(max(0, t - T_BEAT) // 4) % 4]

# ---------- introducción: arranque + impacto ----------
put(pad, 0, tone(55.0, T_BEAT + 0.3, [(1, 1.0), (2, 0.3)], 0.0, attack=1.2), 0.20)
put(pad, 0, tone(82.4, T_BEAT + 0.3, [(1, 1.0), (3, 0.2)], 0.0, attack=1.6), 0.10)
n_riser = int(T_BEAT * SR)
ph, riser = 0.0, []
for k in range(n_riser):
    t = k / n_riser
    ph += TWO_PI * (90 * (14 ** t)) / SR
    riser.append(math.sin(ph) * (t ** 2) * 0.28)
put(fx, 0, riser)
nz = noise_hp(n_riser)
put(fx, 0, [nz[k] * (k / n_riser) ** 3 * 0.30 for k in range(n_riser)])
put(drums, T_BEAT, KICK, 1.3)
put(fx, T_BEAT, tone(41.0, 1.4, [(1, 1.0)], 3.2), 0.5)
crash = noise_hp(int(1.3 * SR))
put(fx, T_BEAT, [crash[k] * math.exp(-k / SR * 3.2) * 0.30 for k in range(len(crash))])

# ---------- ritmo ----------
kick_times = []
t, i = T_BEAT, 0
while t < T_OUTRO - 0.01:
    beat_in_bar = i % 4
    put(drums, t, KICK, 1.0)
    kick_times.append(t)
    put(drums, t + BEAT / 2, OHAT if beat_in_bar % 2 == 1 else HAT, 0.30)       # hat a contratiempo
    if t >= T_SCENES[0] and beat_in_bar in (1, 3):
        put(drums, t, CLAP, 0.55)                                                # entra el clap en la escena 2
    if t >= T_SCENES[1]:
        for s in (1, 3):
            put(drums, t + s * STEP, HAT, 0.14)                                  # hats en semicorcheas desde la escena 3
    root, chord = chord_at(t)
    put(bass, t + BEAT / 2, tone(root, 0.3, SAW5, 7.5, attack=0.003), 0.55)      # bajo a contratiempo
    if t >= T_SCENES[0]:                                                         # arpegio desde la escena 2
        order = [0, 2, 1, 2]
        for s in range(4):
            f = chord[order[s]] * 2 * (2 if (i + s) % 8 == 7 else 1)
            put(arp, t + s * STEP, tone(f, 0.17, SQ3, 20, attack=0.002), 0.20)
    t += BEAT
    i += 1

# pad con los acordes desde la escena 3
t = T_SCENES[1]
while t < T_OUTRO:
    _, chord = chord_at(t)
    for f in chord:
        put(pad, t, tone(f, 4.4, [(1, 1.0), (2, 0.25), (3, 0.1)], 0.35, attack=0.5, detune=0.003), 0.11)
        put(pad, t, tone(f, 4.4, [(1, 1.0), (2, 0.25)], 0.35, attack=0.5, detune=-0.003), 0.08)
    t += 4.0

# ---------- sonidos de interfaz sincronizados ----------
for tt in when('tap'):
    put(fx, tt, tone(1500, 0.05, [(1, 1.0)], 70, attack=0.001), 0.34)
    put(fx, tt, tone(700, 0.07, [(1, 1.0)], 50, attack=0.001), 0.20)
for tt in when('swipe'):
    n = int(0.42 * SR)
    ns, lp, out = [rnd.random() * 2 - 1 for _ in range(n)], 0.0, []
    for k in range(n):
        x = k / n
        a = 0.08 + 0.55 * x                       # el filtro se abre: whoosh que sube
        lp += a * (ns[k] - lp)
        out.append(lp * math.sin(math.pi * x) ** 1.5 * 1.3)
    put(fx, tt - 0.40, out, 0.55)
for tt in when('write'):
    put(fx, tt, tone(880, 0.07, [(1, 1.0)], 40, attack=0.002), 0.20)
    put(fx, tt + 0.07, tone(1320, 0.10, [(1, 1.0)], 30, attack=0.002), 0.20)
for e in events:
    if e['n'] == 'type':
        for c in range(e['chars']):
            tk = e['t'] + c * e['delay'] / (1000 if e['delay'] > 1 else 1)
            put(fx, tk, [x * math.exp(-k / SR * 400) for k, x in enumerate(noise_hp(int(0.012 * SR)))], 0.5)
            put(fx, tk, tone(2600, 0.012, [(1, 1.0)], 200, attack=0.0005), 0.10)
for c in range(11):                               # "swag.hunt()" se escribe al arrancar
    tk = 0.25 + c * 0.07
    put(fx, tk, [x * math.exp(-k / SR * 400) for k, x in enumerate(noise_hp(int(0.012 * SR)))], 0.5)
    put(fx, tk, tone(2600, 0.012, [(1, 1.0)], 200, attack=0.0005), 0.10)
for tt in when('upload'):
    for k, f in enumerate((1568, 2093, 2637)):
        put(fx, tt + k * 0.07, tone(f, 0.18, [(1, 1.0), (2, 0.3)], 18, attack=0.002), 0.16)
if T_NOTIF is not None:                           # el "ding" del correo
    for k, f in enumerate((1318.5, 1975.5)):
        put(fx, T_NOTIF + k * 0.16, tone(f, 1.1, [(1, 1.0), (2.76, 0.25), (5.4, 0.1)], 4.5, attack=0.002), 0.30)

# ---------- cierre ----------
put(drums, T_OUTRO, KICK, 1.3)
put(fx, T_OUTRO, tone(41.0, 1.6, [(1, 1.0)], 3.0), 0.5)
crash = noise_hp(int(1.6 * SR))
put(fx, T_OUTRO, [crash[k] * math.exp(-k / SR * 2.6) * 0.28 for k in range(len(crash))])
for f in (110.0, 130.81, 164.81, 220.0):
    put(pad, T_OUTRO, tone(f, DUR - T_OUTRO + 0.6, [(1, 1.0), (2, 0.3), (3, 0.1)], 0.15, attack=0.35), 0.13)
put(bass, T_OUTRO, tone(55.0, DUR - T_OUTRO + 0.6, [(1, 1.0), (2, 0.2)], 0.4, attack=0.01), 0.35)
for k, f in enumerate((880, 1046.5, 1318.5, 1568, 1760, 2093)):    # una nota por cada "chip" de la arquitectura
    put(fx, T_OUTRO + 1.08 + k * 0.23, tone(f, 0.35, [(1, 1.0), (2, 0.2)], 11, attack=0.002), 0.20)
put(fx, T_OUTRO + 0.5, tone(110, 0.5, [(1, 1.0)], 7, attack=0.002), 0.4)
put(fx, T_OUTRO + 2.58, tone(1976, 0.5, [(1, 1.0), (2, 0.3)], 8, attack=0.002), 0.22)

# ---------- mezcla: sidechain, eco del arpegio, estéreo y limitador ----------
duck = [1.0] * N
for tk in kick_times + [T_OUTRO]:
    i0 = int(tk * SR)
    for k in range(int(0.45 * SR)):
        j = i0 + k
        if j >= N:
            break
        d = 1 - 0.72 * math.exp(-k / SR * 9)
        if d < duck[j]:
            duck[j] = d
if T_NOTIF is not None:                           # la música baja un poco para que se oiga la notificación
    i0 = int((T_NOTIF - 0.05) * SR)
    for k in range(int(1.0 * SR)):
        j = i0 + k
        if j < N:
            duck[j] = min(duck[j], 0.55 + 0.45 * min(1, k / (0.8 * SR)))


def echo(src, delay, fb, mix_):
    d, out = int(delay * SR), src[:]
    for j in range(d, N):
        out[j] += out[j - d] * fb
    return [o * mix_ + s * (1 - mix_) for o, s in zip(out, src)]


arp_l, arp_r = echo(arp, 0.375, 0.42, 0.6), echo(arp, 0.25, 0.38, 0.6)
L, R = array.array('h'), array.array('h')
fade_out = 1.4
peak = 0.0
mixed = []
for j in range(int(DUR * SR)):
    base = drums[j] + (bass[j] + pad[j]) * duck[j] + fx[j]
    l, r = base + arp_l[j] * duck[j], base + arp_r[j] * duck[j]
    t = j / SR
    g = min(1.0, t / 0.03) * (1.0 if t < DUR - fade_out else max(0.0, (DUR - t) / fade_out))
    l, r = math.tanh(l * 1.15) * g, math.tanh(r * 1.15) * g
    mixed.append((l, r))
    peak = max(peak, abs(l), abs(r))
scale = 0.89 / peak if peak else 1
out = array.array('h')
for l, r in mixed:
    out.append(int(l * scale * 32767))
    out.append(int(r * scale * 32767))
path = os.path.join(HERE, 'out', 'music.wav')
with wave.open(path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
print(f'music.wav listo: {DUR:.1f}s · eventos usados: toques={len(when("tap"))} deslizamientos={len(when("swipe"))} '
      f'escrituras={len(when("write"))} notif={T_NOTIF} · ritmo desde {T_BEAT:.2f}s, cierre en {T_OUTRO:.2f}s')
