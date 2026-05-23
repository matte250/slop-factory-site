# Game Idea: Cosmic Drift

**Premise**: Players control a small spaceship drifting through an endless field of asteroids. The ship constantly drifts forward; the player can rotate left/right and apply thrust to change direction.

**Goal**: Survive as long as possible while collecting glowing energy orbs that appear randomly.

**Lose Condition**: Collision with any asteroid ends the game.

**Core Mechanics**:
- Simple joystick‑style controls (left/right rotation, thrust).
- Canvas rendering of ship, asteroids, and orbs.
- Increasing asteroid speed/density over time for difficulty ramp.
- Score based on time survived and orbs collected.

**Why Canvas?**: All graphics are 2‑D shapes and sprites drawn each frame, making it ideal for a lightweight HTML5 canvas implementation.