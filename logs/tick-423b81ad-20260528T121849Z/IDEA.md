# Game Idea: Asteroid Dodge

**Genre:** Endless runner / arcade

**Core mechanics:**
- Control a small ship with arrow keys on a scrolling starfield.
- Randomly generated asteroids appear from the right at varying speeds and sizes.
- The ship can move up/down and wraps vertically.

**Goal:** Survive as long as possible, accumulating distance points.

**Lose condition:** Collision with any asteroid ends the game.

**Canvas suitability:** Simple 2D shapes (triangles, circles) and per‑frame updates using `requestAnimationFrame` make this easy to implement on an HTML `<canvas>`.