#!/usr/bin/env python3
"""Render the monochrome LCD README. Requires Python 3 and Pillow.

Run from any directory: python3 scripts/render_readme.py
The animation is deterministic and has no network or font-download dependency.
"""

from functools import lru_cache
from pathlib import Path
import math

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "readme"
WIDTH, HEIGHT = 800, 2200
FRAMES = 64
WHITE, TEXT, MUTED, EDGE = 250, 220, 156, 62

# Tiny bitmap lettering and the pet silhouette follow the supplied Uptime Pet
# reference. The palette, layout, content and animation are adapted for a README.
PIXEL = {
    "A": ["01110", "11011", "11011", "11111", "11011", "11011", "11011"],
    "B": ["11110", "11011", "11011", "11110", "11011", "11011", "11110"],
    "C": ["01111", "11000", "11000", "11000", "11000", "11000", "01111"],
    "D": ["11110", "11011", "11011", "11011", "11011", "11011", "11110"],
    "E": ["11111", "11000", "11000", "11110", "11000", "11000", "11111"],
    "F": ["11111", "11000", "11000", "11110", "11000", "11000", "11000"],
    "G": ["01111", "11000", "11000", "11011", "11011", "11011", "01111"],
    "H": ["11011", "11011", "11011", "11111", "11011", "11011", "11011"],
    "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    "J": ["00111", "00011", "00011", "00011", "11011", "11011", "01110"],
    "K": ["11011", "11011", "11110", "11100", "11110", "11011", "11011"],
    "L": ["11000", "11000", "11000", "11000", "11000", "11000", "11111"],
    "M": ["10001", "11011", "11111", "11111", "11011", "11011", "11011"],
    "N": ["11001", "11101", "11101", "11111", "11011", "11011", "11001"],
    "O": ["01110", "11011", "11011", "11011", "11011", "11011", "01110"],
    "P": ["11110", "11011", "11011", "11110", "11000", "11000", "11000"],
    "Q": ["01110", "11011", "11011", "11011", "11011", "11110", "00111"],
    "R": ["11110", "11011", "11011", "11110", "11100", "11010", "11011"],
    "S": ["01111", "11000", "11000", "01110", "00011", "00011", "11110"],
    "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    "U": ["11011", "11011", "11011", "11011", "11011", "11011", "01110"],
    "V": ["11011", "11011", "11011", "11011", "11011", "01110", "00100"],
    "W": ["11011", "11011", "11011", "11111", "11111", "11011", "10001"],
    "X": ["11011", "11011", "01110", "00100", "01110", "11011", "11011"],
    "Y": ["11011", "11011", "01110", "00100", "00100", "00100", "00100"],
    "Z": ["11111", "00011", "00110", "00100", "01100", "11000", "11111"],
    " ": ["00000"] * 7,
}
BODY = ["...######...", "..#......#..", ".#........#.", "#..........#",
        "#..........#", "#..........#", "#..........#", ".#........#.",
        "..#......#..", "...######..."]
ANTENNA = ["....#..#....", ".....##....."]
FEET = [["...#....#...", "..##....##.."], ["....#..#....", "...##..##..."]]
HEART = [".#.#.", "#####", ".###.", "..#.."]
BUG = [["#.#.#", ".###.", "#.#.#"], [".#.#.", "#####", ".#.#."]]


@lru_cache(None)
def font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/Menlo.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "DejaVuSansMono.ttf",
        "/System/Library/Fonts/Supplemental/Courier New.ttf",
    ]
    for path in candidates:
        try:
            if bold and "Menlo" in path:
                return ImageFont.truetype(path, size, index=1)
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default(size=size)


def text(d, xy, message, size=22, color=TEXT, bold=False):
    x, y = xy
    box = d.textbbox((x, y), message, font=font(size, bold))
    # Fail the build instead of silently cropping text at the screen edge.
    assert box[2] <= WIDTH - 60, (message, box)
    d.text((x, y), message, fill=color, font=font(size, bold))


def center(d, y, message, size=22, color=TEXT):
    length = d.textlength(message, font=font(size))
    text(d, ((WIDTH - length) / 2, y), message, size, color)


def bitmap(d, rows, x, y, scale=6, color=WHITE, flip=False, gap=1):
    for r, row in enumerate(rows):
        for c, bit in enumerate(row[::-1] if flip else row):
            if bit in "#1":
                dx, dy = round(x + c * scale), round(y + r * scale)
                d.rectangle((dx, dy, dx + scale - 1 - gap, dy + scale - 1 - gap), fill=color)


def pixel_text(d, message, x, y, scale=5, color=WHITE):
    for c in message:
        bitmap(d, PIXEL[c], x, y, scale, color, gap=0)
        x += 6 * scale


def screen(d, top, bottom, label, right):
    d.rounded_rectangle((44, top, 756, bottom), radius=16, fill=3, outline=EDGE, width=2)
    # Dim unlit LCD cells: enough texture to read as a display, never behind copy.
    for y in range(top + 14, bottom - 10, 8):
        for x in range(58, 746, 8):
            d.rectangle((x, y, x + 1, y + 1), fill=15)
    d.rectangle((66, top + 20, 734, top + 61), fill=3)
    text(d, (72, top + 22), label, 24, TEXT)
    length = d.textlength(right, font=font(18))
    text(d, (728 - length, top + 26), right, 18, MUTED)
    d.line((70, top + 66, 730, top + 66), fill=EDGE)


def copy(d, x, y, lines, size=22, color=TEXT, leading=34):
    for line in lines:
        d.rectangle((x - 2, y, 732, y + leading - 1), fill=3)
        text(d, (x, y), line, size, color)
        y += leading


def static_scene():
    im = Image.new("L", (WIDTH, HEIGHT), 0)
    d = ImageDraw.Draw(im)
    # One continuous handheld housing, including every section of the README.
    d.rounded_rectangle((14, 14, 786, HEIGHT - 14), radius=42, fill=8, outline=91, width=2)
    d.rounded_rectangle((24, 24, 776, HEIGHT - 24), radius=34, outline=30, width=1)
    for y in (44, HEIGHT - 44):
        for x in (43, 757):
            d.ellipse((x - 5, y - 5, x + 5, y + 5), outline=70)
            d.line((x - 2, y + 2, x + 2, y - 2), fill=70)
    text(d, (70, 44), "LANGUAGE LAB / FIELD UNIT 001", 18, MUTED)
    text(d, (596, 44), "POWER", 16, MUTED)

    screen(d, 92, 544, "00 / HELLO", "JAVASCRIPT / NODE.JS")
    center(d, 182, "A PROGRAMMING LANGUAGE", 28, WHITE)
    pixel_text(d, "INTERPRETER", 140, 230, 8)
    # A smaller playfield keeps the companion without a large empty hero.
    for x in range(80, 724, 12):
        d.rectangle((x, 440, x + 3, 442), fill=70)
    center(d, 482, "ONE TOKEN AT A TIME.", 28, WHITE)

    screen(d, 568, 1102, "01 / TOKENS", "LEXER / IN PROGRESS")
    d.rounded_rectangle((72, 658, 728, 724), radius=8, fill=13, outline=EDGE)
    text(d, (94, 672), "> let score = 42;", 32, WHITE)
    text(d, (96, 750), "TYPE", 21, MUTED)
    text(d, (418, 750), "VALUE", 21, MUTED)
    text(d, (635, 750), "LINE", 21, MUTED)
    rows = [("LET", '\"let\"'), ("IDENTIFIER", '\"score\"'), ("ASSIGN", '\"=\"'),
            ("NUMBER", "42"), ("SEMICOLON", '\";\"'), ("EOF", "null")]
    for i, (kind, value) in enumerate(rows):
        y = 792 + i * 40
        d.rectangle((92, y - 1, 707, y + 35), fill=3)
        text(d, (96, y), kind, 27, WHITE)
        text(d, (418, y), value, 27)
        text(d, (654, y), "1", 27, MUTED)
    center(d, 1050, "Source in. Six tokens out.", 26, MUTED)

    screen(d, 1126, 1670, "02 / BUILD STATUS", "EARLY STAGE")
    stages = [
        ("01", "LEXER", "Characters -> tokens", "IN PROGRESS"),
        ("02", "PARSER", "AST + token helpers", "STARTED"),
        ("03", "SCOPES", "Names -> bindings", "PLANNED"),
        ("04", "EVALUATOR", "Syntax tree -> result", "PLANNED"),
    ]
    for i, (number, name, description, state) in enumerate(stages):
        y = 1214 + i * 76
        d.rounded_rectangle((96, y, 728, y + 68), radius=8, fill=8, outline=EDGE)
        text(d, (112, y + 8), number, 24, MUTED)
        text(d, (163, y + 6), name, 28, WHITE)
        text(d, (163, y + 39), description, 22, MUTED)
        length = d.textlength(state, font=font(18))
        text(d, (710 - length, y + 12), state, 18, TEXT if i < 2 else MUTED)
    d.line((79, 1248, 79, 1476), fill=EDGE, width=2)
    copy(d, 74, 1540, [
        "NEXT: token errors + expression parsing.",
        "Then scopes, evaluator, tests + REPL.",
    ], size=26, leading=42)

    screen(d, 1694, 2034, "03 / RUN IT", "NO NPM DEPENDENCIES")
    text(d, (74, 1790), "From the repository root:", 28, WHITE)
    d.rounded_rectangle((72, 1844, 728, 1918), radius=8, fill=13, outline=EDGE)
    text(d, (90, 1862), "$ node docs/lexer-demo.cjs", 30, WHITE)
    center(d, 1964, "Full interpreter still in progress.", 26, MUTED)

    # One linked console; the full text and commands remain in the guide.
    for x, letter, label in [(150, "A", "READ"), (362, "B", "TRACE"), (574, "C", "BUILD")]:
        d.ellipse((x, 2056, x + 48, 2104), fill=18, outline=112, width=2)
        text(d, (x + 17, 2067), letter, 20, WHITE)
        text(d, (x + 60, 2069), label, 20, MUTED)
    center(d, 2122, "OPEN FOR TEXT + COPYABLE COMMANDS", 22, TEXT)
    center(d, 2158, "UTTKARSH CHAMBIYAL / LANGUAGE LAB", 18, MUTED)
    return im


def animated_scene(base, tick):
    im = base.copy()
    d = ImageDraw.Draw(im)
    phase = 2 * math.pi * tick / FRAMES
    # Calm power light, no full-screen flashes.
    d.ellipse((693, 47, 703, 57), fill=round(170 + 70 * math.cos(phase)))
    # Companion wanders, blinks, and watches source bugs crawl through its world.
    x = round(370 + 91 * math.sin(phase))
    y = 354 - (5 if tick % 16 < 4 else 0)
    flip = math.cos(phase) < 0
    bitmap(d, ANTENNA, x, y, 5, flip=flip)
    bitmap(d, BODY, x, y + 10, 5)
    face = [(4, "...##..##..."), (6, ".....##.....")] if tick % 32 in (12, 13) else [
        (3, "...#....#..."), (4, "..#.#..#.#.."), (6, "....#..#...."), (7, ".....##.....")]
    for row, pattern in face:
        bitmap(d, [pattern], x, y + 10 + row * 5, 5, flip=flip)
    bitmap(d, FEET[(tick // 2) % 2], x, y + 60, 5, flip=flip)
    for offset in (0, 1):
        bx = 100 + ((tick * 4 + offset * 340) % 560)
        bitmap(d, BUG[(tick // 2) % 2], bx, 416 - offset * 26, 4, 156)
    bitmap(d, HEART, x + 18, 324 + round(4 * math.sin(phase)), 3, TEXT)
    # Tokens stay readable; only the read-head moves down the table.
    row = (tick // 8) % 6
    y = 798 + row * 40
    d.polygon([(76, y), (83, y + 7), (76, y + 14)], fill=WHITE)
    # The planned pipeline is a diagram, not claimed runtime behavior.
    packet_y = 1248 + round(228 * (tick / (FRAMES - 1)))
    d.rectangle((75, packet_y - 5, 83, packet_y + 5), fill=WHITE)
    # A terminal cursor and footer speaker cells complete the animated housing.
    if tick % 12 < 6:
        cursor_x = round(90 + d.textlength("$ node docs/lexer-demo.cjs", font=font(30))) + 12
        d.rectangle((cursor_x, 1866, cursor_x + 10, 1896), fill=WHITE)
    for i in range(5):
        h = 3 + round(8 * (1 + math.sin(phase + i)))
        d.rectangle((716 + i * 4, 2085 - h, 717 + i * 4, 2085), fill=100)
    return im


def render():
    OUT.mkdir(parents=True, exist_ok=True)
    base = static_scene()
    poster = animated_scene(base, 0)
    poster.save(OUT / "console-still.png", optimize=True)
    # Fixed 32-level grayscale palette: crisp type, small size, no color drift.
    palette = [v for i in range(256) for v in (min(i, 31) * 255 // 31,) * 3]
    lookup = [round(v * 31 / 255) for v in range(256)]
    frames = []
    for tick in range(FRAMES):
        frame = animated_scene(base, tick).point(lookup, "P")
        frame.putpalette(palette)
        frames.append(frame)
    frames[0].save(OUT / "console.gif", save_all=True, append_images=frames[1:],
                   duration=[120, 130] * (FRAMES // 2), loop=0, optimize=True, disposal=1)
    print(f"Rendered {FRAMES} frames / 8 seconds / {WIDTH}x{HEIGHT}")
    for p in sorted(OUT.iterdir()):
        print(f"{p.relative_to(ROOT)}: {p.stat().st_size / 1024:.0f} KiB")


if __name__ == "__main__":
    render()
