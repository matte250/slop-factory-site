1. HTML scaffold & meta.json — create index.html with required structure and matching meta.json.
2. Core constants & state objects — define game constants and initialize player, hazards, score, and game state.
3. Animation loop skeleton — implement startLoop with requestAnimationFrame, cancel logic, and canvas clearing.
4. Input handling — set up keys Set, keydown/keyup listeners, and bind R key and restart button to reset.
5. Reset function — reinitialize all game variables, cancel prior loop, and start a fresh loop.
6. Player movement & auto‑advance — dt‑based forward motion, lateral movement, friction, and position updates.
7. Size toggle & cooldown — add tap/space handler to toggle size between tiny and large, enforce cooldown timer.
8. Hazard spawning system — create hazards with safe‑radius check, spawn timer, and random obstacle types.
9. Hazard movement & cleanup — update hazard positions each frame and remove off‑screen hazards.
10. Collision detection & game‑over transition — detect collisions based on current size, set state to "gameover" and stop gameplay.
11. Scoring mechanics — increase score on survived obstacles, destroyed blocks, and combos; update HUD.
12. Rendering — draw background, hazards, player (high contrast), and score HUD each frame.
13. Game‑over overlay — dim canvas, display "Game Over", final score, and restart instructions.
14. Observable contract — populate window.__game with state, score, player position/visibility, and objective each frame.
15. Audio feedback — implement lazy‑init beep() using AudioContext and play sounds for hits, scoring, and death.