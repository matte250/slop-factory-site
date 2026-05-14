1. HTML scaffold + meta.json — create `index.html` with required header, canvas, restart button, and empty script block; generate `meta.json` matching header text.
2. Game state initialization — define player object, split state, hazards array, score, phase, keys set, and constants (canvas size, speeds, split duration, safe radius) at top of script.
3. Main loop implementation — add `startLoop` with `cancelAnimationFrame`, dt calculation, try/catch, and calls to `update(dt)` and `render()`; clear canvas each frame.
4. Input handling — add `keydown`/`keyup` listeners to populate a `keys` Set; add click listener on restart button; implement `reset()` and map `R` key to it.
5. Player movement — implement dt‑scaled lateral movement based on arrow keys/WASD, clamp position within canvas bounds, update visibility flag.
6. Split mechanic — on tap or space key, activate split: create twin positions offset horizontally, start split timer, auto‑merge after duration, adjust rendering and collision checks.
7. Hazard generation — spawn offset‑gap walls and other obstacles respecting `SAFE_RADIUS` and initial safety period; schedule spawns using dt‑scaled timers.
8. Hazard movement — move hazards leftward (world scroll) each frame, removing off‑screen hazards.
9. Collision detection — detect collisions between player (or split halves) and hazards/lasers; on hit transition `phase` to "gameover" and stop active gameplay.
10. Scoring system — increase score when a wall is cleared, award bonus for successful split usage; draw score on canvas top‑left.
11. Rendering — clear canvas, draw background, hazards, player (and split halves), and HUD; ensure player is highest‑contrast element.
12. Game‑over overlay — dim background, display "Game Over" with final score and restart instructions on canvas.
13. Observable contract — populate `window.__game` each frame with `state`, `score`, `player` (x, y, visible), and `objective` description.
14. Audio integration — lazy‑init `AudioContext` in a `beep()` helper; wrap in try/catch and trigger sounds on split, score, and hit events.