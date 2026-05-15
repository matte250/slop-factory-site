1. HTML scaffold + meta.json — create index.html with header, canvas, restart button, stub script; create meta.json matching header text.
2. Game state objects — define player, hazards, score, phase objects at top of script with initial values.
3. Animation loop — implement startLoop() using requestAnimationFrame with cancel, try/catch, clear canvas, call update(dt) and render().
4. Input handling — create keys Set, keydown/keyup listeners, R-key restart hook, restart button click hook calling reset().
5. Player movement — dt‑based physics: accelerate left/right on key press, cap speed, apply friction, clamp to canvas bounds.
6. Hazards data & spawning — define hazard structure, spawn rules with safe radius from player, dt‑scaled motion.
7. Collision detection — detect collisions between player and hazards, on hit set phase to "gameover" and stop gameplay.
8. Score system — increase score on events, draw score at top‑left of canvas.
9. Rendering — clear canvas, draw background, hazards, player (high contrast), HUD.
10. Game‑over overlay — dim background, show "Game Over", final score, prompt "Press R or click Restart".
11. Observable contract — expose window.__game each frame with state, score, player position/visibility, objective description.
12. Audio integration — lazy‑init AudioContext, beep() helper, add sound effects for hit, score, death events.