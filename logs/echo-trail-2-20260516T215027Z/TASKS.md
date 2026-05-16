1. HTML scaffold + meta.json — create header (h1, description, controls list), canvas, restart button per CONVENTIONS.md, stub <script> block, and generate matching meta.json file.
2. Game state objects — define player, hazards, score, and phase as plain object literals at the top of the script with initial values.
3. Animation loop — implement startLoop() using requestAnimationFrame with cancelAnimationFrame handling, wrap loop body in try/catch, call update(dt) and render(); clear canvas only.
4. Input handling — set up a keys Set populated by document keydown/keyup listeners, add R-key restart hook and restart button click hook, both invoking reset().
5. Player movement — implement dt‑based physics using key inputs, apply acceleration, cap at MAX_SPEED, apply friction, and clamp player position to canvas bounds.
6. Hazards — create hazard data structure, spawn rules with SAFE_RADIUS to avoid player at t=0, and motion scaled by dt.
7. Collision detection — detect player vs hazards collisions; on hit transition phase to "gameover" and stop active gameplay.
8. Score — increase score on discrete events, draw the score on the canvas at the top‑left.
9. Render — clear canvas, draw background, hazards, player (high‑contrast), and HUD each frame.
10. Game‑over overlay — dim background, display "Game Over", final score, and "Press R or click Restart" prompt.
11. Observable contract — populate window.__game each frame with { state, score, player:{x,y,visible}, objective } where state is "playing" | "gameover" and objective is a concise description.
12. Audio — lazily initialise AudioContext in a beep() helper wrapped in try/catch, and hook beep calls into hit, score, and death events.