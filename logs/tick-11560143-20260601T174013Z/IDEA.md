# Random Canvas Game Idea

**Title:** Space Drift

**Concept:**
Control a small spaceship drifting through an endless star field. Use arrow keys (or WASD) to steer and avoid moving asteroids and space debris.

**Gameplay:**
- The ship continuously moves forward; the player can adjust direction.
- Asteroids appear at random intervals and speeds.
- Collectible fuel cells appear occasionally; missing them reduces your fuel.

**Lose Condition:**
- Collision with an asteroid **or** fuel depletion (fuel reaches zero) ends the game.

**Win Condition (optional):**
- Survive for a set time (e.g., 3 minutes) or reach a score threshold.

**Implementation Notes:**
- Render ship, stars, and asteroids on an HTML `<canvas>`.
- Use `requestAnimationFrame` for smooth animation.
- Simple collision detection based on distance between ship and asteroids.
- Display score and remaining fuel UI elements.