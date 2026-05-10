## Concept
The player guides a continuously scrolling dot by tapping to rotate gravity 90° clockwise, causing the dot to fall in a new direction and threading it through rotating gaps in obstacles.

## Player
The avatar is a simple glowing dot that automatically moves forward. The only player verb is **rotate gravity** (tap or click), which instantly changes the direction of gravitational pull.

## Core loop
- The dot scrolls forward without input.
- Obstacles with gaps approach from ahead.
- The player watches the upcoming gap and decides the moment to tap, rotating gravity.
- The dot begins falling in the new direction; if it aligns with the gap it passes safely, otherwise it collides.
- After each successful passage the cycle repeats, with the next obstacle appearing shortly after.

## Hazards / Obstacles
- **Rotating wall sections**: walls with a single opening that rotate in sync with gravity; mistimed taps cause a collision.
- **Static spikes**: fixed protrusions that block certain fall directions; the player must avoid them by rotating at the right time.
- **Moving barriers**: sections that slide horizontally or vertically, creating dynamic gaps that require precise timing.
- **Gravity tunnels**: narrow corridors that only fit the dot when gravity points in the correct orientation.

## Score
- **Obstacle clearance**: each obstacle successfully navigated increments the score.
- **Perfect timing**: rotating gravity within a tight window before the gap aligns awards a bonus point.
- **Combo chain**: consecutive clearances without collision increase a multiplier that boosts the score per obstacle.

## Win and lose
- **Lose**: colliding with any part of an obstacle or falling out of the visible play area triggers a game‑over state.
- **Win**: after a predefined sequence of obstacles (e.g., the final “portal” segment) the dot reaches a finish zone, ending the game with a win screen.

## Feel
The game feels frantic and rhythmic, with a neon‑glow aesthetic against a dark backdrop. Quick, crisp beeps signal each gravity rotation, while a subtle synth pad underscores the tension. The pace accelerates as the player progresses, rewarding reflexes and timing.

## Why it's fun
A single tap can flip the world, and threading the dot through ever‑shifting gaps creates an addictive, edge‑of‑your‑seat moment that makes players grin, gasp, or shout.