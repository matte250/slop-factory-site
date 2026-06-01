# Canvas Game Idea: Meteor Dodge

- **Genre:** Endless runner / survival
- **Core mechanic:** Player controls a ship at the bottom of the canvas, moving left/right with arrow keys or mouse. Meteors fall from the top at varying speeds.
- **Goal:** Survive as long as possible while dodging meteors.
- **Lose condition:** The game ends when any meteor collides with the ship.
- **Scoring:** Points increase over time; speed and frequency of meteors ramp up to increase difficulty.
- **Implementation notes:** Uses HTML5 canvas for rendering, `requestAnimationFrame` for the game loop, simple rectangle/circle collision detection, and basic sound effects for collisions.