# Cosmic Dodge

- **Genre:** Arcade / Endless runner
- **Core mechanic:** Player controls a spaceship moving left/right at the bottom of an HTML canvas.
- **Goal:** Survive as long as possible while asteroids fall from the top.
- **Lose condition:** The game ends immediately when any falling asteroid collides with the ship.
- **Scoring:** Points increase over time; occasional power‑ups grant temporary shields or speed boosts.
- **Visuals:** Simple shapes (triangular ship, circular asteroids) drawn with Canvas 2D API.
- **Implementation hints:** Use `requestAnimationFrame` for the game loop, track objects in arrays, detect collisions with bounding‑box checks.