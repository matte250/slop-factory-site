1. HTML scaffold & meta.json — create index.html with header, canvas, restart button, empty script block; add meta.json matching title, description, controls, tags.
2. Game state initialization — define player, hazards array, score, phase, constants, and input set at top of script.
3. Main loop setup — implement startLoop with cancelAnimationFrame, requestAnimationFrame loop, try/catch, clear canvas each frame.
4. Input handling — add keydown/keyup listeners to populate keys Set; map lane‑shift key and R‑key restart; add click listener on restart button; implement reset() that re‑initializes state and restarts loop.
5. Player movement — implement lane shifting (wrap around three lanes) on input, update player position each frame, expose via window.__game.
6. Hazard system — create hazard objects, spawn logic respecting SAFE_RADIUS and initial safety period, move hazards toward player using dt‑scaled motion.
7. Collision detection — detect player‑hazard overlap, on hit transition to "gameover" phase and stop gameplay.
8. Scoring — increase score on passed hazards or successful lane changes, render score on canvas top‑left.
9. Rendering — clear canvas, draw background, lanes, hazards, player (high‑contrast neon), and HUD each frame.
10. Game‑over overlay — dim background, draw "Game Over", final score, and restart instructions.
11. Observable contract — populate window.__game each frame with state, score, player.x/y/visible, and objective string.
10. Audio — lazy‑init AudioContext, add beep() helper, play sounds for lane shift, score, and collision events.