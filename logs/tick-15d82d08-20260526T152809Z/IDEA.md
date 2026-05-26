# Game Idea: Cosmic Dodge

- **Genre**: Simple endless‑runner / dodge game.
- **Core Loop**: The player controls a small spaceship that continuously moves forward in a star‑field. Randomly generated asteroids fly toward the ship from the right.
- **Controls**: Arrow keys or WASD – up/down to move vertically, left/right to shift horizontally within a limited lane range.
- **Goal**: Survive as long as possible while the speed gradually increases.
- **Lose Condition**: The game ends when the ship collides with an asteroid or when the player fails to avoid a barrier that appears for a short time.
- **Canvas Implementation**: Use `requestAnimationFrame` to render the star background, ship sprite, and asteroid shapes. Collision detection via bounding‑box checks.
- **Scoring**: Distance traveled or number of asteroids dodged, displayed on the canvas.

This concept is straightforward to prototype with HTML5 Canvas, JavaScript, and minimal assets.