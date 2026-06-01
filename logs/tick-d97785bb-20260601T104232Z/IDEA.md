# Game Idea: Color Drop

- **Genre**: Arcade / Reflex
- **Core mechanic**: Player controls a horizontal paddle at the bottom of the canvas. Colored circles fall from the top at random intervals.
- **Goal**: Catch circles that match the paddle's current color. Change paddle color via number keys (1‑3).
- **Lose condition**: The game ends when the player misses 5 circles (they reach the bottom) **or** catches a circle of the wrong color.
- **Visuals**: Simple shapes and a limited color palette, easily rendered with HTML canvas.
- **Scoring**: Points for each correctly caught circle, with streak bonuses for consecutive matches.

The game can be built with vanilla JavaScript and HTML canvas, using `requestAnimationFrame` for the game loop.