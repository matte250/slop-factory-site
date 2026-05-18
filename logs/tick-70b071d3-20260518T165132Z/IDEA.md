# Game Idea: Meteor Dodge

- **Genre:** Simple arcade dodge game.
- **Core Loop:** The player controls a small ship that constantly moves forward in a side‑scrolling space field rendered on an HTML canvas.
- **Mechanics:** Tap/arrow keys to move up/down; the ship automatically drifts right. Randomly spawning meteors roll in from the right at varying speeds.
- **Goal:** Survive as long as possible while collecting occasional fuel pickups that extend the timer.
- **Lose Condition:** The game ends instantly if the ship collides with a meteor or runs out of fuel.
- **Visuals:** Minimalist pixel art stars and meteors; simple particle trail for the ship.
- **Scoring:** Time survived + fuel pickups.

This concept can be implemented with vanilla JavaScript and the HTML `<canvas>` API, requiring only basic sprite handling, collision detection, and a game loop.
