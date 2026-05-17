1. HTML scaffold + meta.json — create index.html with required header, canvas, restart button and empty script block; create meta.json matching header information.
2. Game state objects — define player, hazards, score, phase, and input structures as plain object literals at the top of the script.
3. Main loop implementation — add startLoop() with cancelAnimationFrame handling, a requestAnimationFrame loop wrapped in try/catch that calls update(dt) and render().
4. Input handling — set up a keys Set with keydown/keyup listeners; add R-key and restart button hooks that call a shared reset() function.
5. Player movement — implement dt‑scaled physics for acceleration, max speed, friction, and canvas bounds; ensure movement updates visible player coordinates.
6. Hazard system — create data structures for obstacles, spawn rules respecting SAFE_RADIUS at t=0, and dt‑scaled motion for each hazard type.
7. Collision detection — check player vs hazards each frame; on collision set state to "gameover" and stop active gameplay.
8. Scoring — increase score on discrete events (e.g., passing a hazard or successful field activation) and render the score at the top‑left of the canvas.
9. Rendering — clear canvas, draw background, hazards, player (high‑contrast neon), and HUD elements each frame.
10. Game‑over overlay — dim the background and display "Game Over" with final score and restart instructions.
11. Observable contract — populate window.__game each frame with state, score, player position/visibility, and a concise objective sentence.
12. Temporal field ability — implement tap/click activation that creates a short‑lived field freezing nearby obstacles; include cooldown logic.
13. Audio integration — lazy‑initialize AudioContext in a beep() helper and trigger sounds for hit, score, and field activation, wrapped in try/catch.
14. Final polish & verification — fine‑tune constants (speeds, durations, cooldowns), ensure no console errors, and confirm meta.json matches the header text.
