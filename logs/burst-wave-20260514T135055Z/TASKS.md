1. HTML Scaffold & Meta — Create index.html with h1, description, controls list, canvas, restart button; add empty <script> and matching meta.json.
2. Game State Objects — Define plain object literals for player, hazards, score, and phase at top of script with initial values.
3. Animation Loop — Implement startLoop() using requestAnimationFrame, cancel previous frame, wrap loop body in try/catch, clear canvas each frame.
4. Input Handling — Set up a Set `keys` for keydown/keyup, add R-key restart hook, and click handler for Restart button calling a shared reset().
5. Player Movement — Apply dt‑based physics: accelerate based on arrow keys, enforce max speed, apply friction, clamp position to canvas bounds.
6. Hazards System — Define hazard data structure, spawn logic with SAFE_RADIUS to avoid initial overlap, and dt‑scaled motion.
7. Collision Detection — Detect player‑hazard collisions, transition `phase` to "gameover" and stop gameplay loop.
8. Scoring — Increment score on defined events, render numeric score at top‑left of canvas.
9. Rendering — Clear canvas, draw background, hazards, player (high contrast), and HUD each frame.
10. Game‑Over Overlay — Dim background, show “Game Over”, final score, and prompt “Press R or click Restart”.
11. Observable Contract — Expose `window.__game` each frame with state, score, player position/visibility, and a short objective string.
12. Audio Effects — Lazy‑init AudioContext in a beep() helper, wrap calls in try/catch, trigger sounds on hit, score, and death events.