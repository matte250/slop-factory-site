1. HTML scaffold + meta.json — create index.html with required header, canvas, restart button, stub script block, and generate meta.json matching header text.
2. Game state objects — define player, hazards, score, and phase objects with initial values at top of script.
3. requestAnimationFrame loop — implement startLoop() with cancelAnimationFrame, try/catch, update(dt) and render(), clearing canvas.
4. Input handling — add keys Set, keydown/keyup listeners, R-key and restart button click calling a shared reset() function.
5. Player movement — dt‑based physics for dot auto‑advancing, swap between inner/outer ring on tap/click, ensure controls affect movement.
6. Ring and gap mechanics — data structures for two rotating rings, generate moving gaps, enforce SAFE_RADIUS for initial gap placement.
7. Hazard spawning and motion — spawn solid segments and rotating blockers, ensure they respect SAFE_RADIUS and move with dt scaling.
8. Collision detection & game over — detect dot vs hazards, transition to "gameover" state, stop active gameplay loop.
9. Scoring system — increase score on successful gap passes, display score on canvas top‑left.
10. Rendering — clear canvas, draw background, rings, gaps, player dot (high contrast), and HUD each frame.
11. Game‑over overlay — dim background, draw "Game Over", final score, and restart instructions on canvas.
12. Observable contract & audio — populate window.__game each frame with state, score, player visibility, objective; add lazy‑init beep() using AudioContext for hit/score/death events.