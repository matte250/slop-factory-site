## Concept
The player controls a single dot that can toggle between a large and a small size. Large size smashes low obstacles, while small size slips through narrow gaps. Timing the size changes creates a satisfying rhythm of break‑and‑sneak.

## Player
A simple glowing dot that moves forward automatically. The player can *move* (steer left/right) and *toggle size* (tap or click). No explicit speed or distance values are needed; the experience focuses on the binary size decision.

## Core loop
The game constantly scrolls obstacles toward the player. Every 1–3 seconds a new obstacle appears, and the player must quickly read its shape, decide whether to stay large to smash it or shrink to weave through it, and execute the toggle. Successful decisions keep the flow alive; mistakes end the run.

## Hazards / Obstacles
- **Low barriers** – short, wide obstacles that block the path for a small dot but are destroyed when the player is large.
- **Narrow gaps** – tall, thin openings that a large dot cannot fit through, but a small dot can pass unharmed.
- **Mixed formations** – combinations of low and narrow sections that require multiple rapid size toggles.

## Score
The score increases each time an obstacle is cleared—whether by smashing a low barrier or slipping through a narrow gap. Bonus points reward consecutive successful toggles without error.

## Win and lose
The player loses when colliding with an obstacle using the wrong size, triggering a “Game Over” overlay with the final score and restart prompt. The player wins after surviving a predefined distance/time (e.g., completing the final wave), showing a celebratory victory screen.

## Feel
A fast‑paced, reflex‑driven arcade vibe with a minimalist neon aesthetic: a glowing dot against a dark backdrop, bright flashes on successful smashes, and crisp audio beeps for each toggle. The rhythm is steady enough to learn but frantic enough to challenge.

## Why it's fun
The hook is the instant, satisfying contrast between crushing obstacles with a big smash and slipping through tight spaces with a quick shrink—each toggle feels like a punch of control and surprise.
