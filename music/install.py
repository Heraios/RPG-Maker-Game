# Copies finished renders into the game and checks how loud they are.
# Usage, from this folder:  python3 install.py Ritual Mystery          (music: Ritual16.ogg -> audio/bgm/Ritual.ogg)
#                           python3 install.py --me Victory_Isle         (a jingle: -> audio/me/)
#                           python3 install.py --check Ritual Yoon       (just measure, from the game's folders)
# Each track goes in as .ogg (with its loop points) and .m4a. Loudness is measured in LUFS (how loud it
# sounds overall: the soundtrack's songs sit around -7 to -9, the mostly-ambience tracks around -10 to -16)
# and peak (it must stay below 0 dBFS, or it clips).
import sys, os, re, shutil, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.join(HERE, '..', 'Smoking Isle', 'audio')

def loudness(path):
    out = subprocess.run(['ffmpeg', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    i = re.findall(r'I:\s+(-?[\d.]+) LUFS', out)[-1]; p = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', out)[-1]
    return float(i), float(p)

def main(args):
    folder, check = 'bgm', False
    if '--me' in args: folder = 'me'; args.remove('--me')
    if '--check' in args: check = True; args.remove('--check')
    for name in args:
        dest = os.path.join(GAME, folder, name + '.ogg')
        if not check:
            src = os.path.join(HERE, name + '16.ogg')
            if not os.path.exists(src): src = os.path.join(HERE, name + '.ogg')
            shutil.copy(src, dest)
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', dest, '-c:a', 'aac', '-b:a', '192k',
                            dest[:-4] + '.m4a'], check=True)
        i, p = loudness(dest)
        warn = '  (too quiet?)' if i < -17 else '  (too loud?)' if i > -6 else ''
        print('%-18s %6.1f LUFS  peak %5.1f dBFS%s' % (name, i, p, warn))

if __name__ == '__main__':
    main(sys.argv[1:])
