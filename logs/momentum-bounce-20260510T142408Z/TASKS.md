1. HTML scaffold + meta.json — Create index.html with header, description, controls list, canvas, restart button, and an empty script tag; also add a meta.json file matching the header text.
2. Game state objects — Define plain object literals for player, hazards, score, and phase at the top of the script with appropriate initial values.
3. requestAnimationFrame loop — Implement startLoop() that uses cancelAnimationFrame, wraps the loop body in try/catch, and calls update(dt) and render() while clearing the canvas.
4. Input handling — Set up a keys Set populated by document keydown/keyup events; add R-key restart hook and restart button click hook that both call a reset() function.
5. Player movement — Implement dt‑based physics for player using the keys Set; ensure each control listed in meta.json changes the corresponding player property.
6. Hazards data structure — Create a hazards array with spawn rules, including a SAFE_RADIUS to avoid spawning on the player at t=0, and implement dt‑scaled motion.
7. Collision detection — Detect player vs hazard collisions; on hit transition phase to "gameover" and stop active gameplay.
8. Score system — Increment score on discrete events and render the score at the top‑left of the canvas.
9. Rendering — Clear the canvas, draw background, hazards, player (as the highest‑contrast object), and HUD elements.
10. Game‑over overlay — Display a dimmed background with "Game Over", final score, and "Press R or click Restart" prompt.
11. Observable contract — Populate window.__game each frame with { state, score, player:{x,y,visible}, objective } where state is "playing" | "gameover" and objective is a concise description.
12. Audio integration — Add a lazy‑initialized AudioContext in a beep() helper, wrapped in try/catch, and trigger sounds on hit, scoring, and death events.