# Game Idea: Asteroid Dodger

- **Genre:** Endless arcade shooter on an HTML canvas.
- **Core mechanic:** Player moves a small spaceship left/right at the bottom of the canvas to dodge continuously spawning asteroids falling from the top.
- **Goal:** Survive as long as possible while collecting occasional power‑ups that grant temporary shields or speed boosts.
- **Lose condition:** The game ends when the spaceship collides with an asteroid (or after three collisions if lives are used).
- **Why it works:** Simple sprite drawing and collision detection, all achievable with plain canvas API and a short game loop.