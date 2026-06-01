# Game Idea: Nebula Escape

**Concept**: A top‑down space navigation game rendered on an HTML canvas. The player pilots a small ship through an endless, procedurally generated nebula filled with moving asteroid fields and hostile drones.

**Core Mechanics**:
- Arrow keys (or WASD) control thrust and rotation.
- The ship continuously drifts forward; the player must steer to avoid obstacles.
- Collect floating energy orbs to boost the ship’s shield and score.

**Lose Condition**:
- The ship is destroyed when its shield reaches zero after colliding with an asteroid or drone.
- Optional time‑limit mode: lose if the timer reaches zero before reaching the next checkpoint.

**Why Canvas?**
- Simple sprite drawing and collision detection are well‑suited for the 2D canvas API.
- Fast rendering of many moving objects (asteroids, particles) for an engaging visual experience.
