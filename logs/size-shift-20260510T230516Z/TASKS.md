1. Scaffold HTML and meta.json — create index.html skeleton with header, canvas, restart button, empty script, and matching meta.json.
2. Define game state objects — initialize player, hazards, score, and phase/state objects at the top of the script.
3. Setup animation loop — implement startLoop with cancelAnimationFrame, requestAnimationFrame loop, try/catch, and clear canvas each frame.
4. Input handling — add a keys Set, keydown/keyup listeners, R-key restart, and restart button click that call a common reset function.
5. Player movement — implement dt‑based physics responding to arrow keys, update player position, and clamp to canvas bounds.
6. Hazard system — create hazard data structure, spawn hazards respecting SAFE_RADIUS, and move them each frame with dt scaling.
7. Collision detection and game over — detect player‑hazard collisions, transition to “gameover” state, and stop active gameplay.
8. Scoring — increment score on discrete events, and draw the current score on the canvas top‑left.
9. Rendering pipeline — clear canvas, draw background, hazards, player (high‑contrast), and HUD each frame.
10. Game‑over overlay — dim background, display “Game Over” with final score and restart instructions.
11. Observable contract — populate window.__game each frame with state, score, player position/visibility, and objective text.
12. Audio — lazily initialise AudioContext, add beep helper, and trigger sounds on hit, score, and death events.