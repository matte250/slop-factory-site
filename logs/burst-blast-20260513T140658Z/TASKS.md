1. HTML Scaffold & Meta — Create index.html with header (h1, description, controls), canvas, restart button, empty <script> block; add matching meta.json file.
2. Game State Objects — Define player, hazards, score, and phase objects at top of script with initial values.
3. Animation Loop — Implement startLoop using requestAnimationFrame, cancel previous loop, call update(dt) and render() inside try/catch; clear canvas each frame.
4. Input Handling — Set up a keys Set with keydown/keyup listeners, add R-key restart hook and restart button click hook calling reset().
5. Player Movement — Implement dt‑based physics: acceleration on arrow keys, max speed, friction, clamp position to canvas bounds; ensure controls affect state.
6. Hazards System — Create hazard data structure, spawn rules respecting SAFE_RADIUS to avoid player spawn, and dt‑scaled motion.
7. Collision Detection — Detect player‑hazard collisions, switch phase to "gameover" and stop gameplay on hit.
8. Scoring — Increment score on defined events, render score text at top‑left of canvas.
9. Rendering — Clear canvas, draw background, hazards, player (high contrast), and HUD each frame.
10. Game‑Over Overlay — Dim screen, display "Game Over" with final score and restart instructions (Press R or click Restart).
11. Observable Contract — Populate window.__game each frame with state ("playing"|"gameover"), score, player {x,y,visible}, and a short objective description.
12. Audio Integration — Lazy‑initialize AudioContext in a beep() helper, wrap in try/catch, trigger sounds on hit, scoring, and death events.