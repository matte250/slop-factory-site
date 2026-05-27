# Canvas Game Idea: "Pixel Patrol"

- **Genre:** Arcade shooter
- **Core Loop:** Player controls a ship at the bottom of the canvas, moving left/right and firing upward at descending alien blocks.
- **Mechanics:** Aliens descend in waves; each alien that reaches the bottom adds one damage point.
- **Lose Condition:** The game ends when the player accumulates three damage points (or when the ship is hit).
- **Goal:** Survive as long as possible; score based on aliens destroyed.
- **Tech:** Simple shapes (rectangles, circles) drawn on an HTML5 `<canvas>`; keyboard controls; `requestAnimationFrame` loop.
