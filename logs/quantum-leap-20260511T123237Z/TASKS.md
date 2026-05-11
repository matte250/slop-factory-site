1. HTML Scaffold + meta.json — create index.html with header, canvas, restart button and empty script, and matching meta.json file following CONVENTIONS.md.
2. Game State Objects — define player, hazards, score, and phase objects with initial values at top of script.
3. Main Loop — implement requestAnimationFrame loop with startLoop/stop functionality, clearing canvas each frame.
4. Input System — set up keys Set with keydown/keyup listeners, R-key restart, and restart button click hook to reset().
5. Player Movement — implement dt‑based physics using inputs, enforce max speed and friction, ensure controls affect player state.
6. Hazard System — define hazard data structure, spawn logic with SAFE_RADIUS at start, dt‑scaled motion.
7. Collision Detection — detect player‑hazard collisions, switch phase to gameover and stop gameplay.
8. Scoring — increase score on discrete events, draw score on canvas top‑left each frame.
9. Rendering — draw background, hazards, player (high contrast), HUD; ensure canvas clears each frame.
10. Game‑Over Overlay — dim background, show “Game Over”, final score, and restart instructions.
11. Observable Contract — populate window.__game with state, score, player position/visibility, and objective each frame.
12. Audio — lazy‑init AudioContext, beep() helper, hook sound effects to hit, score, death events.
13. Polish & Edge Cases — ensure restart fully cancels prior loop, enforce dt clamping, handle loop errors, verify meta.json matches header.
14. Final Validation — run a quick sanity check: page loads without errors, visible canvas content, controls work, observable contract present.