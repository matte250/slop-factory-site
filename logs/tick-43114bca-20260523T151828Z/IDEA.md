# Random Canvas Game Idea

**Title:** Orbital Escape

**Concept:**
- The player controls a small spaceship that orbits a central planet.
- Asteroids and enemy drones are spawned from the edges and move toward the planet, rotating around it.
- The ship can rotate clockwise or counter‑clockwise and use thrust to change its orbital radius.
- Colliding with an asteroid/drone or drifting off-screen costs a life.
- The game ends when the player loses all lives (lose condition).

**Goal:** Survive as long as possible while racking up points for each avoided obstacle.

**Canvas Elements:**
- Central planet (static circle).
- Ship (rotating triangle).
- Obstacles (circles/triangles) moving along curved paths.
- Simple particle effects for thrust and explosions.

**Why It Works on Canvas:**
- Uses basic shapes and trigonometric motion.
- No external assets required; all graphics are drawn with Canvas API.
- Easy to implement physics with angular velocity and radial acceleration.
