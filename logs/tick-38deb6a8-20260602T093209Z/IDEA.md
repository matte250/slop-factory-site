# Pixel Dodger

**Concept**: A minimalist arcade game where the player controls a single pixel at the bottom of the canvas, moving left and right to dodge falling blocks.

**Gameplay**:
- Arrow keys (or A/D) move the pixel horizontally.
- Blocks spawn at random positions at the top and fall at increasing speed.
- Each block avoided increments the score.

**Lose Condition**: Collision between the player pixel and any falling block ends the game (Game Over).

**Why Canvas-friendly**: Simple rectangle drawing and collision detection require only basic canvas APIs; no sprites or external assets needed.