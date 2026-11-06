# Turns our 16-bit tracks into BeepBox songs (.json), to open in BeepBox: File > Import JSON.
# Usage, from this folder:  python3 to_beepbox.py            (all of them, into beepbox/)
#                           python3 to_beepbox.py Yoon Tou   (just those)
# It runs each composition with a "recorder" in place of the synth: instead of making sound, every note
# is written down (when, which instrument, which pitch, how long), then laid out in BeepBox's bars,
# channels and patterns. BeepBox has its own simple instruments, so it sounds chippier than our renders.
import sys, os, json, runpy, importlib
from collections import defaultdict
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np

# name: (script, function in it (party16, inside16, night16, shrine16, jingles16) or None, seconds per BeepBox beat, beats per bar, ticks per beat)
SONGS = {
    'Island':           ('island16.py', None, 60 / 108, 4, 4),
    'Zonfahare':        ('zonfahare16.py', None, 60 / 112, 4, 4),
    'Laurel_Forest':    ('laurel_forest16.py', None, 60 / 88, 4, 4),
    'Alpine_Forest':    ('alpine_forest16.py', None, 60 / 66, 4, 4),
    'Grasslands':       ('grasslands16.py', None, 60 / 80, 4, 4),
    'Grief':            ('grief16.py', None, 60 / 58, 4, 4),
    'Salt_Marsh':       ('salt_marsh16.py', None, 60 / 70, 4, 4),
    'Mansehare':        ('mansehare16.py', None, 60 / 96, 4, 4),
    'Aguerekeu':        ('aguerekeu16.py', None, 60 / 96, 4, 4),
    'Boss_Parl':        ('boss_parl16.py', None, 60 / 112, 4, 3),         # 12/8: a beat is a dotted quarter
    'Hag_Roost':        ('hag_roost16.py', None, 60 / 66, 3, 4),
    'Zonfahare_Inside': ('inside16.py', 'zonfahare', 60 / 84, 4, 4),
    'Mansehare_Inside': ('inside16.py', 'mansehare', 60 / 84, 4, 4),
    'Aguerekeu_Inside': ('inside16.py', 'aguerekeu', 60 / 80, 4, 4),
    'Shrine':           ('shrine16.py', 'shrine', 60 / 60, 4, 4),
    'Island_Chant':     ('shrine16.py', 'chant_track', 60 / 76, 4, 4),
    'Dread':            ('dread16.py', None, 60 / 50, 4, 4),
    'Battle_Ancients':  ('battle_ancients16.py', None, 60 / 168, 3, 4),
    'Defeat_Isle':      ('jingles16.py', 'defeat', 60 / 66, 4, 4),
    'Rest_Isle':        ('jingles16.py', 'rest', 60 / 72, 4, 4),
    'Item_Isle':        ('jingles16.py', 'item', 60 / 120, 4, 4),
    'Save_Isle':        ('jingles16.py', 'save', 60 / 84, 4, 4),
    'Ritual':           ('ritual16.py', None, 60 / 76, 4, 4),
    'Mystery':          ('mystery16.py', None, 60 / 96, 4, 4),
    'Campfire':         ('campfire16.py', None, 60 / 56, 4, 3),           # 6/8: a beat is a dotted quarter
    'Ladys_Table':      ('ladys_table16.py', None, 60 / 132, 4, 4),       # 2/4: a BeepBox bar is two
    'Warrens':          ('warrens16.py', None, 60 / 84, 3, 4),
    'Recognition':      ('recognition16.py', None, 60 / 66, 4, 4),
    'Sneaking':         ('sneaking16.py', None, 60 / 108, 4, 4),
    'Wells':            ('wells16.py', None, 60 / 72, 3, 4),
    'Forbidden_Lore':   ('forbidden_lore16.py', None, 60 / 60, 4, 4),
    'Hunt':             ('hunt16.py', None, 60 / 72, 4, 4),
    'Zonfahare_Night':  ('night16.py', 'zonfahare', 60 / 72, 4, 4),
    'Mansehare_Night':  ('night16.py', 'mansehare', 60 / 66, 4, 4),
    'Aguerekeu_Night':  ('night16.py', 'aguerekeu', 60 / 70, 4, 4),
    'Laurel_Forest_Night': ('night16.py', 'laurel', 60 / 66, 4, 4),
    'Grasslands_Night': ('night16.py', 'grasslands', 60 / 66, 4, 4),
    'Salt_Marsh_Night': ('night16.py', 'marsh_night', 60 / 60, 4, 4),
    'Title':            ('title16.py', None, 60 / 76, 4, 4),
    'Prologue':         ('prologue16.py', None, 60 / 66, 4, 4),
    'Lava_Tubes':       ('lava_tubes16.py', None, 60 / 60, 4, 4),
    'Yoon':             ('yoon_full16.py', None, 60 / 100, 4, 4),
    'Sib':              ('sib_alone16.py', None, 60 / 96, 4, 4),
    'Yoon_and_Sib':     ('yoon_and_sib16.py', None, 60 / 92, 4, 4),
    'Pada':             ('pada16.py', None, 60 / 76, 4, 4),
    'Thenmy':           ('thenmy16.py', None, 60 / 84, 4, 4),
    'Seafarers':        ('seafarer16.py', None, 60 / 104, 4, 4),
    'Meneswa':          ('meneswa16.py', None, 60 / 66, 3, 4),
    'Battle_Wild':      ('battle_wild16.py', None, 60 / 150, 4, 4),
    'Battle_Spirits':   ('battle_spirits16.py', None, 60 / 264, 7, 4),     # 7/8: one BeepBox beat = an eighth
    'Battle_Seafarers': ('battle_seafarer16.py', None, 60 / 156, 4, 4),
    'Boss_Great_Boar':  ('boss_great_boar16.py', None, 60 / 300, 8, 4),    # 4/4 and 7/8 mixed: beats are eighths
    'Victory_Isle':     ('victory16.py', None, 60 / 140, 4, 4),
    'Lasa':             ('party16.py', 'lasa', 0.6, 4, 3),                  # 6/8: a beat is a dotted quarter
    'Juda':             ('party16.py', 'juda', 60 / 66, 4, 4),
    'Juda_Corrupted':   ('party16.py', 'juda_corrupted', 60 / 58, 4, 4),
    'Dama':             ('party16.py', 'dama', 60 / 92, 4, 4),
    'Parl':             ('party16.py', 'parl', 0.57, 4, 3),                 # 6/8
    'Tou':              ('party16.py', 'tou', 60 / 84, 3, 4),
    'Falmi':            ('party16.py', 'falmi', 60 / 128, 4, 4),
    'Patience':         ('party16.py', 'patience', 60 / 116, 4, 4),
    'Aday':             ('party16.py', 'aday', 60 / 112, 4, 4),
    'Kathrout':         ('party16.py', 'kathrout', 60 / 124, 4, 4),
}

# Our instruments as BeepBox instruments (BeepBox's own chip waves and envelopes).
def inst(wave, vol=100, decay=None, fade_in=0.0, fade_out=-1, unison='none', vibrato=None, pan=0):
    o = {'type': 'chip', 'volume': vol, 'wave': wave, 'unison': unison, 'transition': 'normal',
         'fadeInSeconds': fade_in, 'fadeOutTicks': fade_out, 'chord': 'simultaneous',
         'effects': ['chord type', 'reverb'] + (['vibrato'] if vibrato else []) + (['panning'] if pan else []),
         'reverb': 25, 'pan': pan,
         'envelopes': [{'target': 'noteVolume', 'envelope': decay}] if decay else []}
    if vibrato: o['vibrato'] = vibrato
    return o

VOICES = {
    'marimba':   inst('triangle', decay='decay 2'),
    'kalimba':   inst('rounded', 80, decay='decay 1'),
    'flute':     inst('triangle', 100, fade_in=0.04, fade_out=6, vibrato='delayed'),
    'strings':   inst('sawtooth', 60, fade_in=0.15, fade_out=48, unison='hum'),
    'slapbass':  inst('1/4 pulse', 100, decay='decay 3'),
    'pluckbass': inst('triangle', 100, decay='decay 3'),
    'bell':      inst('rounded', 60, decay='decay 3', unison='shimmer'),
    'brass':     inst('sawtooth', 80, fade_in=0.02, fade_out=6, vibrato='delayed'),
    'harp':      inst('triangle', 80, decay='decay 2', unison='piano'),
    'timpani':   inst('triangle', 100, decay='decay 2'),
    'organ':     inst('square', 60, fade_in=0.02, fade_out=12, unison='octave'),
    'choir':     inst('rounded', 60, fade_in=0.3, fade_out=48, unison='hum', vibrato='light'),
    'stab':      inst('sawtooth', 80, decay='decay 1', unison='hum'),
}
PITCHED = list(VOICES)
# Drums: BeepBox noise channels; the number is the noise "pitch" (0 low .. 11 high).
DRUMS = {'kick': ('low', 1), 'tom': ('low', 4), 'tomhi': ('low', 6), 'log': ('wood', 9),
         'snare': ('snare', 6), 'clap': ('snare', 8), 'shaker': ('high', 11), 'cymbal': ('high', 9)}
DRUM_CHANNELS = {'low': ('retro', 'decay 2'), 'wood': ('clang', 'decay 1'),
                 'snare': ('white', 'decay 2'), 'high': ('white', 'decay 1')}

# ---------------------------------------------------------------- the recorder
class Hit:
    def __init__(self, voice, m, dur, vol): self.parts = [(voice, m, dur, vol)]
    def __len__(self): return 1
    def __getitem__(self, k):                        # sig[:n] cuts the note to n samples
        h = Hit(None, None, 0, 0); stop = k.stop if isinstance(k, slice) else None
        h.parts = [(v, m, min(d, stop / 44100) if stop else d, vol) for v, m, d, vol in self.parts]; return h
    def __mul__(self, k):
        h = Hit(None, None, 0, 0); h.parts = [(v, m, d, vol * k) for v, m, d, vol in self.parts]; return h
    __rmul__ = __mul__
    def __add__(self, other):
        h = Hit(None, None, 0, 0); h.parts = self.parts + (other.parts if isinstance(other, Hit) else []); return h
    __radd__ = __add__

class Tape:
    def __init__(self, owner): self.owner = owner
    def __getitem__(self, k): return self

class Recorder:
    last = None
    def __init__(self, seconds):
        self.events = []; self.loop = None; self.path = None
        self.L = Tape(self); self.R = Tape(self); Recorder.last = self
    def add(self, at, sig, vol=1.0, pan=0.0):
        if isinstance(sig, Hit):
            for v, m, d, vv in sig.parts: self.events.append((at, v, m, d, vv * vol))

def owner(x):
    return x.owner if isinstance(x, Tape) else Recorder.last

def install():
    s16 = importlib.import_module('synth16')
    for name in PITCHED:
        setattr(s16, name, (lambda n: lambda m, dur, vol=1.0: Hit(n, m, dur, vol))(name))
    s16.timpani = lambda m, vol=1.0: Hit('timpani', m, 0.5, vol)
    s16.drum = lambda kind, vol=1.0: Hit('drum', kind, 0.1, vol)
    s16.cymbal = lambda vol=1.0, dur=1.5: Hit('drum', 'cymbal', 0.1, vol)
    s16.Stereo = Recorder
    s16.snes_master = lambda L, R, **kw: (L, R)
    def finish_loop(L, R, start_s, end_s): owner(L).loop = (start_s, end_s); return L, R, (0, 1)
    def save_stereo(L, R, path, loop=None, preview=None, gain=1.0): owner(L).path = path
    def save_me(L, R, path): owner(L).path = path
    s16.finish_loop, s16.save_stereo, s16.save_me = finish_loop, save_stereo, save_me
    pad = np.pad
    np.pad = lambda x, *a, **k: x if isinstance(x, Hit) else pad(x, *a, **k)

def record(script, func):
    Recorder.last = None
    here = os.getcwd(); os.chdir(os.path.dirname(os.path.abspath(__file__)))
    stdout = sys.stdout; sys.stdout = open(os.devnull, 'w')
    try:
        if func:
            g = runpy.run_path(script, run_name='party'); g[func]()
        else:
            runpy.run_path(script, run_name='__main__')
    finally:
        sys.stdout.close(); sys.stdout = stdout; os.chdir(here)
    return Recorder.last

# ---------------------------------------------------------------- laying it out for BeepBox
def song_json(rec, beat, bpb, tpb):
    P = 24                                           # BeepBox's finest timing: 24 parts to a beat
    BAR = bpb * P
    parts = lambda seconds: int(round(seconds / beat * P))
    if rec.loop:
        ls, le = parts(rec.loop[0]), parts(rec.loop[1])
    else:
        ls, le = 0, max(parts(t + d) for t, v, m, d, vol in rec.events)
    intro_bars = -(-ls // BAR)
    shift = intro_bars * BAR - ls                    # the loop starts on a bar line
    loop_bars = max(1, int(round((le - ls) / BAR)) if rec.loop else -(-(le - ls) // BAR))   # a jingle keeps its last bar
    end = (intro_bars + loop_bars) * BAR

    # group into channels: each pitched instrument; drums by family
    groups = defaultdict(list)
    for t, v, m, d, vol in rec.events:
        start = parts(t) + shift
        if start >= end: continue
        if v == 'drum':
            if m in DRUMS:
                fam, p = DRUMS[m]; groups[('drum', fam)].append((start, p, 6, vol))
        else:
            stop = min(end, max(start + 1, parts(t + d) + shift))
            q = int(m) - 12                          # BeepBox pitch 0 is C0 (MIDI 12); its top is 84 (C7)
            while q > 84: q -= 12                    # the highest bells drop an octave to fit
            groups[('pitch', v)].append((start, q, stop - start, vol))

    def chords(notes):                               # notes starting together become one chord (max 4)
        notes.sort(key=lambda n: (n[0], -n[2]))
        out = []
        for t, p, d, vol in notes:
            if out and out[-1][0] == t and len(out[-1][1]) < 4:
                if p not in out[-1][1]: out[-1][1].append(p)
                out[-1][2] = max(out[-1][2], d); out[-1][3] = max(out[-1][3], vol)
            else:
                out.append([t, [p], d, vol])
        return out

    def lanes(cs, limit):                            # split overlapping chords into separate channels
        lanes = []
        for c in cs:
            for lane in lanes:
                if lane[-1][0] + lane[-1][2] <= c[0]: lane.append(c); break
            else:
                if len(lanes) < limit: lanes.append([c])
                else:                                # out of channels: cut the earliest-ending note short
                    lane = min(lanes, key=lambda l: l[-1][0] + l[-1][2])
                    last = lane[-1]; last[2] = c[0] - last[0]
                    if last[2] < 1: lane.pop()
                    lane.append(c)
        return lanes

    pitch_groups = sorted([k for k in groups if k[0] == 'pitch'], key=lambda k: -len(groups[k]))
    chorded = {k: chords(groups[k]) for k in pitch_groups}
    want = {k: len(lanes(chorded[k], 99)) for k in pitch_groups}
    give = {k: 1 for k in pitch_groups[:10]}
    while sum(give.values()) < 10 and any(give[k] < want[k] for k in give):
        k = max((k for k in give if give[k] < want[k]), key=lambda k: len(chorded[k]) / give[k])
        give[k] += 1
    dropped = pitch_groups[10:]

    channels = []
    def add_channel(kind, instrument, lane):
        top = max(c[3] for c in lane) or 1
        bars = [[] for _ in range(intro_bars + loop_bars)]
        for t, ps, d, vol in lane:                   # split notes at bar lines
            d = min(d, end - t)
            while d > 0:
                bar, start = divmod(t, BAR)
                seg = min(d, BAR - start)
                v = int(round(100 * min(1.0, 0.35 + 0.65 * vol / top)))
                bars[bar].append({'pitches': sorted(ps),
                                  'points': [{'tick': round(start * tpb / P, 4), 'pitchBend': 0, 'volume': v},
                                             {'tick': round((start + seg) * tpb / P, 4), 'pitchBend': 0, 'volume': v}]})
                t += seg; d -= seg
        patterns, seq, seen = [], [], {}
        for notes in bars:
            if not notes: seq.append(0); continue
            key = json.dumps(notes, sort_keys=True)
            if key not in seen:
                patterns.append({'instruments': [1], 'notes': notes}); seen[key] = len(patterns)
            seq.append(seen[key])
        low = min(p for c in lane for p in c[1])
        channels.append({'type': kind, 'instruments': [instrument], 'patterns': patterns, 'sequence': seq,
                         'octaveScrollBar': 0 if kind == 'drum' else max(0, min(6, low // 12 - 1))})

    for k in pitch_groups[:10]:
        for lane in lanes(chorded[k], give[k]):
            add_channel('pitch', VOICES[k[1]], lane)
    for fam in ('low', 'wood', 'snare', 'high'):
        k = ('drum', fam)
        if k not in groups: continue
        wave, env = DRUM_CHANNELS[fam]
        ins = {'type': 'noise', 'volume': 80, 'wave': wave, 'transition': 'normal', 'fadeInSeconds': 0,
               'fadeOutTicks': -3, 'chord': 'simultaneous', 'effects': ['chord type'],
               'envelopes': [{'target': 'noteVolume', 'envelope': env}]}
        for lane in lanes(chords(groups[k]), 1):
            add_channel('drum', ins, lane)

    song = {'format': 'BeepBox', 'version': 9, 'scale': 'expert', 'key': 'C',
            'introBars': intro_bars, 'loopBars': loop_bars, 'beatsPerBar': bpb, 'ticksPerBeat': tpb,
            'beatsPerMinute': int(round(60 / beat)), 'reverb': 0, 'masterGain': 1,
            'layeredInstruments': False, 'patternInstruments': False, 'channels': channels}
    return song, [k[1] for k in dropped]

def main(names):
    install()
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'beepbox')
    os.makedirs(out_dir, exist_ok=True)
    for name in names:
        script, func, beat, bpb, tpb = SONGS[name]
        np.random.seed(0)
        rec = record(script, func)
        song, dropped = song_json(rec, beat, bpb, tpb)
        bars = song['introBars'] + song['loopBars']
        if bars > 128: print('  warning: %s has %d bars; BeepBox keeps 128' % (name, bars))
        with open(os.path.join(out_dir, name + '.json'), 'w') as f: json.dump(song, f, separators=(',', ':'))
        print('%-17s %3d bars (%d intro), %2d channels%s' % (name, bars, song['introBars'], len(song['channels']),
              ('; left out: ' + ', '.join(dropped)) if dropped else ''))

if __name__ == '__main__':
    main(sys.argv[1:] or list(SONGS))
