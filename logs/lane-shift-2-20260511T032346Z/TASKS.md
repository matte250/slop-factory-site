1. HTML scaffold and meta.json – create index.html with required header, canvas, restart button, empty script block, and a matching meta.json with title, description, controls, tags.
2. Game state objects – define player, hazards array, score, phase/state, and constants (canvas size, lanes, safe radius) at top of script.
3. Animation loop – implement startLoop() with cancelAnimationFrame discipline, dt calculation, try/catch, calling update(dt) and render() each frame.
4. Input handling – set up a Set of pressed keys, keydown/keyup listeners for left/right arrows (or A/D) and R key, plus click listener on restart button; both invoke a reset() function.
5. Player movement – apply dt‑based horizontal acceleration from left/right inputs, friction, clamp position within canvas bounds, and expose player.x/y/visible.
6. Hazard system – create hazard objects with lane position and width, spawn timer with safe‑radius check, and dt‑scaled downward motion.
7. Collision detection – check player against hazards each frame; on hit set state to "gameover" and stop the active gameplay loop.
8. Scoring – increment score when a hazard passes the player without collision, and draw the current score on the canvas.
9. Rendering – clear canvas, draw background, hazards, player (high‑contrast neon dot), and HUD elements each frame.
10. Game‑over overlay – dim the canvas and render "Game Over" with final score and restart instructions.
11. Observable contract – populate window.__game each frame with state ("playing"|"gameover"), score, player position/visibility, and a one‑sentence objective description.
12. Audio – add a lazy‑init beep() helper using AudioContext, wrapped in try/catch, and trigger sounds on score, shift, and death events.