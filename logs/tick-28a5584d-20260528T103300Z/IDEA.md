# Game Idea: Asteroid Escape

**Concept**: A top‑down HTML5 Canvas game where the player pilots a small spaceship through an endless field of randomly moving asteroids. The ship can rotate and thrust using arrow keys. Occasionally, power‑up orbs appear that grant temporary shields or speed boosts.

**Lose Condition**: The game ends immediately if the spaceship collides with any asteroid *or* if the fuel meter (which depletes over time) runs out.

**Key Features**:
- Simple physics for ship movement (velocity, inertia).
- Procedurally generated asteroid trajectories.
- Score based on distance traveled and power‑ups collected.
- Minimal UI: score, fuel bar, shield indicator.

**Why Canvas?**: All graphics (ship, asteroids, particles) are drawn with Canvas 2D API, making it lightweight and easy to extend.
