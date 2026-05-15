1. HTML Scaffold & Meta — create index.html with required structure and stub script, and meta.json matching title, description, controls.
2. Game State Initialization — declare player, hazards, score, and phase objects with initial values.
3. Animation Loop Setup — implement startLoop() with requestAnimationFrame, cancel previous loop, try/catch, and clear canvas each frame.
4. Input Handling — add keys Set via keydown/keyup, R-key restart, and restart button click invoking a common reset function.
5. Player Movement — apply dt‑scaled physics based on input, enforce speed limits and canvas bounds, ensure controls affect player state.
6. Hazard System — define hazard data structure, spawn rules respecting SAFE_RADIUS at start, and dt‑scaled motion.
7. Collision Detection — detect player‑hazard collisions, transition to gameover state, and stop the active loop.
8. Scoring Mechanism — increase score on discrete events, render current score in the top‑left corner each frame.
9. Rendering Pipeline — draw background, hazards, player (high‑contrast), and HUD after clearing canvas.
10. Game‑Over Overlay — dim the background and display “Game Over”, final score, and restart instructions on the canvas.
11. Observable Contract — expose window.__game each frame with state, score, player position/visibility, and objective string.
12. Audio Integration — add lazy‑initialized AudioContext with beep() helper, hook into hit, score, and death events with proper error handling.
