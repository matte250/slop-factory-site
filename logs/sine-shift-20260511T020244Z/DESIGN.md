## Concept
The player controls a dot that automatically moves forward while bobbing in a sinusoidal vertical wave. Each tap instantly advances the wave’s phase, shifting the dot up or down to line up with gaps in incoming obstacles.

## Player
The avatar is a small glowing dot that continuously moves forward. Player verbs: tap (or click) to shift the wave’s phase, causing the dot to jump up or down within its sine motion.

## Core loop
Every 1–3 seconds the dot advances a short distance while its vertical position follows a sine wave. New obstacles with a single gap appear ahead. The player watches the approaching gap, decides when to tap, and instantly shifts the dot’s phase to line up with the opening. Successfully passing the gap awards points; a mistimed tap leads to a collision.

## Hazards / Obstacles
- **Vertical walls with a moving gap** that scroll toward the player; the gap’s vertical position follows a sine pattern offset from the player’s wave.
- **Rotating spikes** that sweep across the lane at regular intervals, requiring precise timing to avoid.
- **Static blocks** that appear briefly at random heights, forcing the player to adjust phase quickly.
All hazards are designed to test the player’s timing and phase‑shifting skill.

## Score
- Passing a gap without collision.
- Executing a successful phase shift that aligns the dot with a gap.
- Maintaining a combo of consecutive successful shifts, which adds a multiplier bonus.
Points are displayed continuously on the canvas.

## Win and lose
- **Lose**: The dot collides with any part of an obstacle, triggering a Game Over overlay that shows the final score and restart instructions.
- **Win**: The player reaches a predefined distance (or survives a set time) and a Victory overlay celebrates the achievement.

## Feel
A steady, rhythm‑driven pace with a meditative bounce. Minimalist neon aesthetics on a dark background create a futuristic glow. Sound consists of a soft synth blip on each tap and a subtle whoosh on successful passes, reinforcing the timing feedback.

## Why it's fun
The satisfying snap of the dot to a new height exactly when a gap opens creates a perfect‑timing moment that feels like a rhythmic high‑five.