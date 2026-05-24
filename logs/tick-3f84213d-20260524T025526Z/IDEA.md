# Game Idea: Asteroid Escape

**Genre:** Endless runner (top‑down view)

**Core Loop:** The player controls a small spaceship that constantly moves upward on an HTML canvas. Randomly generated asteroids drift downwards. The ship can move left/right and boost forward.

**Controls:** Arrow keys (←/→) to steer, ↑ to boost speed.

**Goal:** Survive as long as possible while accumulating points for each asteroid dodged.

**Lose Condition:** Collision with any asteroid ends the game (game over screen with score).

**Why Canvas:** Simple sprite rendering, collision detection using bounding circles/rectangles, and smooth animation via `requestAnimationFrame`.
