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
WIDTH, HEIGHT = 800, 3020
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
    text(d, (72, top + 24), label, 18, MUTED)
    length = d.textlength(right, font=font(16))
    text(d, (728 - length, top + 26), right, 16, MUTED)
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

    screen(d, 92, 682, "00 / HELLO, WORLD", "8 FPS / 1-BIT SOUL")
    center(d, 184, "A PROGRAMMING LANGUAGE", 26, WHITE)
    pixel_text(d, "INTERPRETER", 92, 234, 9)
    center(d, 322, "A little machine. A language in the making.", 22)
    # LCD playfield: a pixel pet and crawling source fragments are added per frame.
    for x in range(80, 724, 12):
        d.rectangle((x, 532, x + 3, 534), fill=70)
    center(d, 570, "FEED IT SOURCE. WATCH IT THINK.", 23, WHITE)
    center(d, 620, "JAVASCRIPT / NODE.JS / WORK IN PROGRESS", 18, MUTED)

    screen(d, 706, 1288, "01 / SOURCE TO TOKENS", "LEXER / IN PROGRESS")
    d.rounded_rectangle((72, 798, 728, 866), radius=8, fill=13, outline=EDGE)
    text(d, (94, 815), "> let score = 42;", 29, WHITE)
    text(d, (96, 894), "TYPE", 17, MUTED)
    text(d, (418, 894), "VALUE", 17, MUTED)
    text(d, (635, 894), "LINE", 17, MUTED)
    rows = [("LET", '"let"'), ("IDENTIFIER", '"score"'), ("ASSIGN", '"="'),
            ("NUMBER", "42"), ("SEMICOLON", '";"'), ("EOF", "null")]
    for i, (kind, value) in enumerate(rows):
        y = 936 + i * 44
        d.rectangle((92, y - 1, 707, y + 31), fill=3)
        text(d, (96, y), kind, 23, WHITE)
        text(d, (418, y), value, 23)
        text(d, (654, y), "1", 23, MUTED)
    center(d, 1228, "Characters in. Meaningful pieces out.", 22, MUTED)

    screen(d, 1312, 1800, "02 / INSIDE THE MACHINE", "THE PLAN / FOUR STAGES")
    stages = [
        ("01", "LEXER", "Source -> tokens", "IN PROGRESS"),
        ("02", "PARSER", "Tokens -> syntax tree", "STARTED"),
        ("03", "SCOPES", "Names -> bindings", "PLANNED"),
        ("04", "EVALUATOR", "Syntax tree -> result", "PLANNED"),
    ]
    for i, (number, name, description, state) in enumerate(stages):
        y = 1402 + i * 88
        d.rounded_rectangle((96, y, 728, y + 74), radius=8, fill=8, outline=EDGE)
        text(d, (112, y + 10), number, 22, MUTED)
        text(d, (163, y + 8), name, 24, WHITE)
        text(d, (163, y + 42), description, 19, MUTED)
        length = d.textlength(state, font=font(16))
        text(d, (710 - length, y + 12), state, 16, TEXT if i < 2 else MUTED)
    d.line((79, 1438, 79, 1703), fill=EDGE, width=2)

    screen(d, 1824, 2420, "03 / THE BUILD LOG", "SMALL STEPS / REAL CODE")
    text(d, (74, 1916), "THE LEXER HAS LEARNED", 24, WHITE, True)
    copy(d, 74, 1960, [
        "Numbers, strings, booleans, identifiers.",
        "Operators, delimiters + line tracking.",
    ])
    text(d, (74, 2056), "THE PARSER IS WAKING UP", 24, WHITE, True)
    copy(d, 74, 2100, [
        "AST helpers + peek / advance / expect.",
        "Full parsing and execution come next.",
    ])
    d.line((74, 2190, 726, 2190), fill=EDGE)
    text(d, (74, 2214), "NEXT IN THE QUEUE", 24, WHITE, True)
    copy(d, 106, 2262, [
        "Finish token types + lexer errors.",
        "Expression parsing + precedence.",
        "Scopes, evaluator, tests + REPL.",
    ], leading=38)

    screen(d, 2444, 2838, "04 / BOOT SEQUENCE", "NODE.JS + GIT")
    text(d, (74, 2540), "NO NPM DEPENDENCIES. JUST CURIOSITY.", 23, WHITE, True)
    copy(d, 74, 2592, [
        "Clone this repo. Open its root folder.",
        "Run the included lexer walkthrough:",
    ])
    d.rounded_rectangle((72, 2682, 728, 2748), radius=8, fill=13, outline=EDGE)
    text(d, (90, 2700), "$ node docs/lexer-demo.cjs", 26, WHITE)
    center(d, 2782, "No CLI or full interpreter yet. Built to learn.", 21, MUTED)

    # Hardware footer; the entire image links to the accessible, copyable guide.
    for x, letter, label in [(156, "A", "READ"), (370, "B", "TRACE"), (584, "C", "BUILD")]:
        d.ellipse((x, 2860, x + 52, 2912), fill=18, outline=112, width=2)
        text(d, (x + 19, 2874), letter, 18, WHITE)
        text(d, (x + 66, 2877), label, 16, MUTED)
    center(d, 2940, "OPEN THIS CONSOLE FOR TEXT + COPYABLE COMMANDS", 17, TEXT)
    center(d, 2972, "BUILT BY UTTKARSH CHAMBIYAL / ONE TOKEN AT A TIME", 14, MUTED)
    return im


def animated_scene(base, tick):
    im = base.copy()
    d = ImageDraw.Draw(im)
    phase = 2 * math.pi * tick / FRAMES
    # Calm power light, no full-screen flashes.
    d.ellipse((693, 47, 703, 57), fill=round(170 + 70 * math.cos(phase)))
    # Companion wanders, blinks, and watches source bugs crawl through its world.
    x = round(352 + 91 * math.sin(phase))
    y = 420 - (8 if tick % 16 < 4 else 0)
    flip = math.cos(phase) < 0
    bitmap(d, ANTENNA, x, y, 7, flip=flip)
    bitmap(d, BODY, x, y + 14, 7)
    face = [(4, "...##..##..."), (6, ".....##.....")] if tick % 32 in (12, 13) else [
        (3, "...#....#..."), (4, "..#.#..#.#.."), (6, "....#..#...."), (7, ".....##.....")]
    for row, pattern in face:
        bitmap(d, [pattern], x, y + 14 + row * 7, 7, flip=flip)
    bitmap(d, FEET[(tick // 2) % 2], x, y + 84, 7, flip=flip)
    for offset in (0, 1):
        bx = 100 + ((tick * 4 + offset * 340) % 560)
        bitmap(d, BUG[(tick // 2) % 2], bx, 493 - offset * 40, 4, 156)
    bitmap(d, HEART, x + 24, 380 + round(4 * math.sin(phase)), 4, TEXT)
    # Tokens stay readable; only the read-head moves down the table.
    row = (tick // 8) % 6
    y = 940 + row * 44
    d.polygon([(76, y), (83, y + 7), (76, y + 14)], fill=WHITE)
    # The planned pipeline is a diagram, not claimed runtime behavior.
    packet_y = 1438 + round(265 * (tick / (FRAMES - 1)))
    d.rectangle((75, packet_y - 5, 83, packet_y + 5), fill=WHITE)
    # Three queue slots; softly traveling activity markers, no fake percentages.
    for i in range(3):
        c = WHITE if (tick // 8) % 3 == i else 76
        d.rectangle((76, 2273 + i * 38, 84, 2281 + i * 38), outline=c, width=2)
    # A terminal cursor and footer speaker cells complete the animated housing.
    if tick % 12 < 6:
        cursor_x = round(90 + d.textlength("$ node docs/lexer-demo.cjs", font=font(26))) + 12
        d.rectangle((cursor_x, 2702, cursor_x + 10, 2729), fill=WHITE)
    for i in range(5):
        h = 3 + round(8 * (1 + math.sin(phase + i)))
        d.rectangle((716 + i * 4, 2889 - h, 717 + i * 4, 2889), fill=100)
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
