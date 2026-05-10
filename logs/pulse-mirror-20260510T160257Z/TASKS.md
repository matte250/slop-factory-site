1. HTML Scaffold — Create index.html with header, description, controls list, canvas, restart button per CONVENTIONS.md and stub script tag; add matching meta.json.
2. Game State Objects — Define player, hazards, score, and phase objects with initial values at top of script.
3. Animation Loop — Implement startLoop() using requestAnimationFrame, cancel previous frame, wrap body in try/catch, call update(dt) and render() while clearing canvas.
4. Input Handling — Set up a Set for keys, add keydown/keyup listeners, R-key restart, and restart button click calling a common reset() function.
5. Player Movement — Add dt‑based physics for player using arrow keys, enforce max speed, friction, and clamp to canvas bounds; ensure controls appear in meta.json.
6. Hazard System — Create hazard data structure, spawn logic with SAFE_RADIUS to avoid player spawn, and dt‑scaled movement.
7. Collision Detection — Detect player‑hazard collisions, switch phase to "gameover" and halt gameplay.
8. Scoring — Increment score on defined events and render score text at top‑left of canvas.
9. Rendering — Clear canvas, draw background, hazards, player (high contrast), and HUD each frame.
10. Game‑Over Overlay — Dim screen, display "Game Over", final score, and restart instructions.
11. Observable Contract — Populate window.__game each frame with state, score, player visibility, and an objective description.
12. Audio System — Initialize AudioContext lazily in beep() helper, wrap calls in try/catch, and trigger sounds on hit, score, and death events.