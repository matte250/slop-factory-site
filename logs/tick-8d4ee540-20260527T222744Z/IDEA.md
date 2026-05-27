# Game Idea: Canvas Runner

A minimalist endless runner on an HTML canvas where the player controls a small square that automatically moves forward. Randomly generated spikes and gaps appear; the player must jump (spacebar) or slide (down arrow) to avoid them. Touching any obstacle or falling off the platform triggers a **lose condition** and ends the game.

**Core Mechanics**
- Continuous forward scrolling background.
- Simple controls: jump or slide.
- Increasing speed over time for difficulty.
- Score based on distance traveled.

**Why It Works on Canvas**
- Simple shapes (square, rectangles) keep rendering cheap.
- Collision detection via bounding boxes.
- All animation handled via `requestAnimationFrame`.

**Lose Condition**
- Collision with an obstacle or falling below the ground line ends the run.