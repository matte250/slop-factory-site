# Game Idea: Asteroid Dodge

- **Genre**: Arcade, endless runner (HTML canvas)
- **Core Loop**: The player controls a small spaceship that moves left/right across the bottom of the canvas using arrow keys (or A/D). Asteroids spawn at random horizontal positions at the top and fall toward the bottom at varying speeds.
- **Interaction**: The ship can fire a single laser (space bar) with a short cooldown to destroy incoming asteroids, earning extra points. The player can also simply dodge by moving.
- **Scoring**: Points accumulate over time and for each asteroid destroyed.
- **Lose Condition**: The game ends when the ship collides with an asteroid (or after three hits if you give the player multiple lives). The final score is displayed.

The mechanics are simple to implement with the HTML5 `<canvas>` API: drawing shapes, handling keyboard events, and basic collision detection.
