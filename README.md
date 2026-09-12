# RGB — Color Guessing Game

A browser game where you have to identify a randomly generated color. Four difficulty modes, each with a different input method and scoring weight.

**[Play it here](https://web.itu.edu.tr/sonmezme23/rgb)**

## Modes

| Mode | Input | Timer | Points |
|---|---|---|---|
| Easy | Pick from six RGB codes | 15s | 10 |
| Medium | Match with R/G/B sliders, ±15 tolerance | 30s | 20 |
| Hard | Type exact RGB values, with higher/lower hints | none | 30 |
| Expert | Type the HEX code, no hints, one attempt | 10s | 50 |

Each mode reuses the same round engine — a random target color is generated, the relevant panel is shown, and the answer is checked against a mode-specific tolerance.

## How it works

**Color handling.** Colors are generated as `{r, g, b}` objects and converted as needed: `rgbToHex` pads each channel to two hex digits, `hexToRGB` parses in the other direction, and `colorsMatch` compares two colors channel by channel against a tolerance value — 0 for exact modes, 15 for medium.

**Difficulty as configuration.** Rather than branching on mode throughout the code, each mode is defined once in a `MODE_CONFIG` object holding its timer duration, point value and tolerance. Adding a fifth mode means adding an entry and a panel, not rewriting the round logic.

**Timer.** The countdown is an SVG circle animated through `stroke-dashoffset`, calculated from the circle's circumference so the ring drains in proportion to the time left.

**Decoys.** In easy mode the five wrong options aren't drawn blindly. `randomDecoy` keeps generating candidates until one falls at least 30 units away from the target on some channel, so no two options are close enough to be indistinguishable by eye.

## Built with

HTML · CSS · Vanilla JavaScript — no framework. Confetti effects via [canvas-confetti](https://github.com/catdad/canvas-confetti).

## Running locally

Clone the repository and open `index.html` in a browser. No build step, no dependencies to install.
