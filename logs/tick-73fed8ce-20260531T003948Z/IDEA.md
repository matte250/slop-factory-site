# Game Idea: Cosmic Collector

**Concept**: A top‑down HTML canvas game where the player pilots a small spaceship to collect drifting space debris while avoiding moving asteroids.

**Gameplay**:
- Arrow keys (or WASD) steer the ship.
- Debris appear randomly and grant points when collected.
- Asteroids drift across the screen; colliding with one ends the game.
- Fuel depletes over time; collecting special fuel pods extends play.

**Lose Condition**: The game ends when the ship collides with an asteroid **or** runs out of fuel.

**Why Canvas**: Simple sprite rendering, collision detection, and animation loops fit well within the Canvas 2D API.
