1. HTML scaffold and meta.json — create index.html with header, description, controls list, canvas, restart button, empty script block, and matching meta.json file with title, description, and controls.
2. Game state objects — define plain object literals for player, hazards array, score, phase, and constants at top of script, setting initial values.
3. RequestAnimationFrame loop — implement startLoop() with cancelAnimationFrame discipline, try/catch around loop body, call update(dt) and render() each frame, initially only clearing the canvas.
4. Input handling — add a keys Set populated by document keydown/keyup listeners, R-key restart hook, and restart button click handler both invoking a shared reset() function.
5. Player movement — apply dt‑based physics: constant gravity pulling down, horizontal auto‑scroll, tap‑triggered upward thrust, update position each frame, enforce canvas bounds.
6. Hazards system — create data structure for obstacles, spawn rules ensuring SAFE_RADIUS around player at t=0, dt‑scaled motion for moving hazards.
7. Collision detection — detect player‑hazard overlap, on hit set phase to "gameover" and stop active gameplay loop.
8. Score handling — increase score on discrete events (e.g., passing a hazard), draw current score on canvas top‑left each frame.
9. Rendering — clear canvas, draw background, hazards, player (high‑contrast), and HUD elements.
10. Game‑over overlay — dim background, display "Game Over", final score, and "Press R or click Restart" instructions.
11. Observable contract — populate window.__game each frame with state ("playing"|"gameover"), score, player position/visibility, and a short objective sentence.
12. Audio support — lazily initialize AudioContext in a beep() helper, wrap in try/catch, play tones on hit, score, and death events.