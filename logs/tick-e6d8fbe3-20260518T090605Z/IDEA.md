# Game Idea: Asteroid Dodge

**Concept**: The player pilots a small spaceship that continuously moves forward through an endless field of scrolling asteroids. The ship can rotate left/right and thrust forward. The goal is to survive as long as possible while dodging asteroids.

**Controls**: Arrow keys – left/right to rotate, up to thrust.

**Lose Condition**: The game ends instantly when the ship collides with any asteroid.

**Core Canvas Features**:
- Render ship and asteroids as simple shapes (triangles and circles).
- Use `requestAnimationFrame` for smooth animation.
- Simple physics for ship movement and asteroid drift.
- Randomly generate asteroids with varying sizes and speeds.
- Display score based on time survived.

**Why Feasible**: Requires only basic drawing, input handling, collision detection, and a game loop – all well‑suited to the HTML5 Canvas API.