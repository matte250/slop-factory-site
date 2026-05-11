1. Scaffold HTML & meta.json — create `index.html` with required header, canvas, restart button, style and script blocks, and generate `meta.json` matching the header text and control list.
2. Define game constants and state objects — set up canvas dimensions, safe radius, wave parameters, and initialize player, hazards array, score, phase, and state objects at the top of the script.
3. Implement the main animation loop — write `startLoop()` that cancels any existing loop, uses `requestAnimationFrame` with a try/catch body that calls `update(dt)` and `render()`, and stores the loop ID.
4. Set up input handling — create a `keys` Set, add `keydown`/`keyup` listeners for phase‑shift keys (e.g., Space), R key for restart, add click listener on the restart button, and implement a unified `reset()` function.
5. Add player wave motion and phase shift — in `update(dt)` advance the player’s horizontal position, compute vertical sinusoidal position from current phase, and on tap instantly adjust phase to shift the dot up or down.
6. Create hazard data structures and spawning — define hazard objects with position and gap phase, implement a timer that spawns hazards respecting `SAFE_RADIUS` and initial safe period.
7. Animate hazards — move hazards toward the player each frame, scaling motion by `dt`.
8. Detect collisions — check player‑hazard overlap each frame; on collision set state to "gameover" and stop the gameplay loop.
9. Implement scoring — increase score when the player successfully passes a hazard gap, and draw the current score on the canvas.
10. Render all visuals — clear the canvas, draw background, hazards, player dot (high‑contrast neon), and HUD elements each frame.
11. Add game‑over overlay — dim the background and render "Game Over" with final score and restart instructions.
12. Expose observable contract — populate `window.__game` each frame with `state`, `score`, `player` (x, y, visible), and an `objective` sentence.
13. Add audio feedback — create a lazy‑initialized `AudioContext` in a `beep()` helper, and play sounds on tap, score events, and death, wrapping calls in try/catch.