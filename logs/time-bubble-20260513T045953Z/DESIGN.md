## Concept
The player guides a glowing dot through an ever‑flowing tunnel, tapping to generate a short‑lived bubble that slows every obstacle inside it, letting the dot slip through densely packed sections before the bubble fades and must recharge.

## Player
- **Avatar**: a simple, luminous dot that continuously moves forward through the tunnel.
- **Actions**: 
  - *Move*: subtle lateral shifts to align with gaps (left/right or mouse drag).
  - *Create bubble*: tap / click (or press a dedicated key) to spawn a temporary slowing field around the dot.
  - *Restart*: press a key or click the restart button to begin again.
The player never directly controls obstacle speed; they only manage timing of the bubble.

## Core loop
Every few seconds the player scans the upcoming passage, sees a cluster of obstacles, and decides whether to deploy the bubble. If the bubble is active, all obstacles inside it move slower, creating a brief window to thread through. The bubble then fades, entering a short recharge period during which the player must rely on precise movement. Obstacles continuously scroll forward, the score ticks upward with each cleared segment, and the tension of bubble timing drives the moment‑to‑moment gameplay.

## Hazards / Obstacles
- **Sweeping shards**: fast horizontal elements that cut across the tunnel, leaving narrow safe lanes.
- **Closing walls**: pairs of walls that slide inward to narrow the passage, then retreat.
- **Rotating blades**: radial obstacles that spin around a fixed point, sweeping any space they occupy.
- **Particle storms**: dense clouds that drift forward, preventing progress unless slowed by the bubble.
All hazards move with the tunnel’s base speed; when inside the bubble they are temporarily slowed, giving the player a brief reprieve.

## Score
- *Segment cleared*: each time the player passes a predefined checkpoint without collision.
- *Bubble success*: using a bubble to survive a dense cluster awards a bonus.
- *Pickup collected*: occasional time‑extension or score token that appears only when the bubble is active.
Score is displayed continuously and only changes on these discrete events.

## Win and lose
- **Lose**: the dot collides with any obstacle while the bubble is inactive (or the bubble has expired and the obstacle catches the player). The screen shows a Game Over overlay with final score and restart prompt.
- **Win**: survive through a set number of segments or reach a distant “safe zone” at the tunnel’s end, triggering a celebratory overlay and final score.

## Feel
Frantic, neon‑lit tunnel racing with a pulse‑driven synth soundtrack. The aesthetic is high‑contrast neon on a dark background, with glowing trails and subtle particle effects. Audio cues punctuate bubble activation, obstacle proximity, and scoring events, reinforcing the tense, fast‑paced experience.

## Why it's fun
The exhilaration of timing a fleeting bubble to carve a path through a relentless gauntlet creates a crisp, satisfying moment of control and relief.