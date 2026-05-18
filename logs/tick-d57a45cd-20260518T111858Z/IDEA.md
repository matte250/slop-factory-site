# Random HTML Canvas Game Idea

**Title:** *Asteroid Miner* 

**Concept:**
- The player pilots a small mining ship in an endless side‑scrolling asteroid field.
- Use the mouse or arrow keys to thrust and steer the ship while a laser extracts minerals from passing asteroids.
- Collected minerals increase the score and replenish a limited fuel gauge.

**Lose Condition:**
- The game ends if the ship collides with an asteroid **or** the fuel gauge depletes to zero.

**Key Features for Canvas:**
- Simple physics for thrust and inertia.
- Procedurally generated asteroids with random sizes and speeds.
- Particle effects for mining laser and explosions.

**Why It Works on Canvas:**
- All visuals are 2‑D shapes and sprites, rendering efficiently with `requestAnimationFrame`.
- The gameplay loop is lightweight, making it ideal for a quick HTML5 demo.