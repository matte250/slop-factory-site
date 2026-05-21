# Game Idea: Cosmic Dodge

**Concept**: The player controls a small spaceship that continuously moves forward through an endless starfield. Asteroids and comets appear from the right side of the screen at varying speeds. The player can move up, down, left, and right to dodge them.

**Lose Condition**: Collision with any asteroid or comet ends the game. Optionally, a timer runs out if the player fails to reach a distance milestone within a set period.

**Core Mechanics**:
- Arrow keys or WASD for movement.
- Simple physics: constant forward scroll, objects move leftward.
- Score based on distance traveled.
- Progressive difficulty: spawn rate and speed increase over time.

**HTML Canvas**: Render starfield background, ship sprite, and asteroid shapes using canvas drawing primitives. Minimal assets required, suitable for a quick prototype.
