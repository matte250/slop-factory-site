1. HTML scaffold & meta.json — create `index.html` with header, canvas, restart button per CONVENTIONS.md and matching `meta.json` file.
2. Game state initialization — declare player object, obstacles array, score, phase, split flag, lane constants and SAFE_RADIUS at script top.
3. Animation loop setup — implement `startLoop` with `cancelAnimationFrame`, `requestAnimationFrame`, dt calculation, try/catch, and canvas clearing.
4. Input handling — add `click`/tap listener to toggle split/merge, `keydown`/`keyup` for lane slide when split, and `R` key + restart button to call reset.
5. Player movement & split/merge logic — auto‑advance player forward each frame, create second dot on split, allow lateral slide of both dots within lanes, and merge back on tap.
6. Hazard definitions & spawning — define hazard types (lane blockers, sweepers, gap sequences, speed ramps) and spawn rules that respect `SAFE_RADIUS` and avoid early unavoidable collisions.
7. Hazard motion — update hazard positions each frame using dt, remove off‑screen hazards.
8. Collision detection — check each active dot against hazards, transition to "gameover" on any collision and stop gameplay.
9. Score system — increment score on successful split survival, merges, and wave completions; draw score continuously on canvas.
10. Rendering — clear canvas, draw background, hazards, player (single or split), and HUD; ensure player dots have highest contrast.
11. Game‑over overlay — dim background, display "Game Over", final score, and restart instructions on canvas.
12. Observable contract — populate `window.__game` each frame with `state`, `score`, player positions, visibility flag, and a concise objective string.
13. Audio system — lazily create `AudioContext` in a `beep()` helper and trigger sounds on split, merge, score events, and death.
14. Restart functionality — implement `reset()` to clear all state, cancel any existing loop, and start a fresh loop.
