# Scale Shift

## Concept
A simple tap toggles the player’s dot between a tiny and a large radius. The tunnel’s gaps are sized for one radius or the other, so the player must switch sizes at the right moment to thread each opening, creating a rhythmic challenge of timing and anticipation.

## Player
The avatar is a single circular dot that automatically moves forward through a scrolling tunnel. The player only controls its radius, toggling between “small” and “large” states with a tap or click.

## Core loop
Every 1–3 seconds a new tunnel segment approaches, its opening sized for either the small or the large dot. The dot continuously advances; the player watches the upcoming gap, decides whether to stay the current size or toggle, and hits the input. The game instantly applies the new radius, and the dot either passes cleanly or collides. Successful passes repeat the pattern, while difficulty subtly ramps up.

## Hazards / Obstacles
- **Mismatched gaps** – tunnel openings that only fit one radius; entering with the wrong size results in an immediate collision.
- **Moving barriers** – occasional rotating spikes or sliding blocks that require the correct radius to slip past.
- **Speed increase** – the tunnel scrolls faster over time, reducing reaction windows.

## Score
- +1 point for each gap successfully traversed.
- Bonus point for toggling within a tight timing window (e.g., less than 0.2 s before the gap reaches the dot).
- The current score is always displayed.

## Win and lose
- **Lose:** Collision with a tunnel wall or moving barrier triggers a “Game Over” overlay displaying the final score and restart instructions.
- **Win:** Survive a predefined number of gaps (e.g., 50) or reach a distance threshold, triggering a celebratory “You Win!” screen with a score summary.

## Feel
A fast‑paced, reflex‑driven arcade experience with a neon‑lit tunnel, dark background, and crisp synth stabs on each toggle. The game feels tense yet rewarding, encouraging a rhythm of anticipation and rapid response.

## Why it's fun
The satisfying “just‑in‑time” toggle that lets you slip through a seemingly impossible hole makes you grin, curse, and want to try again.
