# Game Idea: Asteroid Dash

**Genre**: Arcade / Endless runner

**Core mechanic**: The player controls a small spaceship that constantly moves forward across an infinite scrolling starfield. Using the mouse or arrow keys, the player can steer left/right and apply short thrust boosts to dodge incoming asteroids.

**Goal**: Survive as long as possible while collecting floating fuel canisters to keep the ship powered.

**Lose condition**: The game ends when the ship collides with an asteroid **or** when the fuel level reaches zero.

**Canvas elements**:
- Starfield background drawn with particles.
- Asteroid sprites generated at random intervals.
- Ship sprite with simple rotation based on direction.
- Fuel gauge UI drawn on the canvas.

**Why it works on HTML canvas**: All elements are 2‑D shapes or images that can be efficiently rendered each frame with `requestAnimationFrame`. Collision detection is simple AABB or circle checks, and the game loop fits naturally into the canvas animation model.