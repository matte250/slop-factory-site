# Game Idea: Cosmic Escape

**Concept**: A fast‑paced HTML canvas game where the player pilots a small spaceship navigating through an endless field of drifting asteroids.

**Gameplay**:
- The ship auto‑scrolls forward; the player uses arrow keys (or WASD) to thrust left/right and up/down.
- Asteroids of varying sizes drift across the screen at random angles and speeds.
- Collectable “energy orbs” appear occasionally for score bonuses.

**Lose Condition**: The game ends immediately when the ship collides with any asteroid.

**Winning/Scoring**: Players aim for the highest survival time and score by gathering orbs before the inevitable collision.

**Implementation Highlights**:
- Use `requestAnimationFrame` for smooth rendering.
- Simple physics for ship movement and asteroid trajectories.
- Pixel‑perfect collision detection via bounding circles.
- Adjustable difficulty by increasing asteroid spawn rate over time.

A concise, fun project that fits well within an HTML canvas and can be expanded with power‑ups or levels later.