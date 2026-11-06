"""Author an original seamless cloth-relief tile; stdlib only, never run by the app."""
from pathlib import Path
from math import cos, sin, pi
import struct
import zlib

ROOT = Path(__file__).resolve().parent.parent
SIZE = 256


def relief(x, y):
    # Every frequency divides SIZE, so opposite edges meet without a seam.
    x, y = x % SIZE, y % SIZE
    warp = cos(2 * pi * (x + .45 * sin(2 * pi * y / 64)) / 8)
    weft = cos(2 * pi * (y + .45 * sin(2 * pi * x / 64)) / 8)
    crossing = 1 if (x // 8 + y // 8) % 2 == 0 else -1
    # Fixed periodic grain belongs to asset authoring, not session randomness.
    grain = (((x * 73 + y * 151 + x * y * 19) % 256) / 255 - .5)
    fibers = cos(2 * pi * x / 2 + .2 * sin(2 * pi * y / 32))
    value = .38 * warp + .38 * weft + .19 * crossing * (warp - weft) + .1 * grain + .035 * fibers
    color = 255 if value >= 0 else 0
    alpha = round(min(.52, abs(value) * .52) * 255)
    return color, color, color, alpha


def write_png(path, width, height, pixel):
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))
    rows = b''.join(b'\0' + bytes(channel for x in range(width) for channel in pixel(x, y)) for y in range(height))
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    data += chunk(b'IDAT', zlib.compress(rows, 9)) + chunk(b'IEND', b'')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def checked_relief(x, y):
    color, _, _, alpha = relief(x % 128, y % 128)
    fine_weave = (1 if color else -1) * alpha / 255
    # 160 source pixels = 80dp checks, 2.5x the original 32dp squares.
    # Fine relief repeats independently, retaining the thread scale.
    bands = (x // 160) % 2 + (y // 160) % 2
    shade = [.08, -.36, -.80][bands] + fine_weave * .18
    color = 255 if shade >= 0 else 0
    return color, color, color, round(min(.92, abs(shade)) * 255)


if __name__ == '__main__':
    for name, pattern, size in [('woven-linen', relief, SIZE), ('checked-cloth', checked_relief, 640)]:
        def density_one(x, y):
            samples = [pattern(x * 2 + dx, y * 2 + dy) for dx in [0, 1] for dy in [0, 1]]
            total_alpha = sum(pixel[3] for pixel in samples)
            color = round(sum(pixel[0] * pixel[3] for pixel in samples) / total_alpha) if total_alpha else 0
            return color, color, color, round(total_alpha / 4)

        base = ROOT / f'assets/textures/{name}.png'
        write_png(base, size // 2, size // 2, density_one)
        tile = ROOT / f'assets/textures/{name}@2x.png'
        write_png(tile, size, size, pattern)
        print(f'Authored {name} 1x/2x ({base.stat().st_size + tile.stat().st_size} bytes; {size // 2}dp tile)')
