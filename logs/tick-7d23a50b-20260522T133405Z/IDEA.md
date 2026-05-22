# Game Idea: Orbit Dodge

**Concept**: In a circular HTML canvas you control a satellite orbiting a planet. Random debris spawns from the edges and moves toward the planet. You can change the satellite's direction and speed to dodge the debris. A collision with any debris ends the game.

**Lose condition**: Collision with a debris object.

**Core mechanics**:
- Rotate the satellite left/right (or speed up/slow down) using keyboard or touch.
- Generate debris at random angles and speeds.
- Simple physics for motion along radial lines.
- Score based on survival time.

**Why it works on canvas**: Uses basic drawing (circles, lines), animation via `requestAnimationFrame`, and simple collision detection.
