## Concept
A moving gravity well sweeps across the screen, constantly pulling a single dot toward it. By tapping the screen you shift the well up or down, steering the dot through an endlessly scrolling tunnel of obstacles.

## Player
The player controls a glowing dot (the avatar) that is passively drawn toward the gravity well. The only player action is tapping (or clicking) to move the well vertically, which in turn steers the dot. Verbs: pull, steer, dodge.

## Core loop
Every 1–3 seconds a new section of the tunnel scrolls forward while the gravity well continues its horizontal sweep. The player watches the dot being tugged toward the well and decides whether to tap to raise or lower the well, thereby guiding the dot through the upcoming gap. Surviving each segment grants a score bump and the tunnel becomes tighter, increasing tension.

## Hazards / Obstacles
- **Scrolling barriers**: Fixed blocks that form the tunnel walls, moving from right to left. Gaps appear at varying vertical positions.
- **Spiked protrusions**: Small spike shapes that jut outward from the barrier walls, requiring precise vertical positioning to avoid.
- **Horizontal sweepers**: Fast-moving bars that cross the tunnel from top to bottom, briefly blocking larger sections of the path.
All hazards are passive; they do not chase the dot but the dot’s trajectory can intersect them if the well is not positioned correctly.

## Score
- Each time the dot successfully passes through a tunnel segment without collision, the player earns points.
- Bonus points are awarded for narrowly threading between spikes or for maintaining a streak of consecutive segments.
- The score is displayed constantly on the canvas.

## Win and lose
- **Lose**: The dot collides with any part of a barrier, spike, or sweeper, triggering a Game Over overlay.
- **Win**: After surviving a predefined number of tunnel segments (or reaching a target score), the player completes the level and sees a Victory overlay.
Both outcomes pause the game and present a restart prompt.

## Feel
The game feels tense and rhythmic, with a steady increase in difficulty as gaps narrow and obstacles become more frequent. A dark, star‑filled background with neon cyan and magenta accents gives a futuristic space vibe, while a subtle chiptune soundtrack underscores each tug and collision.

## Why it's fun
The delight comes from the delicate balance of pulling the dot with the moving well while racing to thread through ever‑tighter gaps, turning each tap into a high‑stakes maneuver.