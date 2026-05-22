# Game Idea: Cosmic Courier

**Concept**: The player controls a small spaceship that must navigate a scrolling starfield, picking up and delivering glowing cargo crates to moving space stations. The canvas displays simple shapes: the ship, stars, crates, and stations.

**Gameplay**:
- Arrow keys steer the ship left/right and adjust speed.
- Crates appear randomly; the player must fly over them to collect them.
- Delivered crates increase score.
- Space stations drift horizontally; the player must drop a crate when aligned with a station.

**Lose Condition**: The ship has a limited fuel gauge that depletes over time and when colliding with asteroids. The game ends when fuel reaches zero or the ship collides with three asteroids.

**Why It Works on HTML Canvas**: Simple geometric shapes and basic collision detection keep the implementation lightweight, while the scrolling background and moving objects provide engaging visual feedback.