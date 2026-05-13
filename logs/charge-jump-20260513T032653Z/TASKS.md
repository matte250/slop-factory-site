1. HTML scaffold + meta.json — Create index.html containing a header (h1 and description), controls list, canvas element, and a restart button; add a stub <script> tag; generate meta.json matching the header text.
2. Game state objects — Define top-level plain objects for player (position, velocity, visible), hazards (array), score (number), and phase (\"playing\" | \"gameover\") with initial values.
3. Game loop — Implement startLoop() that uses requestAnimationFrame, tracks loopId, cancels previous loops, wraps update(dt) and render() in try/catch, and clears the canvas each frame.
4. Input handling — Set up a `keys` Set updated by document keydown/keyup events; map R key and restart button click to a shared reset() function.
5. Player movement — In update(dt), apply dt‑scaled acceleration based on arrow keys, enforce a MAX_SPEED, add friction when no input, and clamp position within canvas bounds.
6. Hazards system — Create a hazards data structure, spawn rules that respect a SAFE_RADIUS around the player at t=0, and move hazards each frame with dt scaling.
7. Collision detection — Detect player‑hazard overlap; on hit transition phase to \"gameover\" and stop gameplay updates.
8. Score tracking — Increment score on defined events, render the numeric score at the top‑left of the canvas each frame.
9. Rendering — Clear canvas, draw background, iterate hazards to draw them, draw the player (high‑contrast color), and render HUD elements (score, charge indicator).
10. Game‑over overlay — Dim the canvas, display \"Game Over\" text, final score, and prompt \"Press R or click Restart\".
11. Observable contract — Populate `window.__game = { state, score, player: {x, y, visible}, objective }` each frame; set `objective` to a concise single‑sentence description.
12. Audio integration — Lazily create an AudioContext in a beep() helper, wrap usage in try/catch, and trigger sound on hit, scoring, and death events.