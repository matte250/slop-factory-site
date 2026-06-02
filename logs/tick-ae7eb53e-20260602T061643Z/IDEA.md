# Game Idea: Asteroid Escape

**Genre:** Endless arcade
**Platform:** HTML Canvas

**Core loop**: The player pilots a small spaceship that constantly moves forward. Randomly generated asteroids drift across the screen. The player can steer left/right and boost speed using arrow keys.

**Goal**: Survive as long as possible while collecting occasional fuel cells that extend the timer.

**Lose condition**: The game ends immediately when the ship collides with an asteroid **or** when the fuel timer reaches zero.

**Key features**:
- Simple physics and collision detection using canvas rectangles/circles.
- Incremental difficulty: asteroid speed and spawn rate increase over time.
- Minimal UI: score displayed as survival time, fuel bar, and a "Game Over" overlay.

**Why it works on Canvas**: All elements are drawn with basic shapes, requiring only 2‑D rendering, input handling, and a game loop—perfect for a lightweight HTML5 canvas project.