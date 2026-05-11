## Concept

The player taps to instantly warp the dot forward a set distance, leaping over upcoming obstacles. The warp has a short cooldown, so timing each jump is critical and satisfying.

## Player

The avatar is a glowing quantum dot that moves continuously forward through a scrolling tunnel. Its only verb is "warp" (triggered by a tap/click) that instantly displaces it forward by a fixed amount; after warping it enters a brief cooldown during which no further warps can be performed.

## Core loop

1. The dot drifts forward at a steady pace while obstacles scroll toward it.
2. The player watches the next obstacles and decides whether to warp now or wait.
3. When they tap, the dot instantly leaps forward, bypassing any obstacles within the warp range, then enters the cooldown timer.
4. The cycle repeats, with obstacles becoming denser as the game progresses, forcing the player to balance risk and timing.

## Hazards / Obstacles

- **Static blocks**: Fixed-size barriers that occupy part of the tunnel; a warp must clear them completely.
- **Sweeping barriers**: Horizontal or vertical sweeps that move across the path; timing a warp to avoid their active phase is required.
- **Pulsing spikes**: Spikes that appear and disappear in sync with a rhythm; warping during the "off" phase lets the player pass.
- **Projectile bursts**: Short-lived bursts that travel forward; if the player is within their path they die; a correctly timed warp can outrun them.

## Score

- Each successful warp that clears at least one obstacle awards points.
- Each obstacle passed without warping (by simply drifting) gives a small bonus.
- Combo multiplier increases when multiple warps are performed in quick succession.

## Win and lose

- Lose: Collision with any obstacle while not in a warp state ends the game instantly.
- Win: Reaching a predefined distance (e.g., the end of the level) or surviving a set time threshold triggers a victory screen.

## Feel

The game feels tense yet rhythmic, with a steady forward motion punctuated by crisp, instant jumps. Visuals are neon-glow on a dark backdrop, evoking a futuristic tunnel. Audio consists of a sharp "whoosh" on each warp and subtle ambient pulses that heighten anticipation.

## Why it's fun

The thrill of pulling off a perfectly-timed warp just before an obstacle hits creates that instant "yes!" moment that makes players grin or gasp with delight.