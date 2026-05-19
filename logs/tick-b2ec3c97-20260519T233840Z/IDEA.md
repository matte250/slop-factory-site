# Game Idea: Cosmic Cleaner

**Concept**: A top‑down HTML‑canvas game where the player pilots a small spaceship equipped with a vacuum beam. Asteroids and space debris drift toward the ship. The player moves the ship with arrow keys and activates the beam to collect debris for points.

**Lose Condition**: The ship is destroyed if it collides with an asteroid that isn’t collected, or if the vacuum overloads after collecting too many items without emptying the cargo hold.

**Core Mechanics**:
- Arrow keys to move the ship.
- Space bar to toggle the vacuum beam.
- Collect debris for score, avoid collisions.
- Periodic cargo‑dump mini‑game to reset overload.

**Why HTML Canvas?**: Simple 2‑D rendering of moving objects, collision detection, and particle effects can be done efficiently with canvas APIs.
