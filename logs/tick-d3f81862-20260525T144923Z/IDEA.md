# Game Idea: **Space Debris Dodge**

**Genre:** Action/Arcade

**Core Mechanics:**
- The player controls a small spaceship using arrow keys or WASD.
- Asteroids (debris) spawn from the edges of the canvas and move toward the center.
- The ship can thrust forward and rotate to dodge debris.
- Collect power‑ups that appear temporarily for speed boost or shield.

**Goal:** Survive as long as possible while accumulating points for each debris avoided.

**Lose Condition:** The game ends when the spaceship collides with any debris or the shield (if active) depletes.

**Visuals:** Simple geometric shapes (triangles for ship, circles for debris) rendered on an HTML `<canvas>`.

**Possible Extensions:**
- Increasing difficulty over time (faster debris, more spawn rate).
- High‑score leaderboard.
- Multiple ship upgrades.

**Why it fits HTML canvas:**
- Real‑time rendering of moving shapes.
- Straightforward collision detection using bounding circles.
- Minimal assets needed, suitable for quick prototyping.