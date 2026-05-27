# Game Idea: Asteroid Miner

**Concept**: The player pilots a small mining ship in an endless field of drifting asteroids. The ship can move in any direction using arrow keys or WASD. Clicking on an asteroid fires a mining laser that extracts resources.

**Goal**: Accumulate as many resources as possible while avoiding dangerous laser‑firing patrol drones that patrol the area.

**Lose Condition**: The ship has a health bar that decreases each time it collides with an asteroid or is hit by a patrol drone's laser. The game ends when health reaches zero.

**Canvas Elements**:
- Ship (simple triangular shape)
- Asteroids (rotating circles with random sizes)
- Patrol drones (small squares moving along preset paths)
- Resource counter and health bar overlay.

**Why It Works on HTML Canvas**: All graphics are basic geometric shapes that can be drawn efficiently with the Canvas 2D API. Simple collision detection and physics are sufficient for gameplay.
