## Concept
The player constantly moves forward through a corridor and can tap to spawn an echo that retraces the exact path the player just traveled, clearing any obstacles it contacts while the player keeps moving. The satisfaction comes from planning a route, then watching the echo rip through hazards you just avoided.

## Player
A glowing cursor or ship that always progresses forward on a dark neon‑lit track. The player steers laterally (or up/down) to dodge obstacles and taps/clicks to create an echo. **Verbs:** steer, tap (spawn echo).

## Core loop
1. The player is automatically propelled forward.
2. The player steers to weave between incoming obstacles.
3. After a short cooldown, the player can tap to spawn an echo at the current position.
4. The echo follows the exact recent path of the player for a few seconds, destroying any obstacles it meets.
5. The player continues forward, using the cleared corridor to advance further.
The loop repeats every 1–3 seconds, with the player deciding when and where to place the echo to maximize obstacle removal.

## Hazards / Obstacles
- **Static blocks:** Fixed rectangular shapes that sit in the track; colliding ends the run.
- **Sweeping barriers:** Horizontal or vertical bars that move back‑and‑forth, telegraphing their path with a faint line before moving.
- **Spiked spikes:** Pointy protrusions that appear briefly then retract; they kill on contact.
- **Delayed mines:** Appear a moment after the player passes, forcing the player to use the echo to clear the space before they become active.

## Score
- Destroying an obstacle with the echo awards points.
- Successfully navigating past a hazard without taking damage awards a small bonus.
- Each full echo that clears at least three obstacles grants a combo multiplier.

## Win and lose
- **Lose:** The player collides with any obstacle while the game is in "playing" state.
- **Win:** Survive until a predetermined distance (e.g., 2000 units) or time limit (e.g., 2 minutes), at which point the game displays a victory screen.

## Feel
A steady but tension‑building pace that ramps up as obstacles become more frequent. Neon‑glow visual style on a dark background, with crisp electronic sound effects for echo activation, obstacle destruction, and player death. The experience feels rhythmic and rewarding, like a dance of light and shadow.

## Why it's fun
The single, thrilling moment when your echo races along the path you just forged and vaporizes every obstacle in its wake.