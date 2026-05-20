# Game Idea: **Pixel Escape**

A top‑down pixel‑art maze where the player controls a small sprite that must navigate a procedurally generated labyrinth to reach a glowing exit. The maze scrolls with the player, and hidden traps (spikes, moving lasers) appear randomly.

**Lose condition**: The player dies if they touch any trap or run out of time (a visible countdown timer). When either occurs, the game displays a "Game Over" screen.

**Core mechanics**:
- Arrow keys to move.
- Simple AI for moving obstacles.
- Randomly generated levels ensure replayability.

**Why it works on HTML canvas**: Rendering a grid of colored squares and handling simple collision detection are lightweight, making it easy to implement with vanilla JavaScript and the Canvas 2D API.