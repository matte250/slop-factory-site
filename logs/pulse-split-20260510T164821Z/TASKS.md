1. HTML Scaffold & Meta — Create index.html with header, description, controls list, canvas, restart button, and an empty script tag; add matching meta.json.
2. Core State Objects — Define plain object literals for player, hazards, score, and phase at top of script with initial values.
3. Main Loop Setup — Implement startLoop() using requestAnimationFrame, manage loopId, wrap loop body in try/catch, call update(dt) and render().
4. Input Handling — Add a keys Set with keydown/keyup listeners, implement R-key restart hook and restart button click calling a shared reset() function.
5. Player Physics — Implement delta‑time based movement using keys input, with acceleration, max speed, friction, and canvas bounds clamping.
6. Hazard System — Create hazard data structure, spawn logic ensuring SAFE_RADIUS from player start, and dt‑scaled motion.
7. Collision Detection — Detect player‑hazard collisions, transition phase to "gameover", and halt gameplay updates.
8. Scoring Mechanism — Increment score on defined events, render numeric score at top‑left of canvas.
9. Rendering Pipeline — Clear canvas, draw background, hazards, player (high contrast), and HUD elements each frame.
10. Game‑Over Overlay — Dim screen, show "Game Over", final score, and prompt "Press R or click Restart".
11. Observable Contract — Populate window.__game each frame with state, score, player visibility/position, and an objective description string.
12. Audio Integration — Lazy‑initialize AudioContext in a beep() helper, wrap in try/catch, and trigger sounds on hit, score, and death events.