# Game Idea

**Title:** Asteroid Sprint

**Genre:** Endless runner / survival

**Core mechanics:**
- The player controls a small ship that automatically moves forward across a horizontally scrolling starfield.
- Tap/click or press a key to thrust upward; gravity pulls the ship down.
- Randomly generated asteroids appear from the right; the ship must dodge them.
- Collect floating fuel cells to extend the timer.

**Lose condition:**
- The game ends immediately when the ship collides with any asteroid.

**Win condition (optional):**
- Survive for a target time (e.g., 60 seconds) to achieve a high‑score.

**Why it fits HTML canvas:**
- Simple 2‑D shapes (circles, triangles) can be drawn with `CanvasRenderingContext2D`.
- Collision detection can be done with distance checks.
- No external assets required, making it lightweight and easy to implement.

**Potential extensions:**
- Power‑ups that temporarily shrink the ship.
- Progressive speed increase for difficulty.
- Leaderboard using local storage.