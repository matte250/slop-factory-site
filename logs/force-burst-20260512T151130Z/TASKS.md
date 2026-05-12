1. HTML scaffold + meta.json — add required header, canvas, restart button, empty script block and matching meta.json.
2. Game state objects — define plain objects for player, hazards, score, and phase at top of script with initial values.
3. requestAnimationFrame loop — implement startLoop with cancelAnimationFrame, loop body with try/catch, update(dt) and render() calls, clear canvas.
4. Input handling — set up a keys Set with keydown/keyup listeners, R key restart and restart button trigger reset().
5. Player movement — implement dt‑based physics for player based on key inputs; ensure controls affect player state.
6. Hazards — create hazard data structure, spawning respecting SAFE_RADIUS, and motion scaled by dt.
7. Collision detection — detect player‑hazard collisions, transition state to "gameover" and stop gameplay.
8. Score — increment score on discrete events and draw it at the top‑left of the canvas.
9. Render — clear canvas, draw background, hazards, player, and HUD; keep player high‑contrast.
10. Game‑over overlay — dim background, display "Game Over", final score, and restart instructions.
11. Observable contract — expose window.__game with state, score, player position/visibility, and objective each frame.
12. Audio — lazily initialise AudioContext, provide beep() helper, and hook sounds to hit, score, and death events.