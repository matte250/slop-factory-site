1. HTML scaffold & meta.json — create index.html with header, canvas, restart button per CONVENTIONS.md and a matching meta.json file.
2. Game state initialization — declare player, hazards array, score, phase, constants (SAFE_RADIUS, slowdownDuration) at top of script.
3. Animation loop — implement startLoop() using requestAnimationFrame, cancel previous frame, try/catch, clear canvas each tick.
4. Input handling — add keys Set with keydown/keyup listeners, R key and restart button to call reset().
5. Player physics — update player position each frame using dt, enforce bounds, keep player always moving forward at constant speed.
6. Temporal slowdown — detect tap/click to trigger a brief reduction of global obstacle speed for slowdownDuration while player speed stays unchanged.
7. Hazard spawning — implement spawn timer, generate hazards outside SAFE_RADIUS, ensure initial safe period.
8. Hazard movement — update hazard positions each frame scaled by dt and current speed factor (affected by slowdown).
9. Collision detection — check player-hazard overlap, on hit set phase to "gameover" and stop gameplay.
10. Scoring system — increase score when player successfully passes a hazard during slowdown or after each hazard cleared, draw score on canvas.
11. Rendering — draw background, hazards, player (high contrast), HUD, and clear canvas each frame.
12. Game‑over overlay — dim screen, display "Game Over", final score, and restart instructions on canvas.
13. Observable contract — populate window.__game each frame with state, score, player.x/y/visible, and a short objective string.
14. Audio feedback — lazily create AudioContext, play beep on hit, score, and death events, wrapped in try/catch.