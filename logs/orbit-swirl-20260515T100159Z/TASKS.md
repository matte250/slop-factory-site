1. HTML scaffold + meta.json — create required HTML skeleton with header, canvas, restart button, and empty script block; generate meta.json matching the header content.
2. Game state objects — define player, hazards, score, and phase plain objects at top of script with initial values.
3. requestAnimationFrame loop — implement startLoop() with cancelAnimationFrame handling, try/catch wrapper, and call update(dt) and render() each frame, clearing canvas.
4. Input handling — set up a Set `keys` populated by keydown/keyup events; add restart hook for R key and button click, both calling a reset() function.
5. Player movement — implement dt‑based physics using key inputs, updating player position, applying speed caps and friction, and reflecting changes in meta.json controls.
6. Hazards system — design data structure for hazards, spawn rules respecting SAFE_RADIUS, and dt‑scaled motion.
7. Collision detection — detect player‑hazard collisions, transition game phase to "gameover", and stop active gameplay.
8. Score handling — increase score on discrete events, render score at top‑left of canvas.
9. Rendering — clear canvas, draw background, hazards, player (high‑contrast), and HUD each frame.
10. Game‑over overlay — dim background, display "Game Over", final score, and "Press R or click Restart" instructions.
11. Observable contract — populate `window.__game` each frame with state, score, player position/visibility, and objective sentence.
12. Audio integration — lazily initialize AudioContext in a beep() helper wrapped in try/catch; hook sound effects into hit, score, and death events.