# Game Idea: Cosmic Dodge

**Genre**: Arcade / Endless Runner

**Core Loop**:
- The player controls a small spaceship that constantly moves forward across a scrolling starfield.
- Asteroids and space debris appear from the right at varying speeds and trajectories.
- Use arrow keys (or WASD) to move up, down, left, and right to dodge them.

**Lose Condition**:
- The game ends immediately when the ship collides with any asteroid or debris.

**Win Condition / Scoring**:
- No explicit win; the goal is to survive as long as possible.
- Score increases over time based on distance travelled and bonuses for close passes.

**Visuals**:
- Simple shapes drawn on an HTML canvas (ship: triangle, asteroids: circles).
- Parallax background stars for depth.

**Why Canvas?**
- Real‑time drawing of moving shapes and collision detection are straightforward with the Canvas 2D API.

**Stretch Goals**:
- Power‑ups (shields, speed boost).
- Increasing difficulty with more frequent debris.
- Leaderboard for high scores.