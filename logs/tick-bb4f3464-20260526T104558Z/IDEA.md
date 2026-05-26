# Game Idea: Cosmic Dodger

**Concept**: Control a small spaceship navigating an endless starfield while dodging randomly spawning space debris.

**Core Mechanics**:
- The ship moves up/down/left/right using arrow keys or WASD.
- Debris of various sizes and speeds appear from the edges and drift across the canvas.
- The background scrolls to simulate forward motion.

**Lose Condition**: The game ends when the ship collides with any piece of debris. A "Game Over" screen shows the distance traveled.

**Why HTML Canvas?** All graphics (ship, debris, stars) can be drawn with simple shapes or sprite images, and collision detection is straightforward using bounding boxes.
