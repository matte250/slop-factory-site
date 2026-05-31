# Game Idea: *Orbit Escape*

- **Genre**: Action / Arcade
- **Platform**: HTML5 Canvas (pure JavaScript)
- **Core mechanic**: The player controls a small ship that rotates around a central planet using left/right arrow keys. The ship constantly thrusts outward; the player must time thrusts to avoid incoming asteroids that spawn from the edge of the canvas and move toward the planet.
- **Goal**: Survive as long as possible while collecting floating fuel pickups to extend playtime.
- **Lose condition**: The game ends when the ship collides with an asteroid or runs out of fuel.
- **Visuals**: Simple vector shapes – a circle for the planet, a triangle for the ship, and small circles for asteroids.
- **Scoring**: Time survived (seconds) and number of fuel pickups collected.

*This concept can be built with a single HTML file using the Canvas API, requestAnimationFrame loop, and basic physics.*